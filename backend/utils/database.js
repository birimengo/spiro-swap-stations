import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    db = client.db("spiro");
    
    // Create indexes
    await db.collection("stations").createIndex({ location: "2dsphere" });
    await db.collection("stations").createIndex({ addedBy: 1 });
    
    // Admin indexes
    await db.collection("admins").createIndex({ username: 1 }, { unique: true });
    await db.collection("admins").createIndex({ email: 1 }, { unique: true });
    await db.collection("admins").createIndex({ role: 1 });
    
    console.log("✅ Database indexes created");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export async function closeConnection() {
  await client.close();
  console.log("👋 Disconnected from MongoDB");
}
