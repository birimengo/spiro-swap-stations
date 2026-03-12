import axios from 'axios';

// Use environment variable with fallback for local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

console.log('📡 API Base URL:', BASE_URL); // Helpful for debugging

// Create axios instance with auth header
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout for Render free tier
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - backend may be waking up:', error.message);
    } else if (error.response) {
      console.error(`❌ API Error ${error.response.status}:`, error.response.data);
    } else {
      console.error('❌ Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Stations API
export const getStations = async () => {
  try {
    console.log('📡 Fetching stations from:', `${BASE_URL}/stations`);
    const response = await api.get('/stations');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch stations:', error.message);
    throw error;
  }
};

export const getNearbyStations = async (lat, lng, radius = 10) => {
  try {
    const response = await api.get(`/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch nearby stations:', error.message);
    throw error;
  }
};

export const getStationsByAdmin = async (adminName) => {
  try {
    const response = await api.get(`/stations/admin/${adminName}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch admin stations:', error.message);
    throw error;
  }
};

export const addStation = async (stationData) => {
  try {
    const response = await api.post('/stations', stationData);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to add station:', error.message);
    throw error;
  }
};

export const updateStation = async (id, stationData) => {
  try {
    const response = await api.put(`/stations/${id}`, stationData);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update station:', error.message);
    throw error;
  }
};

export const deleteStation = async (id) => {
  try {
    const response = await api.delete(`/stations/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to delete station:', error.message);
    throw error;
  }
};

// Reviews API
export const getReviews = async (stationId) => {
  try {
    const response = await api.get(`/reviews/${stationId}/reviews`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch reviews:', error.message);
    throw error;
  }
};

export const addReview = async (stationId, reviewData) => {
  try {
    const response = await api.post(`/reviews/${stationId}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to add review:', error.message);
    throw error;
  }
};

export const getAverageRating = async (stationId) => {
  try {
    const response = await api.get(`/reviews/${stationId}/rating`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch average rating:', error.message);
    throw error;
  }
};

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return null;
  }
};

export default api;