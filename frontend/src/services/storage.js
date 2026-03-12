import { openDB } from 'idb';

const DB_NAME = 'spiro-offline-db';
const DB_VERSION = 3;

// Initialize database
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);
      
      // Stations store
      if (!db.objectStoreNames.contains('stations')) {
        const stationStore = db.createObjectStore('stations', { keyPath: '_id' });
        stationStore.createIndex('by_name', 'name');
        stationStore.createIndex('by_location', ['latitude', 'longitude']);
        stationStore.createIndex('by_admin', 'addedBy');
      }
      
      // Reviews store (for offline reviews)
      if (!db.objectStoreNames.contains('reviews')) {
        const reviewStore = db.createObjectStore('reviews', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        reviewStore.createIndex('by_station', 'stationId');
        reviewStore.createIndex('by_sync', 'synced');
      }
      
      // Pending changes for offline sync
      if (!db.objectStoreNames.contains('pending_changes')) {
        const pendingStore = db.createObjectStore('pending_changes', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('by_type', 'type');
        pendingStore.createIndex('by_timestamp', 'timestamp');
      }
      
      // Last sync timestamp
      if (!db.objectStoreNames.contains('sync_status')) {
        db.createObjectStore('sync_status');
      }
    },
  });
};

// ============ STATION OPERATIONS ============

// Save stations to local DB
export const saveStations = async (stations) => {
  try {
    const db = await initDB();
    const tx = db.transaction('stations', 'readwrite');
    
    // Clear existing stations
    await tx.store.clear();
    
    // Add all stations
    for (const station of stations) {
      await tx.store.add(station);
    }
    
    await tx.done;
    console.log(`✅ Saved ${stations.length} stations offline`);
    return true;
  } catch (error) {
    console.error('Failed to save stations:', error);
    return false;
  }
};

// Get all stations from local DB
export const getLocalStations = async () => {
  try {
    const db = await initDB();
    const stations = await db.getAll('stations');
    return stations || [];
  } catch (error) {
    console.error('Failed to get local stations:', error);
    return [];
  }
};

// Get station by ID
export const getLocalStationById = async (id) => {
  try {
    const db = await initDB();
    return await db.get('stations', id);
  } catch (error) {
    console.error('Failed to get station:', error);
    return null;
  }
};

// Add a single station to local DB
export const addLocalStation = async (station) => {
  try {
    const db = await initDB();
    await db.put('stations', station);
    return true;
  } catch (error) {
    console.error('Failed to add local station:', error);
    return false;
  }
};

// Update station in local DB
export const updateLocalStation = async (id, updates) => {
  try {
    const db = await initDB();
    const station = await db.get('stations', id);
    if (station) {
      const updated = { ...station, ...updates };
      await db.put('stations', updated);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update local station:', error);
    return false;
  }
};

// Delete station from local DB
export const deleteLocalStation = async (id) => {
  try {
    const db = await initDB();
    await db.delete('stations', id);
    return true;
  } catch (error) {
    console.error('Failed to delete local station:', error);
    return false;
  }
};

// ============ REVIEW OPERATIONS ============

// Save reviews for a station
export const saveReviews = async (stationId, reviews) => {
  try {
    const db = await initDB();
    const tx = db.transaction('reviews', 'readwrite');
    
    // Delete old reviews for this station
    const oldReviews = await tx.store.index('by_station').getAll(stationId);
    for (const review of oldReviews) {
      await tx.store.delete(review.id);
    }
    
    // Add new reviews
    for (const review of reviews) {
      await tx.store.add({
        ...review,
        stationId,
        synced: true
      });
    }
    
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to save reviews:', error);
    return false;
  }
};

// Get reviews for a station
export const getLocalReviews = async (stationId) => {
  try {
    const db = await initDB();
    return await db.getAllFromIndex('reviews', 'by_station', stationId);
  } catch (error) {
    console.error('Failed to get local reviews:', error);
    return [];
  }
};

// Add review (works offline!)
export const addLocalReview = async (stationId, reviewData) => {
  try {
    const db = await initDB();
    
    const review = {
      stationId,
      ...reviewData,
      date: new Date().toISOString(),
      synced: false,
      offlineId: `offline_${Date.now()}_${Math.random().toString(36)}`
    };
    
    const id = await db.add('reviews', review);
    
    // Add to pending changes
    await db.add('pending_changes', {
      type: 'ADD_REVIEW',
      stationId,
      data: reviewData,
      offlineId: review.offlineId,
      timestamp: Date.now()
    });
    
    return { ...review, id };
  } catch (error) {
    console.error('Failed to add local review:', error);
    return null;
  }
};

// ============ PENDING CHANGES ============

// Get all pending changes
export const getPendingChanges = async () => {
  try {
    const db = await initDB();
    return await db.getAll('pending_changes');
  } catch (error) {
    console.error('Failed to get pending changes:', error);
    return [];
  }
};

// Add pending change
export const addPendingChange = async (change) => {
  try {
    const db = await initDB();
    return await db.add('pending_changes', {
      ...change,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to add pending change:', error);
    return null;
  }
};

// Remove pending change
export const removePendingChange = async (id) => {
  try {
    const db = await initDB();
    await db.delete('pending_changes', id);
    return true;
  } catch (error) {
    console.error('Failed to remove pending change:', error);
    return false;
  }
};

// Clear all pending changes
export const clearPendingChanges = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('pending_changes', 'readwrite');
    await tx.store.clear();
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to clear pending changes:', error);
    return false;
  }
};

// ============ SYNC STATUS ============

// Update last sync time
export const updateLastSync = async () => {
  try {
    const db = await initDB();
    await db.put('sync_status', Date.now(), 'last_sync');
    return true;
  } catch (error) {
    console.error('Failed to update sync status:', error);
    return false;
  }
};

// Get last sync time
export const getLastSync = async () => {
  try {
    const db = await initDB();
    return await db.get('sync_status', 'last_sync') || 0;
  } catch (error) {
    console.error('Failed to get last sync:', error);
    return 0;
  }
};

// ============ OFFLINE UTILITIES ============

// Check if we're online
export const isOnline = () => {
  return navigator.onLine;
};

// Clear all data (for testing)
export const clearAllData = async () => {
  try {
    const db = await initDB();
    
    // Clear all stores
    const stores = ['stations', 'reviews', 'pending_changes', 'sync_status'];
    
    for (const storeName of stores) {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readwrite');
        await tx.store.clear();
        await tx.done;
      }
    }
    
    console.log('✅ All offline data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};

// Get storage info
export const getStorageInfo = async () => {
  try {
    const db = await initDB();
    const info = {};
    
    for (const storeName of db.objectStoreNames) {
      const count = await db.count(storeName);
      info[storeName] = count;
    }
    
    return info;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {};
  }
};

// ============ SYNC WITH SERVER ============

// Sync all pending changes
export const syncWithServer = async (apiSyncFunctions) => {
  if (!isOnline()) {
    console.log('📱 Offline: Cannot sync');
    return { synced: false, reason: 'offline' };
  }
  
  try {
    const db = await initDB();
    const pending = await db.getAll('pending_changes');
    
    if (pending.length === 0) {
      await updateLastSync();
      return { synced: true, count: 0 };
    }
    
    console.log(`🔄 Syncing ${pending.length} pending changes...`);
    let synced = 0;
    let failed = 0;
    
    for (const change of pending) {
      try {
        if (change.type === 'ADD_REVIEW' && apiSyncFunctions.addReview) {
          await apiSyncFunctions.addReview(change.stationId, change.data);
          await db.delete('pending_changes', change.id);
          synced++;
        }
      } catch (error) {
        console.error('Sync failed for change:', change.id, error);
        failed++;
      }
    }
    
    await updateLastSync();
    
    return {
      synced: true,
      count: synced,
      failed,
      total: pending.length
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return { synced: false, error: error.message };
  }
};