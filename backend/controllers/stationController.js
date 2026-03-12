import { ObjectId } from "mongodb";
import { getDb } from "../utils/database.js";
import { Station } from "../models/Station.js";

// Get all stations
export async function getAllStations(req, res) {
  try {
    const db = getDb();
    const stations = await db.collection("stations")
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get nearby stations
export async function getNearbyStations(req, res) {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const db = getDb();
    
    const stations = await db.collection("stations").find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) * 1000
        }
      }
    }).toArray();

    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get station by ID
export async function getStationById(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const station = await db.collection("stations").findOne({
      _id: new ObjectId(id)
    });
    
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create new station
export async function createStation(req, res) {
  try {
    const stationData = new Station(req.body);
    
    // Validate
    const errors = stationData.validate();
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    const db = getDb();
    const result = await db.collection("stations").insertOne(stationData.toJSON());
    
    res.status(201).json({
      _id: result.insertedId,
      ...stationData.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update station
export async function updateStation(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const db = getDb();
    
    // Prepare update data
    const updateData = {
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Update location if coordinates changed
    if (updates.latitude && updates.longitude) {
      updateData.location = {
        type: "Point",
        coordinates: [parseFloat(updates.longitude), parseFloat(updates.latitude)]
      };
    }
    
    const result = await db.collection("stations").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete station
export async function deleteStation(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const result = await db.collection("stations").deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.json({ success: true, message: "Station deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get stations by admin
export async function getStationsByAdmin(req, res) {
  try {
    const { adminName } = req.params;
    const db = getDb();
    
    const stations = await db.collection("stations")
      .find({ addedBy: adminName })
      .toArray();
    
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
