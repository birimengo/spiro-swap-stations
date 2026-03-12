import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stations API
export const getStations = async () => {
  const response = await api.get('/stations');
  return response.data;
};

export const getNearbyStations = async (lat, lng, radius = 10) => {
  const response = await api.get(`/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  return response.data;
};

export const getStationsByAdmin = async (adminName) => {
  const response = await api.get(`/stations/admin/${adminName}`);
  return response.data;
};

export const addStation = async (stationData) => {
  const response = await api.post('/stations', stationData);
  return response.data;
};

export const updateStation = async (id, stationData) => {
  const response = await api.put(`/stations/${id}`, stationData);
  return response.data;
};

export const deleteStation = async (id) => {
  const response = await api.delete(`/stations/${id}`);
  return response.data;
};

// Reviews API
export const getReviews = async (stationId) => {
  const response = await api.get(`/reviews/${stationId}/reviews`);
  return response.data;
};

export const addReview = async (stationId, reviewData) => {
  const response = await api.post(`/reviews/${stationId}/reviews`, reviewData);
  return response.data;
};

export const getAverageRating = async (stationId) => {
  const response = await api.get(`/reviews/${stationId}/rating`);
  return response.data;
};

export default api;