import React, { useState, useEffect, useRef } from 'react';
import {
  calculateDistance,
  calculateBearing,
  getCardinalDirection,
  getDirectionArrow,
  calculateRemainingTime,
  formatDistance,
  calculateETA,
  getNavigationInstruction,
  isHeadedTowards,
  getCompassColor
} from '../services/navigation';

const NavigationCompass = ({ userLocation, targetStation, onClose }) => {
  const [distance, setDistance] = useState(null);
  const [bearing, setBearing] = useState(null);
  const [userBearing, setUserBearing] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [transportMode, setTransportMode] = useState('walking');
  const [headingAccuracy, setHeadingAccuracy] = useState(false);
  const compassRef = useRef(null);

  // Calculate navigation data when user location or target changes
  useEffect(() => {
    if (userLocation && targetStation) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        targetStation.latitude,
        targetStation.longitude
      );
      setDistance(dist);

      const bear = calculateBearing(
        userLocation.lat,
        userLocation.lng,
        targetStation.latitude,
        targetStation.longitude
      );
      setBearing(bear);
    }
  }, [userLocation, targetStation]);

  // Watch user's heading (direction they're facing)
  useEffect(() => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event) => {
        // Get compass heading (alpha = compass direction)
        if (event.webkitCompassHeading) {
          // iOS
          setUserBearing(event.webkitCompassHeading);
        } else if (event.alpha) {
          // Android
          setUserBearing(360 - event.alpha);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation, true);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  // Update heading accuracy
  useEffect(() => {
    if (bearing !== null) {
      setHeadingAccuracy(isHeadedTowards(userBearing, bearing));
    }
  }, [userBearing, bearing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (!userLocation || !targetStation || distance === null) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500 text-center">Loading navigation...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Navigation</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Destination Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700">{targetStation.name}</h4>
        <p className="text-sm text-gray-600">{targetStation.address}</p>
      </div>

      {/* Compass */}
      <div className="relative mb-6 flex justify-center">
        <div className="relative w-48 h-48">
          {/* Compass Circle */}
          <div className="absolute inset-0 border-8 border-gray-200 rounded-full"></div>
          
          {/* Compass Directions */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">N</div>
            </div>
          </div>
          
          {/* Direction Arrow */}
          <div
            ref={compassRef}
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${bearing - userBearing}deg)` }}
          >
            <div className={`text-6xl ${getCompassColor(headingAccuracy)}`}>
              ↑
            </div>
          </div>
          
          {/* Center Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Navigation Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {getDirectionArrow(bearing)}
          </div>
          <div className="text-sm text-gray-600">
            {getCardinalDirection(bearing)}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatDistance(distance)}
          </div>
          <div className="text-sm text-gray-600">Distance</div>
        </div>
      </div>

      {/* Time and ETA */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-purple-600">
            {calculateRemainingTime(distance, transportMode)}
          </div>
          <div className="text-sm text-gray-600">Remaining Time</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-600">
            {calculateETA(distance, transportMode)}
          </div>
          <div className="text-sm text-gray-600">ETA</div>
        </div>
      </div>

      {/* Navigation Instruction */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-center">
        <p className="text-lg font-semibold text-yellow-700">
          {getNavigationInstruction(userBearing, bearing)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {headingAccuracy 
            ? '✓ You\'re heading in the right direction' 
            : '⚠️ Adjust your direction'}
        </p>
      </div>

      {/* Transport Mode Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Travel Mode
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { mode: 'walking', icon: '🚶', label: 'Walk' },
            { mode: 'running', icon: '🏃', label: 'Run' },
            { mode: 'biking', icon: '🚲', label: 'Bike' },
            { mode: 'driving', icon: '🚗', label: 'Drive' }
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              className={`p-2 rounded-lg text-center transition-all ${
                transportMode === mode
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-xl">{icon}</div>
              <div className="text-xs mt-1">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${targetStation.latitude},${targetStation.longitude}`;
            window.open(url, '_blank');
          }}
          className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Open in Maps
        </button>
        
        <button
          onClick={onClose}
          className="py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NavigationCompass;