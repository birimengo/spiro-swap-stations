import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase, closeConnection } from "./utils/database.js";
import stationRoutes from "./routes/stations.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";  // NEW
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/stations", stationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);  // NEW

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Spiro API is running",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   POST /api/admin/register`);
    console.log(`   POST /api/admin/login`);
    console.log(`   GET  /api/admin/verify`);
    console.log(`   GET  /api/stations`);
    console.log(`   GET  /api/stations/nearby?lat=-1.28&lng=36.82&radius=10`);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});
