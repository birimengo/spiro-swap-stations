import { ObjectId } from "mongodb";
import { getDb } from "../utils/database.js";

// Get all reviews for a station
export async function getStationReviews(req, res) {
  try {
    const { stationId } = req.params;
    const db = getDb();
    
    const station = await db.collection("stations").findOne(
      { _id: new ObjectId(stationId) },
      { projection: { reviews: 1 } }
    );
    
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.json(station.reviews || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Add review to station
export async function addReview(req, res) {
  try {
    const { stationId } = req.params;
    const { userName, rating, comment } = req.body;
    
    if (!userName || !rating) {
      return res.status(400).json({ 
        error: "User name and rating are required" 
      });
    }
    
    const review = {
      _id: new ObjectId(),
      userName,
      rating: parseInt(rating),
      comment: comment || "",
      date: new Date().toISOString()
    };
    
    const db = getDb();
    const result = await db.collection("stations").updateOne(
      { _id: new ObjectId(stationId) },
      { $push: { reviews: review } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete a review
export async function deleteReview(req, res) {
  try {
    const { stationId, reviewId } = req.params;
    const db = getDb();
    
    const result = await db.collection("stations").updateOne(
      { _id: new ObjectId(stationId) },
      { $pull: { reviews: { _id: new ObjectId(reviewId) } } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get average rating for a station
export async function getAverageRating(req, res) {
  try {
    const { stationId } = req.params;
    const db = getDb();
    
    const station = await db.collection("stations").findOne(
      { _id: new ObjectId(stationId) },
      { projection: { reviews: 1 } }
    );
    
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    
    const reviews = station.reviews || [];
    const average = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    res.json({
      average: Math.round(average * 10) / 10,
      total: reviews.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
