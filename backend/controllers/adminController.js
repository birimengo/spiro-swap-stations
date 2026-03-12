import { ObjectId } from "mongodb";
import { getDb } from "../utils/database.js";
import { Admin } from "../models/Admin.js";
import crypto from "crypto";

// Simple hash function (in production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate simple token (in production, use JWT)
function generateToken(admin) {
  const data = {
    id: admin._id,
    username: admin.username,
    role: admin.role,
    timestamp: Date.now()
  };
  const base64Data = Buffer.from(JSON.stringify(data)).toString("base64");
  return base64Data;
}

// Verify token
export function verifyToken(token) {
  try {
    const data = JSON.parse(Buffer.from(token, "base64").toString());
    return data;
  } catch (error) {
    return null;
  }
}

// Register new admin
export async function registerAdmin(req, res) {
  try {
    const { username, password, email, fullName, phone, role } = req.body;
    
    // Check if admin already exists
    const db = getDb();
    const existingAdmin = await db.collection("admins").findOne({
      $or: [
        { username },
        { email }
      ]
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        error: "Admin with this username or email already exists" 
      });
    }
    
    // Create new admin
    const adminData = new Admin({
      username,
      password: hashPassword(password),
      email,
      fullName,
      phone,
      role: role || "admin"
    });
    
    // Validate
    const errors = adminData.validate();
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Insert into database
    const result = await db.collection("admins").insertOne(adminData.toJSON());
    
    // Get created admin
    const newAdmin = await db.collection("admins").findOne({
      _id: result.insertedId
    });
    
    // Return safe data without password
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        role: newAdmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Login admin
export async function loginAdmin(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: "Username and password required" 
      });
    }
    
    const db = getDb();
    const hashedPassword = hashPassword(password);
    
    // Find admin
    const admin = await db.collection("admins").findOne({
      $or: [
        { username },
        { email: username }
      ],
      password: hashedPassword,
      isActive: true
    });
    
    if (!admin) {
      return res.status(401).json({ 
        error: "Invalid credentials or inactive account" 
      });
    }
    
    // Update last login
    await db.collection("admins").updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date().toISOString() } }
    );
    
    // Generate token
    const token = generateToken(admin);
    
    res.json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
        stationsAdded: admin.stationsAdded
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all admins (superadmin only)
export async function getAllAdmins(req, res) {
  try {
    const db = getDb();
    const admins = await db.collection("admins")
      .find({})
      .project({ password: 0 }) // Exclude password
      .toArray();
    
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get admin by ID
export async function getAdminById(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const admin = await db.collection("admins").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
    
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    // Get stations added by this admin
    const stations = await db.collection("stations")
      .find({ addedBy: admin.username })
      .toArray();
    
    res.json({
      ...admin,
      stationsAdded: stations.length,
      stations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update admin
export async function updateAdmin(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const requestingAdmin = req.admin; // From auth middleware
    
    // Check if requesting admin has permission
    if (requestingAdmin.role !== "superadmin" && requestingAdmin._id.toString() !== id) {
      return res.status(403).json({ 
        error: "You don't have permission to update this admin" 
      });
    }
    
    const db = getDb();
    
    // Remove sensitive fields
    delete updates.password;
    delete updates._id;
    
    const result = await db.collection("admins").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Admin updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Change password
export async function changePassword(req, res) {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const requestingAdmin = req.admin;
    
    // Check permission
    if (requestingAdmin._id.toString() !== id) {
      return res.status(403).json({ 
        error: "You can only change your own password" 
      });
    }
    
    const db = getDb();
    const admin = await db.collection("admins").findOne({
      _id: new ObjectId(id)
    });
    
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    // Verify old password
    if (admin.password !== hashPassword(oldPassword)) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }
    
    // Update password
    await db.collection("admins").updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashPassword(newPassword) } }
    );
    
    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete admin (superadmin only)
export async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    const requestingAdmin = req.admin;
    
    if (requestingAdmin.role !== "superadmin") {
      return res.status(403).json({ 
        error: "Only superadmin can delete admins" 
      });
    }
    
    // Don't allow deleting yourself
    if (requestingAdmin._id.toString() === id) {
      return res.status(400).json({ 
        error: "Cannot delete your own account" 
      });
    }
    
    const db = getDb();
    const result = await db.collection("admins").deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Admin deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Increment stations added count
export async function incrementStationsCount(adminUsername) {
  try {
    const db = getDb();
    await db.collection("admins").updateOne(
      { username: adminUsername },
      { $inc: { stationsAdded: 1 } }
    );
  } catch (error) {
    console.error("Error incrementing station count:", error);
  }
}

// Verify admin token middleware
export async function verifyAdminToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
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
}
