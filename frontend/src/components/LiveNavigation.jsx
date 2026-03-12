import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LiveNavigation = ({ destination, onClose, initialLocation }) => {
  const [userLocation, setUserLocation] = useState(initialLocation);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transportMode, setTransportMode] = useState('driving');
  const [arrived, setArrived] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const [isHighAccuracy, setIsHighAccuracy] = useState(false);
  const [isUsingIPLocation, setIsUsingIPLocation] = useState(false);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Navigation states
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [bearing, setBearing] = useState(0);
  const [userHeading, setUserHeading] = useState(0);
  const [nextInstruction, setNextInstruction] = useState('');
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // UI states - Set to false by default so options are hidden
  const [showOptions, setShowOptions] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const compassRef = useRef(null);
  const tileLayerRef = useRef(null);
  const optionsRef = useRef(null);

  // Check if it's dark hours (between 7 PM and 7 AM)
  const checkDarkMode = () => {
    const hours = new Date().getHours();
    // Dark mode from 7 PM (19) to 7 AM (7)
    const isDark = hours >= 19 || hours < 7;
    setIsDarkMode(isDark);
    return isDark;
  };

  // Update map tiles based on dark mode
  const updateMapTiles = (dark) => {
    if (!mapInstanceRef.current) return;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Add appropriate tile layer based on dark mode
    if (dark) {
      // Dark mode tiles (CartoDB Dark Matter)
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CartoDB'
      }).addTo(mapInstanceRef.current);
    } else {
      // Light mode tiles (standard OpenStreetMap)
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }
  };

  // Initialize map with dark mode support
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [userLocation?.lat || 0.3136, userLocation?.lng || 32.5811],
      14
    );

    // Check dark mode and set initial tiles
    const isDark = checkDarkMode();
    updateMapTiles(isDark);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Check for dark mode every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const isDark = checkDarkMode();
      updateMapTiles(isDark);
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, []);

  // Fetch route and extract turn-by-turn steps
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !destination) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        if (routeLayerRef.current) {
          mapInstanceRef.current.removeLayer(routeLayerRef.current);
        }

        const profile = 
          transportMode === 'walking' ? 'foot' :
          transportMode === 'biking' ? 'bike' :
          'driving';

        const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.lng},${userLocation.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true&alternatives=false`;

        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data.code === 'Ok') {
          const route = response.data.routes[0];
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Extract turn-by-turn steps for internal use only
          const routeSteps = [];
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            route.legs[0].steps.forEach((step) => {
              const instruction = step.maneuver?.modifier 
                ? `${step.maneuver.type} ${step.maneuver.modifier}`
                : step.maneuver?.type || 'Continue';
              
              routeSteps.push({
                instruction: formatInstruction(instruction),
                distance: step.distance,
                duration: step.duration,
                position: step.maneuver?.location 
                  ? [step.maneuver.location[1], step.maneuver.location[0]]
                  : null,
              });
            });
          }
          setSteps(routeSteps);
          
          const routeColors = {
            driving: isDarkMode ? '#60a5fa' : '#3b82f6', // Lighter blue for dark mode
            walking: isDarkMode ? '#34d399' : '#10b981',
            running: isDarkMode ? '#fbbf24' : '#f59e0b',
            biking: isDarkMode ? '#c084fc' : '#8b5cf6'
          };

          const lineStyles = {
            driving: { weight: 5, opacity: isDarkMode ? 0.9 : 0.8, dashArray: null },
            walking: { weight: 4, opacity: isDarkMode ? 0.9 : 0.8, dashArray: '6, 6' },
            running: { weight: 4, opacity: isDarkMode ? 0.9 : 0.8, dashArray: '4, 4' },
            biking: { weight: 4, opacity: isDarkMode ? 0.9 : 0.8, dashArray: '8, 8' }
          };

          const routeLine = L.polyline(coordinates, {
            color: routeColors[transportMode] || '#10b981',
            weight: lineStyles[transportMode].weight,
            opacity: lineStyles[transportMode].opacity,
            dashArray: lineStyles[transportMode].dashArray,
            lineJoin: 'round'
          }).addTo(mapInstanceRef.current);

          const startIcons = { driving: '🚗', walking: '🚶', running: '🏃', biking: '🚲' };
          const endIcons = { driving: '🏁', walking: '📍', running: '🎯', biking: '🚵' };

          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
              className: 'user-marker',
              html: `<div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${startIcons[transportMode]}</div>`,
              iconSize: [32, 32],
              popupAnchor: [0, -16]
            })
          }).addTo(mapInstanceRef.current)
            .bindPopup(`You (${Math.round(userLocation.accuracy || 0)}m)`);

          if (destinationMarkerRef.current) {
            mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
          }

          destinationMarkerRef.current = L.marker([destination.latitude, destination.longitude], {
            icon: L.divIcon({
              className: 'destination-marker',
              html: `<div style="font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${endIcons[transportMode]}</div>`,
              iconSize: [36, 36],
              popupAnchor: [0, -18]
            })
          }).addTo(mapInstanceRef.current)
            .bindPopup(destination.name);

          const bounds = L.latLngBounds(coordinates);
          mapInstanceRef.current.fitBounds(bounds.pad(0.1));

          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.round(route.duration / 60),
            coordinates
          });

          setRemainingDistance(route.distance);
          setRemainingTime(route.duration);

          routeLayerRef.current = routeLine;
        } else {
          setError('Could not calculate route');
        }
      } catch (err) {
        console.error('Route fetch error:', err);
        setError('Failed to fetch route');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [userLocation, destination, transportMode, isUsingIPLocation, isDarkMode]);

  // Format instruction for display
  const formatInstruction = (instruction) => {
    const mapping = {
      'turn right': 'Turn Right →',
      'turn left': 'Turn Left ←',
      'turn slight right': 'Slight Right ↗',
      'turn slight left': 'Slight Left ↖',
      'turn sharp right': 'Sharp Right ⬇️',
      'turn sharp left': 'Sharp Left ⬇️',
      'continue': 'Continue ↑',
      'straight': 'Straight ↑',
      'arrive': 'Arrive 🏁',
      'depart': 'Start 🚀',
      'roundabout': 'Roundabout ↻',
      'exit roundabout': 'Exit Roundabout'
    };
    return mapping[instruction.toLowerCase()] || instruction;
  };

  // Get arrow for instruction
  const getInstructionArrow = (instruction) => {
    if (instruction.includes('Right')) return '→';
    if (instruction.includes('Left')) return '←';
    if (instruction.includes('Straight')) return '↑';
    if (instruction.includes('Slight Right')) return '↗';
    if (instruction.includes('Slight Left')) return '↖';
    if (instruction.includes('Sharp Right')) return '⬇️';
    if (instruction.includes('Sharp Left')) return '⬇️';
    if (instruction.includes('Roundabout')) return '↻';
    if (instruction.includes('Arrive')) return '🏁';
    return '↑';
  };

  // Update navigation based on user position
  useEffect(() => {
    if (!userLocation || !destination || !steps.length) return;

    // Calculate bearing to next step or destination
    const targetLat = steps[currentStep]?.position?.[0] || destination.latitude;
    const targetLng = steps[currentStep]?.position?.[1] || destination.longitude;
    
    const newBearing = calculateBearing(
      userLocation.lat,
      userLocation.lng,
      targetLat,
      targetLng
    );
    setBearing(newBearing);

    // Calculate remaining distance
    const dist = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      destination.latitude,
      destination.longitude
    );
    setRemainingDistance(dist);
    setRemainingTime(dist / (transportMode === 'driving' ? 13.9 : transportMode === 'biking' ? 4.2 : 1.4));

    // Check if arrived at next step
    if (steps[currentStep]?.position) {
      const stepDist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        steps[currentStep].position[0],
        steps[currentStep].position[1]
      );
      
      if (stepDist < 20 && currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }

    // Set next instruction
    if (steps[currentStep]) {
      const step = steps[currentStep];
      const distToStep = step.position ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        step.position[0],
        step.position[1]
      ) : 0;
      
      setNextInstruction(
        `${getInstructionArrow(step.instruction)} ${step.instruction} ${distToStep > 0 ? `in ${Math.round(distToStep)}m` : 'now'}`
      );
    }

  }, [userLocation, currentStep, steps]);

  // Device orientation for compass
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.webkitCompassHeading) {
        setUserHeading(event.webkitCompassHeading);
      } else if (event.alpha) {
        setUserHeading(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const calculateBearing = (lat1, lon1, lat2, lon2) => {
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const getLocationByIP = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/');
      if (response.data && response.data.latitude && response.data.longitude) {
        setUserLocation({
          lat: response.data.latitude,
          lng: response.data.longitude,
          accuracy: 5000,
          city: response.data.city,
          country: response.data.country_name
        });
        setIsUsingIPLocation(true);
        setIsHighAccuracy(false);
        setError(null);
        return true;
      }
    } catch (err) {
      console.error('IP geolocation failed:', err);
    }
    return false;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      getLocationByIP().then(success => {
        if (!success) setError('Geolocation not supported');
      });
      return;
    }

    let isMounted = true;
    let fallbackTimer = null;

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 100,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          setIsHighAccuracy(false);
          setIsUsingIPLocation(false);
          setError(null);
          setLocationRetryCount(0);
        },
        (err) => {
          console.warn('Low accuracy failed:', err);
          tryHighAccuracy();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
      );
    };

    const tryHighAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          setIsHighAccuracy(true);
          setIsUsingIPLocation(false);
          setError(null);
          setLocationRetryCount(0);
        },
        async (err) => {
          console.warn('High accuracy failed:', err);
          
          if (locationRetryCount >= 2) {
            const ipSuccess = await getLocationByIP();
            if (!ipSuccess && isMounted) {
              setError('Unable to get location');
            }
          } else {
            fallbackTimer = setTimeout(() => {
              if (isMounted) {
                setLocationRetryCount(prev => prev + 1);
                tryLowAccuracy();
              }
            }, 3000);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    };

    tryLowAccuracy();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMounted) return;
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
        setIsHighAccuracy(true);
        setIsUsingIPLocation(false);
        setError(null);
        setLocationRetryCount(0);
      },
      (err) => console.warn('Watch error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setWatchId(watchId);

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [locationRetryCount]);

  useEffect(() => {
    if (userLocation && destination && routeInfo && !arrived) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        destination.latitude,
        destination.longitude
      );
      
      if (dist < 30) setArrived(true);
    }
  }, [userLocation, destination, routeInfo]);

  // Function to open Google Maps with both coordinates
  const openGoogleMaps = () => {
    if (!userLocation || !destination) {
      alert('Location data not available');
      return;
    }

    // Determine travel mode for Google Maps
    const googleTravelMode = 
      transportMode === 'walking' ? 'walking' :
      transportMode === 'biking' ? 'bicycling' :
      transportMode === 'driving' ? 'driving' :
      'driving'; // default to driving

    // Create Google Maps URL with origin and destination coordinates
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.latitude},${destination.longitude}&travelmode=${googleTravelMode}`;
    
    // Open in new tab
    window.open(url, '_blank');
  };

  if (error && !userLocation) {
    return (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-black bg-opacity-90'} flex items-center justify-center z-[100] p-4`}>
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 max-w-sm w-full shadow-2xl`}>
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Location Error</h3>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-5`}>{error}</p>
            <div className="space-y-3">
              <button onClick={() => { setLocationRetryCount(0); setError(null); }} 
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 shadow-md">
                Try Again
              </button>
              <button onClick={onClose} className={`w-full py-4 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-xl text-lg font-medium`}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (arrived) {
    return (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-black bg-opacity-90'} flex items-center justify-center z-[100] p-4`}>
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-6 max-w-sm w-full shadow-2xl`}>
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">🎉</div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>You Have Arrived!</h3>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{destination.name}</p>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-5`}>{destination.address}</p>
            <button onClick={onClose} className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-medium hover:bg-green-700 shadow-md">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-black'} z-[100] flex flex-col`}>
      {/* Compact Header - Fixed height for mobile */}
      <div className={`${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} px-3 py-2 shadow-md h-[60px] flex items-center z-30 relative`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xl">🧭</span>
              <h2 className={`text-base font-bold truncate ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{destination.name}</h2>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-400'} truncate ml-7`}>{destination.address}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* More Options Button - Toggle options visibility */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                showOptions 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              aria-label={showOptions ? "Hide options" : "Show options"}
            >
              <span className={`transition-transform duration-300 text-xs ${showOptions ? 'rotate-180' : ''}`}>▼</span>
              <span className="hidden xs:inline">Options</span>
            </button>
            <button 
              onClick={onClose} 
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'} text-2xl w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Close navigation"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Compass & Instructions - Fixed height for mobile */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-3 h-[100px] flex flex-col justify-center z-30 relative`}>
        <div className="flex items-center gap-2">
          {/* Compass - Smaller */}
          <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0">
            <div className={`absolute inset-0 border-2 ${isDarkMode ? 'border-blue-700' : 'border-blue-300'} rounded-full`}></div>
            <div className={`absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>N</div>
            <div
              ref={compassRef}
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
              style={{ transform: `rotate(${bearing - userHeading}deg)` }}
            >
              <div className={`text-lg md:text-2xl ${Math.abs(bearing - userHeading) < 30 ? 'text-green-600' : isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                ↑
              </div>
            </div>
          </div>

          {/* Next Instruction - Smaller text */}
          <div className="flex-1 min-w-0">
            <div className="text-green-600 text-[10px] md:text-xs font-medium mb-0.5">NEXT</div>
            <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-bold text-xs md:text-base truncate`}>
              {nextInstruction || 'Calculating route...'}
            </div>
            <div className="flex gap-2 mt-1 text-[10px] md:text-sm">
              <span className={`flex items-center gap-0.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>📏 <span className="font-medium">{(remainingDistance / 1000).toFixed(1)} km</span></span>
              <span className={`flex items-center gap-0.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-400'}`}>⏱️ <span className="font-medium">{Math.round(remainingTime / 60)} min</span></span>
            </div>
          </div>

          {/* Direction Arrow - Smaller */}
          <div className={`text-2xl md:text-4xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} shrink-0`}>
            {getInstructionArrow(nextInstruction)}
          </div>
        </div>

        {/* Step Progress Bar - Thinner */}
        {steps.length > 0 && (
          <div className="mt-2 flex gap-0.5">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`h-1 md:h-1.5 flex-1 rounded-full transition-all ${
                  i < currentStep ? 'bg-green-600' :
                  i === currentStep ? 'bg-blue-500 animate-pulse' :
                  isDarkMode ? 'bg-gray-600' : 'bg-blue-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Map Area - Takes remaining space with lower z-index */}
      <div className="flex-1 relative min-h-0 z-10">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg px-4 py-3 shadow-xl flex items-center gap-2`}>
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Loading route...</span>
            </div>
          </div>
        )}

        {/* Map */}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Floating Options Drawer - Fixed position relative to viewport with high z-index */}
      {routeInfo && !loading && (
        <>
          {/* Backdrop overlay when options are shown */}
          {showOptions && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setShowOptions(false)}
              style={{ top: '160px' }} // Start below header and navigation
            />
          )}
          
          {/* Options Drawer */}
          <div 
            ref={optionsRef}
            className={`fixed left-0 right-0 transition-all duration-300 ease-in-out z-50 ${
              showOptions 
                ? 'bottom-0 opacity-100 visible translate-y-0' 
                : '-bottom-full opacity-0 invisible translate-y-full'
            }`}
            style={{
              boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.15)',
              maxHeight: '280px'
            }}
          >
            {/* Options Content */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-xl overflow-hidden`}>
              {/* Transport Mode Selector */}
              <div className={`px-4 py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <p className="text-green-600 text-xs font-semibold uppercase tracking-wider mb-3">Travel Mode</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mode: 'driving', icon: '🚗', label: 'Drive' },
                    { mode: 'walking', icon: '🚶', label: 'Walk' },
                    { mode: 'running', icon: '🏃', label: 'Run' },
                    { mode: 'biking', icon: '🚲', label: 'Bike' }
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setTransportMode(mode)}
                      className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg text-xs font-medium transition-all w-full ${
                        transportMode === mode
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDarkMode
                            ? 'bg-gray-700 text-blue-400 hover:bg-gray-600'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-[10px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer with Google Maps */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl shrink-0">
                    {transportMode === 'driving' && '🚗'}
                    {transportMode === 'walking' && '🚶'}
                    {transportMode === 'running' && '🏃'}
                    {transportMode === 'biking' && '🚲'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}>
                      {transportMode === 'driving' ? 'Driving' :
                       transportMode === 'walking' ? 'Walking' :
                       transportMode === 'running' ? 'Running' :
                       'Biking'} to destination
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-400'} truncate`}>
                      Arrival: <span className="font-medium">{new Date(Date.now() + remainingTime * 1000).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                      })}</span> • <span className="font-medium">{(remainingDistance / 1000).toFixed(1)} km</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={openGoogleMaps}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2 shadow-md"
                >
                  <span>🗺️</span>
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </div>
            
            {/* Small handle to indicate draggable - Click to hide options */}
            <div 
              className="flex justify-center py-1 cursor-pointer"
              onClick={() => setShowOptions(false)}
            >
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveNavigation;