import React, { useState } from 'react';
import RealTimeNavigationMap from './RealTimeNavigationMap';

const NavigationPanel = ({ userLocation, destination, onClose }) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [profile, setProfile] = useState('driving');

  const handleRouteUpdate = (info) => {
    setRouteInfo(info);
  };

  const handleArrival = () => {
    setArrived(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Navigation to {destination.name}</h2>
          <p className="text-sm opacity-90">{destination.address}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Transport Mode Selector */}
      <div className="p-4 bg-gray-50 border-b flex gap-2">
        {[
          { id: 'driving', icon: '🚗', label: 'Drive' },
          { id: 'walking', icon: '🚶', label: 'Walk' },
          { id: 'cycling', icon: '🚲', label: 'Bike' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setProfile(mode.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              profile === mode.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{mode.icon}</span>
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Arrival Message */}
      {arrived && (
        <div className="p-4 bg-yellow-100 text-yellow-800 text-center">
          🎉 You have arrived at your destination!
        </div>
      )}

      {/* Live Navigation Map */}
      <div className="relative">
        <RealTimeNavigationMap
          userLocation={userLocation}
          destination={destination}
          onRouteUpdate={handleRouteUpdate}
          onArrival={handleArrival}
          profile={profile}
          height="500px"
          showAlternatives={true}
        />
      </div>

      {/* Route Summary */}
      {routeInfo && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-xl font-bold text-green-600">
                {routeInfo.distance.toFixed(1)} km
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-xl font-bold text-blue-600">
                {Math.round(routeInfo.time)} min
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">ETA</div>
              <div className="text-xl font-bold text-purple-600">
                {new Date(Date.now() + routeInfo.time * 60000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600">Transport</div>
              <div className="text-xl font-bold text-orange-600 capitalize">
                {profile}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationPanel;