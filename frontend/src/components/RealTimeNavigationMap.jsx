import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-control-geocoder';
import { getAlternativeRoutes, watchUserPosition } from '../services/openRouteService';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RealTimeNavigationMap = ({ 
  userLocation, 
  destination, 
  onRouteUpdate,
  onArrival,
  height = '600px',
  showAlternatives = true,
  profile = 'driving'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [watchId, setWatchId] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [userLocation?.lat || 0.3136, userLocation?.lng || 32.5811],
      13
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Add scale control
    L.control.scale({ imperial: false, metric: true }).addTo(mapInstanceRef.current);

    // Add fullscreen control
    if (L.control.fullscreen) {
      L.control.fullscreen().addTo(mapInstanceRef.current);
    }

    // Add geocoder for search
    L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search location...'
    }).on('markgeocode', (e) => {
      const { center, name } = e.geocode;
      mapInstanceRef.current.setView(center, 15);
    }).addTo(mapInstanceRef.current);

    // Start real-time tracking
    const id = watchUserPosition(
      (position) => {
        updateUserMarker(position);
        if (destination) {
          updateNavigationProgress(position);
        }
      },
      (error) => console.error('Position error:', error)
    );
    setWatchId(id);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Setup routing when destination changes
  useEffect(() => {
    if (!mapInstanceRef.current || !destination || !userLocation) return;

    // Clear existing routing
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
    }

    // Create routing control
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(destination.latitude, destination.longitude)
      ],
      routeWhileDragging: true,
      showAlternatives: showAlternatives,
      altLineOptions: {
        styles: [
          { color: '#666', opacity: 0.5, weight: 6 },
          { color: '#999', opacity: 0.8, weight: 4 }
        ]
      },
      lineOptions: {
        styles: [
          { color: '#10b981', opacity: 1, weight: 8 },
          { color: '#fff', opacity: 0.5, weight: 4 }
        ]
      },
      summaryTemplate: '<div class="route-summary">{name}</div>',
      timeFormatter: (t) => {
        const minutes = Math.round(t / 60);
        return `${minutes} min`;
      },
      distanceFormatter: (d) => {
        const km = d / 1000;
        return `${km.toFixed(1)} km`;
      },
      createMarker: (waypoint, index, waypoints) => {
        const icon = L.divIcon({
          className: 'routing-marker',
          html: index === 0 ? '🚗' : '🏁',
          iconSize: [24, 24]
        });
        return L.marker(waypoint.latLng, { icon });
      }
    }).addTo(mapInstanceRef.current);

    // Get alternative routes
    if (showAlternatives) {
      getAlternativeRoutes(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: destination.latitude, lng: destination.longitude },
        profile
      ).then(routes => {
        setAlternativeRoutes(routes);
      });
    }

    // Route events
    routingControlRef.current.on('routesfound', (e) => {
      const routes = e.routes;
      if (routes.length > 0) {
        const mainRoute = routes[0];
        setCurrentRoute(mainRoute);
        setRemainingDistance(mainRoute.summary.totalDistance);
        setRemainingTime(mainRoute.summary.totalTime);
        
        if (onRouteUpdate) {
          onRouteUpdate({
            distance: mainRoute.summary.totalDistance / 1000,
            time: mainRoute.summary.totalTime / 60,
            coordinates: mainRoute.coordinates
          });
        }
      }
    });

    routingControlRef.current.on('routingerror', (e) => {
      console.error('Routing error:', e.error);
    });

  }, [destination, userLocation, profile]);

  // Update user marker with real-time position
  const updateUserMarker = (position) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([position.lat, position.lng]);
    } else {
      userMarkerRef.current = L.marker([position.lat, position.lng], {
        icon: L.divIcon({
          className: 'user-marker',
          html: '📍',
          iconSize: [24, 24]
        }),
        zIndexOffset: 1000
      }).addTo(mapInstanceRef.current)
        .bindPopup('You are here');
    }

    // Update rotation if heading available
    if (position.heading !== null && userMarkerRef.current) {
      userMarkerRef.current.setRotationAngle(position.heading);
    }
  };

  // Update navigation progress in real-time
  const updateNavigationProgress = (position) => {
    if (!destination) return;

    const remaining = calculateRemainingDistance(
      position.lat,
      position.lng,
      destination.latitude,
      destination.longitude
    );

    setRemainingDistance(remaining);

    // Check if arrived (within 50 meters)
    if (remaining < 50 && onArrival) {
      onArrival();
    }
  };

  // Calculate remaining distance
  const calculateRemainingDistance = (lat1, lon1, lat2, lon2) => {
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

  // Fit map to show both points
  const fitToRoute = () => {
    if (!userLocation || !destination) return;
    
    const bounds = L.latLngBounds(
      [userLocation.lat, userLocation.lng],
      [destination.latitude, destination.longitude]
    );
    mapInstanceRef.current.fitBounds(bounds.pad(0.1));
  };

  return (
    <div className="relative">
      {/* Navigation Info Overlay */}
      {destination && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 md:left-auto md:right-4 md:w-80">
          <h3 className="font-bold text-lg mb-2">{destination.name}</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-xs text-gray-600">Distance</div>
              <div className="font-bold text-green-600">
                {(remainingDistance / 1000).toFixed(1)} km
              </div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="text-xs text-gray-600">Est. Time</div>
              <div className="font-bold text-blue-600">
                {Math.round(remainingTime / 60)} min
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fitToRoute}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
            >
              Fit to Route
            </button>
            <button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
                window.open(url, '_blank');
              }}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Open in Maps
            </button>
          </div>
        </div>
      )}

      {/* Alternative Routes */}
      {alternativeRoutes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">Alternative Routes</p>
          <div className="flex gap-2">
            {alternativeRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => {/* Switch to this route */}}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs"
              >
                {route.distance.toFixed(1)} km • {Math.round(route.duration)} min
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} style={{ height, width: '100%' }} />
    </div>
  );
};

export default RealTimeNavigationMap;