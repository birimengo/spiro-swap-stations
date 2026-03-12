// Navigation service for compass directions, distance, and time calculations

// Calculate distance between two coordinates (Haversine formula) - returns meters
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Calculate bearing (direction) from point A to point B
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const λ1 = lon1 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
};

// Get cardinal direction from bearing
export const getCardinalDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

// Get arrow symbol based on bearing
export const getDirectionArrow = (bearing) => {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(bearing / 45) % 8;
  return arrows[index];
};

// Calculate remaining time based on mode of transport
export const calculateRemainingTime = (distanceMeters, mode = 'walking') => {
  const speeds = {
    walking: 1.4,    // m/s (5 km/h)
    running: 2.8,    // m/s (10 km/h)
    biking: 4.2,     // m/s (15 km/h)
    driving: 13.9    // m/s (50 km/h)
  };

  const speed = speeds[mode] || speeds.walking;
  const timeSeconds = distanceMeters / speed;
  
  if (timeSeconds < 60) return `${Math.round(timeSeconds)}s`;
  if (timeSeconds < 3600) {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.round(timeSeconds % 60);
    return `${minutes}min ${seconds}s`;
  }
  const hours = Math.floor(timeSeconds / 3600);
  const minutes = Math.floor((timeSeconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
};

// Format distance in human-readable format
export const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Calculate ETA (Estimated Time of Arrival)
export const calculateETA = (distanceMeters, mode = 'walking') => {
  const speeds = {
    walking: 1.4,
    running: 2.8,
    biking: 4.2,
    driving: 13.9
  };

  const speed = speeds[mode] || speeds.walking;
  const timeSeconds = distanceMeters / speed;
  const now = new Date();
  const eta = new Date(now.getTime() + timeSeconds * 1000);
  
  return eta;
};

// Check if user is heading towards destination
export const isHeadedTowards = (userBearing, targetBearing, threshold = 30) => {
  const bearingDiff = Math.abs(((targetBearing - userBearing + 540) % 360) - 180);
  return bearingDiff <= threshold;
};