import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

// Add SSL/TLS options for Render deployment
const client = new MongoClient(uri, {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true, // This helps with some SSL issues
  serverSelectionTimeoutMS: 30000,    // Timeout after 30 seconds
  socketTimeoutMS: 45000,              // Socket timeout
});

let db;

export async function connectToDatabase() {
  try {
    console.log("📡 Attempting to connect to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    db = client.db("spiro");
    
    // Create indexes (with error handling)
    try {
      await db.collection("stations").createIndex({ location: "2dsphere" });
      await db.collection("stations").createIndex({ addedBy: 1 });
      await db.collection("admins").createIndex({ username: 1 }, { unique: true });
      await db.collection("admins").createIndex({ email: 1 }, { unique: true });
      await db.collection("admins").createIndex({ role: 1 });
      console.log("✅ Database indexes created");
    } catch (indexError) {
      console.log("⚠️ Index creation warning:", indexError.message);
      // Continue even if indexes fail - they might already exist
    }
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.error("🔍 Connection string used:", uri.replace(/:[^:]*@/, ':****@')); // Log URI without password
    throw error; // Don't exit immediately, let the calling code handle it
  }
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export async function closeConnection() {
  try {
    await client.close();
    console.log("👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error closing connection:", error);
  }
}