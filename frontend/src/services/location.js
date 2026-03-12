// Location service for handling geolocation and geocoding

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Search for a location by address (geocoding)
export const searchLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SpiroSwapLocator/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to search location');
    }
    
    const data = await response.json();
    
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      address: item.address
    }));
  } catch (error) {
    console.error('Location search failed:', error);
    return [];
  }
};

// Get address from coordinates (reverse geocoding)
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SpiroSwapLocator/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to get address');
    }
    
    const data = await response.json();
    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village || '',
      country: data.address?.country || ''
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return { address: 'Address not available', city: '', country: '' };
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
};

// Get direction (bearing) between two points
export const getBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const λ1 = lon1 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;
  
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  
  return (θ * 180 / Math.PI + 360) % 360;
};

// Get cardinal direction from bearing
export const getCardinalDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

// Get approximate travel time (walking/biking)
export const getTravelTime = (distanceKm, mode = 'walking') => {
  const speeds = {
    walking: 5, // km/h
    biking: 15, // km/h
    driving: 40 // km/h
  };
  
  const speed = speeds[mode] || speeds.walking;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (timeMinutes < 1) return 'Less than a minute';
  if (timeMinutes === 1) return '1 minute';
  if (timeMinutes < 60) return `${timeMinutes} minutes`;
  
  const hours = Math.floor(timeMinutes / 60);
  const minutes = timeMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
};

// Watch user position (real-time updates)
export const watchPosition = (onSuccess, onError, options = {}) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      let errorMessage = 'Location error';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location timeout';
          break;
      }
      onError(new Error(errorMessage));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }
  );

  return watchId;
};

// Stop watching position
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Check if location is within Kenya (for your Spiro app)
export const isInKenya = (lat, lng) => {
  // Rough bounds for Kenya
  return lat >= -4.9 && lat <= 5.0 && lng >= 33.5 && lng <= 42.0;
};

// Get default location (Kampala as fallback)
export const getDefaultLocation = () => ({
  lat: 0.21056,
  lng: 32.568732,
  name: 'Kampala, Uganda'
});

// Format coordinates for display
export const formatCoordinates = (lat, lng) => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  return `${latAbs}° ${latDir}, ${lngAbs}° ${lngDir}`;
};