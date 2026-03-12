import express from "express";
import {
  getStationReviews,
  addReview,
  deleteReview,
  getAverageRating
} from "../controllers/reviewController.js";

const router = express.Router();

// Review routes
router.get("/:stationId/reviews", getStationReviews);
router.post("/:stationId/reviews", addReview);
router.delete("/:stationId/reviews/:reviewId", deleteReview);
router.get("/:stationId/rating", getAverageRating);

export default router;
