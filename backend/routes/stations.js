import express from "express";
import {
  getAllStations,
  getNearbyStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  getStationsByAdmin
} from "../controllers/stationController.js";

const router = express.Router();

// Station routes
router.get("/", getAllStations);
router.get("/nearby", getNearbyStations);
router.get("/admin/:adminName", getStationsByAdmin);
router.get("/:id", getStationById);
router.post("/", createStation);
router.put("/:id", updateStation);
router.delete("/:id", deleteStation);

export default router;
