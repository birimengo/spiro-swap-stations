import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import crypto from "crypto";

dotenv.config();

// ============ HELPER FUNCTIONS ============
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateObjectId() {
  return new ObjectId();
}

// ============ SAMPLE ADMINS ============
const sampleAdmins = [
  // Super Admin
  {
    username: "superadmin",
    password: hashPassword("admin123"),
    email: "super.admin@spiro.com",
    fullName: "Super Admin",
    phone: "+254 700 000001",
    role: "superadmin",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stationsAdded: 0,
    permissions: {
      canAddStations: true,
      canEditStations: true,
      canDeleteStations: true,
      canManageAdmins: true,
      canViewReports: true,
      canManageUsers: true
    }
  },
  
  // Regular Admin - Nairobi Region
  {
    username: "admin_nairobi",
    password: hashPassword("admin123"),
    email: "admin.nairobi@spiro.com",
    fullName: "James Omondi",
    phone: "+254 722 111222",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stationsAdded: 0,
    permissions: {
      canAddStations: true,
      canEditStations: true,
      canDeleteStations: false,
      canManageAdmins: false,
      canViewReports: true,
      canManageUsers: false
    }
  },
  
  // Regular Admin - Mombasa Region
  {
    username: "admin_mombasa",
    password: hashPassword("admin123"),
    email: "admin.mombasa@spiro.com",
    fullName: "Fatma Hassan",
    phone: "+254 733 333444",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stationsAdded: 0,
    permissions: {
      canAddStations: true,
      canEditStations: true,
      canDeleteStations: false,
      canManageAdmins: false,
      canViewReports: true,
      canManageUsers: false
    }
  },
  
  // Regular Admin - Kisumu Region
  {
    username: "admin_kisumu",
    password: hashPassword("admin123"),
    email: "admin.kisumu@spiro.com",
    fullName: "Peter Otieno",
    phone: "+254 744 555666",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stationsAdded: 0,
    permissions: {
      canAddStations: true,
      canEditStations: true,
      canDeleteStations: false,
      canManageAdmins: false,
      canViewReports: true,
      canManageUsers: false
    }
  },
  
  // Inactive Admin (for testing)
  {
    username: "inactive_admin",
    password: hashPassword("admin123"),
    email: "inactive@spiro.com",
    fullName: "Inactive User",
    phone: "+254 755 777888",
    role: "admin",
    isActive: false,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stationsAdded: 0,
    permissions: {
      canAddStations: false,
      canEditStations: false,
      canDeleteStations: false,
      canManageAdmins: false,
      canViewReports: false,
      canManageUsers: false
    }
  }
];

// ============ SAMPLE STATIONS WITH REVIEWS ============
const sampleStations = [
  // Nairobi Region Stations
  {
    name: "Spiro Hub Karen",
    phone: "+254 700 123456",
    latitude: -1.3189,
    longitude: 36.7487,
    address: "Karen Shopping Centre, Nairobi",
    addedBy: "admin_nairobi",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [36.7487, -1.3189]
    },
    totalBatteries: 20,
    availableBatteries: 15,
    operatingHours: "6:00 AM - 10:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "John Doe",
        rating: 5,
        comment: "Fast service, plenty of batteries available. The staff is very helpful.",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        _id: generateObjectId(),
        userName: "Jane Smith",
        rating: 4,
        comment: "Quick swap, friendly staff. Sometimes busy during peak hours.",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        _id: generateObjectId(),
        userName: "Michael Ochieng",
        rating: 5,
        comment: "Best swap station in Karen. Always well maintained.",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ]
  },
  
  {
    name: "Spiro Express Westlands",
    phone: "+254 711 789012",
    latitude: -1.2675,
    longitude: 36.8025,
    address: "Westlands Square, Nairobi",
    addedBy: "admin_nairobi",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [36.8025, -1.2675]
    },
    totalBatteries: 15,
    availableBatteries: 3,
    operatingHours: "24/7",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "Mike Johnson",
        rating: 3,
        comment: "Busy during peak hours, but service is quick.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: generateObjectId(),
        userName: "Sarah Wanjiku",
        rating: 4,
        comment: "Convenient location, always open. Batteries are well charged.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  {
    name: "Spiro Station CBD",
    phone: "+254 722 345678",
    latitude: -1.2833,
    longitude: 36.8167,
    address: "Moi Avenue, Nairobi CBD",
    addedBy: "admin_nairobi",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [36.8167, -1.2833]
    },
    totalBatteries: 25,
    availableBatteries: 0,
    operatingHours: "8:00 AM - 8:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "David Kariuki",
        rating: 2,
        comment: "No batteries available when I visited. Need better stock management.",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  {
    name: "Spiro Kilimani",
    phone: "+254 733 901234",
    latitude: -1.2895,
    longitude: 36.7845,
    address: "Kilimani Mall, Nairobi",
    addedBy: "admin_nairobi",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [36.7845, -1.2895]
    },
    totalBatteries: 12,
    availableBatteries: 8,
    operatingHours: "7:00 AM - 9:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "Lucy Mwangi",
        rating: 5,
        comment: "Excellent service, clean station, friendly attendant.",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: generateObjectId(),
        userName: "Brian Odhiambo",
        rating: 4,
        comment: "Good location, always has batteries. Parking can be tricky.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  // Mombasa Region Stations
  {
    name: "Spiro Mombasa CBD",
    phone: "+254 744 567890",
    latitude: -4.0435,
    longitude: 39.6682,
    address: "Moi Avenue, Mombasa",
    addedBy: "admin_mombasa",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [39.6682, -4.0435]
    },
    totalBatteries: 18,
    availableBatteries: 12,
    operatingHours: "6:00 AM - 10:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "Ahmed Hassan",
        rating: 5,
        comment: "Great station, very helpful staff. Always fully stocked.",
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: generateObjectId(),
        userName: "Mary Wambui",
        rating: 4,
        comment: "Clean and well organized. Good location in town.",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  {
    name: "Spiro Nyali",
    phone: "+254 755 678901",
    latitude: -4.0335,
    longitude: 39.7142,
    address: "Nyali Centre, Mombasa",
    addedBy: "admin_mombasa",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [39.7142, -4.0335]
    },
    totalBatteries: 10,
    availableBatteries: 10,
    operatingHours: "8:00 AM - 8:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "James Mwangi",
        rating: 5,
        comment: "Brand new station, very clean. Plenty of batteries.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  // Kisumu Region Stations
  {
    name: "Spiro Kisumu CBD",
    phone: "+254 766 789012",
    latitude: -0.1022,
    longitude: 34.7617,
    address: "Oginga Odinga Street, Kisumu",
    addedBy: "admin_kisumu",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [34.7617, -0.1022]
    },
    totalBatteries: 15,
    availableBatteries: 7,
    operatingHours: "7:00 AM - 9:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: [
      {
        _id: generateObjectId(),
        userName: "Odhiambo Okoth",
        rating: 4,
        comment: "Good station, well located. Staff is friendly.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  
  {
    name: "Spiro Milimani",
    phone: "+254 777 890123",
    latitude: -0.0917,
    longitude: 34.7689,
    address: "Milimani Estate, Kisumu",
    addedBy: "admin_kisumu",
    addedDate: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [34.7689, -0.0917]
    },
    totalBatteries: 8,
    availableBatteries: 2,
    operatingHours: "8:00 AM - 6:00 PM",
    status: "active",
    lastUpdated: new Date().toISOString(),
    reviews: []
  }
];

// ============ SEED FUNCTION ============
async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db("spiro");
    
    // Clear existing data
    await db.collection("admins").deleteMany({});
    await db.collection("stations").deleteMany({});
    console.log("🗑️ Cleared existing data");
    
    // Insert admins
    const adminResult = await db.collection("admins").insertMany(sampleAdmins);
    console.log(`✅ Added ${adminResult.insertedCount} admins`);
    
    // Insert stations with reviews
    const stationResult = await db.collection("stations").insertMany(sampleStations);
    console.log(`✅ Added ${stationResult.insertedCount} stations with reviews`);
    
    // Update stationsAdded count for admins
    const stationCounts = {};
    sampleStations.forEach(station => {
      stationCounts[station.addedBy] = (stationCounts[station.addedBy] || 0) + 1;
    });
    
    for (const [adminUsername, count] of Object.entries(stationCounts)) {
      await db.collection("admins").updateOne(
        { username: adminUsername },
        { $set: { stationsAdded: count } }
      );
    }
    
    // Display summary
    console.log("\n📊 ===== SEED COMPLETED SUCCESSFULLY =====");
    
    // Show admins
    const admins = await db.collection("admins").find({}).project({ password: 0 }).toArray();
    console.log("\n👥 ADMINS:");
    admins.forEach((a, i) => {
      console.log(`   ${i+1}. ${a.fullName} (${a.username}) - ${a.role} - Stations: ${a.stationsAdded || 0}`);
    });
    
    // Show stations by region
    console.log("\n📍 STATIONS BY REGION:");
    const stations = await db.collection("stations").find({}).toArray();
    
    const nairobiStations = stations.filter(s => s.latitude > -2 && s.latitude < 0);
    const mombasaStations = stations.filter(s => s.latitude < -3);
    const kisumuStations = stations.filter(s => s.latitude > -1 && s.latitude < 0 && s.longitude < 35);
    
    console.log(`   Nairobi: ${nairobiStations.length} stations`);
    console.log(`   Mombasa: ${mombasaStations.length} stations`);
    console.log(`   Kisumu: ${kisumuStations.length} stations`);
    console.log(`   Total: ${stations.length} stations`);
    
    // Show review stats
    const totalReviews = stations.reduce((sum, s) => sum + (s.reviews?.length || 0), 0);
    console.log(`\n⭐ REVIEWS: ${totalReviews} total reviews`);
    
    // Show login credentials
    console.log("\n🔑 LOGIN CREDENTIALS:");
    console.log("   superadmin / admin123");
    console.log("   admin_nairobi / admin123");
    console.log("   admin_mombasa / admin123");
    console.log("   admin_kisumu / admin123");
    console.log("   inactive_admin / admin123 (inactive account)");
    
    // Show sample station with reviews
    const sampleStation = stations.find(s => s.reviews?.length > 0);
    if (sampleStation) {
      console.log(`\n📝 SAMPLE STATION: ${sampleStation.name}`);
      console.log(`   Address: ${sampleStation.address}`);
      console.log(`   Batteries: ${sampleStation.availableBatteries}/${sampleStation.totalBatteries}`);
      console.log(`   Reviews: ${sampleStation.reviews.length}`);
      sampleStation.reviews.slice(0, 2).forEach((r, i) => {
        console.log(`   ⭐ ${r.rating}/5 - ${r.userName}: "${r.comment.substring(0, 50)}..."`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run seed
seedDatabase();
