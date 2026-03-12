import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase, closeConnection } from "./utils/database.js";
import stationRoutes from "./routes/stations.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
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
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Spiro API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server with better error handling
async function startServer() {
  try {
    console.log("📡 Connecting to database...");
    await connectToDatabase();
    
    // Bind to 0.0.0.0 for Render
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   POST /api/admin/register`);
      console.log(`   POST /api/admin/login`);
      console.log(`   GET  /api/admin/verify`);
      console.log(`   GET  /api/stations`);
      console.log(`   GET  /api/stations/nearby?lat=-1.28&lng=36.82&radius=10`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("👋 Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("👋 Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});