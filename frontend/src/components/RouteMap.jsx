import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import axios from 'axios';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RouteMap = ({ userLocation, destination, height = '400px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [userLocation?.lat || 0.3136, userLocation?.lng || 32.5811],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch route from OSRM
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !destination) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        // Clear existing routing control
        if (routingControlRef.current) {
          mapInstanceRef.current.removeControl(routingControlRef.current);
        }

        // OSRM API endpoint (free, no API key required)
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;

        const response = await axios.get(url);
        
        if (response.data.code === 'Ok') {
          const route = response.data.routes[0];
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Create polyline for the route
          const routeLine = L.polyline(coordinates, {
            color: '#10b981',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round'
          }).addTo(mapInstanceRef.current);

          // Add markers
          const startMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
              className: 'start-marker',
              html: '🚗',
              iconSize: [24, 24]
            })
          }).addTo(mapInstanceRef.current).bindPopup('Your location');

          const endMarker = L.marker([destination.latitude, destination.longitude], {
            icon: L.divIcon({
              className: 'end-marker',
              html: '🏁',
              iconSize: [24, 24]
            })
          }).addTo(mapInstanceRef.current).bindPopup(destination.name);

          // Fit map to show entire route
          const bounds = L.latLngBounds(coordinates);
          mapInstanceRef.current.fitBounds(bounds.pad(0.1));

          // Store route info
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1), // km
            duration: Math.round(route.duration / 60), // minutes
            coordinates
          });

          // Add turn-by-turn instructions
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            const instructions = route.legs[0].steps.map(step => ({
              instruction: step.maneuver?.modifier ? 
                `${step.maneuver.type} ${step.maneuver.modifier}` : 
                step.maneuver?.type || 'Continue',
              distance: (step.distance / 1000).toFixed(2),
              street: step.name || 'Unknown street'
            }));
            console.log('Turn-by-turn instructions:', instructions);
          }

          routingControlRef.current = routeLine;
        } else {
          setError('Could not calculate route');
        }
      } catch (err) {
        console.error('Route fetch error:', err);
        setError('Failed to fetch route. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [userLocation, destination]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Calculating route...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-10">
          {error}
        </div>
      )}

      {routeInfo && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-64 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm font-medium text-gray-700 mb-1">Route Summary</div>
          <div className="flex justify-between text-xs">
            <span>📏 {routeInfo.distance} km</span>
            <span>⏱️ {routeInfo.duration} min</span>
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />
    </div>
  );
};

export default RouteMap;