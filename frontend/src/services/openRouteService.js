import axios from 'axios';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';

// Open Source Routing Machine (OSRM) - Free, no API key required
const OSRM_URL = 'https://router.project-osrm.org/route/v1';

// GraphHopper - Free tier with API key (sign up at https://www.graphhopper.com/)
const GRAPHHOPPER_URL = 'https://graphhopper.com/api/1/route';
const GRAPHHOPPER_KEY = 'YOUR_GRAPHHOPPER_KEY'; // Optional, get free key

// Get route using OSRM (completely free)
export const getRouteOSRM = async (start, end, profile = 'driving') => {
  try {
    const url = `${OSRM_URL}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;
    
    const response = await axios.get(url);
    
    if (response.data.code === 'Ok') {
      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: route.distance / 1000, // km
        duration: route.duration / 60, // minutes
        steps: route.legs[0].steps,
        polyline: route.geometry
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM route error:', error);
    return null;
  }
};

// Get alternative routes
export const getAlternativeRoutes = async (start, end, profile = 'driving') => {
  try {
    const url = `${OSRM_URL}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=3`;
    
    const response = await axios.get(url);
    
    if (response.data.code === 'Ok') {
      return response.data.routes.map(route => ({
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: route.distance / 1000,
        duration: route.duration / 60,
        isAlternative: true
      }));
    }
    return [];
  } catch (error) {
    console.error('Alternative routes error:', error);
    return [];
  }
};

// Get walking route (pedestrian optimized)
export const getWalkingRoute = async (start, end) => {
  return getRouteOSRM(start, end, 'foot');
};

// Get cycling route
export const getCyclingRoute = async (start, end) => {
  return getRouteOSRM(start, end, 'bike');
};

// Real-time location tracking
export const watchUserPosition = (onPositionUpdate, onError) => {
  if (!navigator.geolocation) {
    onError('Geolocation not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onPositionUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading, // Direction of travel
        speed: position.coords.speed // Speed in m/s
      });
    },
    (error) => {
      onError(error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
};