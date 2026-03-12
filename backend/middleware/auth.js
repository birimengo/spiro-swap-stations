import { verifyToken } from "../controllers/adminController.js";
import { getDb } from "../utils/database.js";
import { ObjectId } from "mongodb";

// Authentication middleware
export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    const db = getDb();
    const admin = await db.collection("admins").findOne({
      _id: new ObjectId(decoded.id),
      isActive: true
    });
    
    if (!admin) {
      return res.status(401).json({ error: "Admin not found or inactive" });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
}

// Authorization middleware for superadmin only
export function requireSuperAdmin(req, res, next) {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ 
      error: "This action requires superadmin privileges" 
    });
  }
  next();
}

// Check if admin can modify station
export async function canModifyStation(req, res, next) {
  const { id } = req.params;
  const db = getDb();
  
  const station = await db.collection("stations").findOne({
    _id: new ObjectId(id)
  });
  
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }
  
  // Superadmin can modify any station
  if (req.admin.role === "superadmin") {
    req.station = station;
    return next();
  }
  
  // Regular admin can only modify their own stations
  if (station.addedBy !== req.admin.username) {
    return res.status(403).json({ 
      error: "You can only modify stations you added" 
    });
  }
  
  // Check if admin has permission
  if (!req.admin.permissions.canEditStations) {
    return res.status(403).json({ 
      error: "You don't have permission to edit stations" 
    });
  }
  
  req.station = station;
  next();
}

// Check if admin can delete station
export async function canDeleteStation(req, res, next) {
  const { id } = req.params;
  const db = getDb();
  
  const station = await db.collection("stations").findOne({
    _id: new ObjectId(id)
  });
  
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }
  
  // Superadmin can delete any station
  if (req.admin.role === "superadmin") {
    return next();
  }
  
  // Check if admin has delete permission
  if (!req.admin.permissions.canDeleteStations) {
    return res.status(403).json({ 
      error: "You don't have permission to delete stations" 
    });
  }
  
  // Regular admin can only delete their own stations
  if (station.addedBy !== req.admin.username) {
    return res.status(403).json({ 
      error: "You can only delete stations you added" 
    });
  }
  
  next();
}
