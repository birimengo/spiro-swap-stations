import React, { useState } from 'react';
import StationCard from './StationCard';
import ReviewSection from './ReviewSection';
import axios from 'axios';

const AdminPanel = ({ 
  stations, 
  onAddStation, 
  onUpdateStation, 
  onDeleteStation, 
  onAddReview,
  currentUser // Add currentUser prop to check permissions
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    latitude: '',
    longitude: '',
    address: '',
    totalBatteries: 10,
    availableBatteries: 0,
    operatingHours: '24/7'
  });

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super-admin';
  
  // Check if user can add a new station (each admin can add only one)
  const canAddStation = () => {
    if (isSuperAdmin) return true; // Super admin can add unlimited
    // Count stations added by current admin
    const adminStations = stations.filter(station => station.addedBy === currentUser?.username);
    return adminStations.length === 0; // Can only add if they have 0 stations
  };

  // Check if user can edit/delete a specific station
  const canModifyStation = (station) => {
    if (isSuperAdmin) return true; // Super admin can modify any station
    return station.addedBy === currentUser?.username; // Regular admin can only modify their own
  };

  // Function to get coordinates from address using Nominatim (OpenStreetMap)
  const getCoordinatesFromAddress = async (address) => {
    if (!address || address.trim().length < 5) {
      setGeocodeError('Please enter a more specific address');
      return null;
    }

    setIsGeocoding(true);
    setGeocodeError('');

    try {
      // Using OpenStreetMap's Nominatim API for geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'BatterySwapStation/1.0' // Required by Nominatim
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          displayName: result.display_name
        };
      } else {
        setGeocodeError('Address not found. Please try a different address or enter coordinates manually.');
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Failed to get coordinates. Please try again or enter manually.');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle address change with debounce
  const handleAddressChange = async (e) => {
    const address = e.target.value;
    setFormData({...formData, address});

    // Clear coordinates if address is cleared
    if (!address.trim()) {
      setFormData(prev => ({...prev, latitude: '', longitude: ''}));
      setGeocodeError('');
      return;
    }

    // Auto-fill coordinates when address has enough characters
    if (address.length >= 10) {
      const coordinates = await getCoordinatesFromAddress(address);
      if (coordinates) {
        setFormData(prev => ({
          ...prev,
          latitude: coordinates.lat.toString(),
          longitude: coordinates.lon.toString(),
          address: coordinates.displayName || prev.address // Use formatted address if available
        }));
      }
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'BatterySwapStation/1.0'
              }
            }
          );

          if (response.data && response.data.display_name) {
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              address: response.data.display_name
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
        } finally {
          setIsGeocoding(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeocodeError('Failed to get current location. Please enter address manually.');
        setIsGeocoding(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if user can add a station
    if (!editingStation && !canAddStation()) {
      alert('You can only add one station as a regular admin. Please contact super admin for more.');
      return;
    }

    // Validate coordinates
    if (!formData.latitude || !formData.longitude) {
      alert('Please enter an address to auto-fill coordinates or enter them manually');
      return;
    }

    // Add current user as the station owner
    const stationData = {
      ...formData,
      addedBy: currentUser?.username || 'unknown',
      addedDate: editingStation ? undefined : new Date().toISOString()
    };

    if (editingStation) {
      // Check if user can edit this station
      if (!canModifyStation(editingStation)) {
        alert('You do not have permission to edit this station');
        return;
      }
      onUpdateStation(editingStation._id, stationData);
    } else {
      onAddStation(stationData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      latitude: '',
      longitude: '',
      address: '',
      totalBatteries: 10,
      availableBatteries: 0,
      operatingHours: '24/7'
    });
    setEditingStation(null);
    setShowForm(false);
    setGeocodeError('');
  };

  const editStation = (station) => {
    // Check if user can edit this station
    if (!canModifyStation(station)) {
      alert('You do not have permission to edit this station');
      return;
    }

    setEditingStation(station);
    setFormData({
      name: station.name,
      phone: station.phone || '',
      latitude: station.latitude,
      longitude: station.longitude,
      address: station.address || '',
      totalBatteries: station.totalBatteries,
      availableBatteries: station.availableBatteries,
      operatingHours: station.operatingHours || '24/7'
    });
    setShowForm(true);
    setGeocodeError('');
  };

  const handleDeleteStation = (stationId, station) => {
    // Check if user can delete this station
    if (!canModifyStation(station)) {
      alert('You do not have permission to delete this station');
      return;
    }

    if (window.confirm('Are you sure you want to delete this station?')) {
      onDeleteStation(stationId);
      // Clear selected station if it was deleted
      if (selectedStation?._id === stationId) {
        setSelectedStation(null);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: <span className="font-semibold">{currentUser?.username}</span> 
            ({isSuperAdmin ? 'Super Admin' : 'Regular Admin'})
          </p>
        </div>
        {!isSuperAdmin && (
          <p className="text-sm text-blue-600">
            Stations added: {stations.filter(s => s.addedBy === currentUser?.username).length}/1
          </p>
        )}
        <button
          onClick={() => {
            if (!canAddStation()) {
              alert('You can only add one station as a regular admin');
              return;
            }
            setShowForm(!showForm);
          }}
          className={`px-4 py-2 rounded ${
            canAddStation() 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
          disabled={!canAddStation()}
        >
          {showForm ? 'Cancel' : '+ Add New Station'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingStation ? 'Edit Station' : 'Add New Station'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Station Name *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-3 py-2 border rounded"
                required
              />
              
              <input
                type="text"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-3 py-2 border rounded"
              />
            </div>

            {/* Address with auto-fill */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Address (type here to auto-fill coordinates) *"
                  value={formData.address}
                  onChange={handleAddressChange}
                  className="flex-1 px-3 py-2 border rounded"
                  required
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>📍</span>
                  <span className="hidden sm:inline">Use My Location</span>
                </button>
              </div>
              
              {isGeocoding && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Getting coordinates...
                </div>
              )}
              
              {geocodeError && (
                <p className="text-sm text-red-600">{geocodeError}</p>
              )}
            </div>

            {/* Coordinates - Auto-filled or manual entry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude *"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                  readOnly={isGeocoding}
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude *"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                  readOnly={isGeocoding}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Total Batteries"
                value={formData.totalBatteries}
                onChange={(e) => setFormData({...formData, totalBatteries: e.target.value})}
                className="px-3 py-2 border rounded"
              />
              
              <input
                type="number"
                placeholder="Available Batteries"
                value={formData.availableBatteries}
                onChange={(e) => setFormData({...formData, availableBatteries: e.target.value})}
                className="px-3 py-2 border rounded"
              />
            </div>

            <input
              type="text"
              placeholder="Operating Hours"
              value={formData.operatingHours}
              onChange={(e) => setFormData({...formData, operatingHours: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isGeocoding}
              >
                {isGeocoding ? 'Getting Coordinates...' : (editingStation ? 'Update Station' : 'Add Station')}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stations List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">All Stations ({stations.length})</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {stations.map(station => {
              const canModify = canModifyStation(station);
              return (
                <div key={station._id} className="relative">
                  <StationCard
                    station={station}
                    onClick={setSelectedStation}
                    isSelected={selectedStation?._id === station._id}
                  />
                  {canModify && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => editStation(station)}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station._id, station)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {!canModify && isSuperAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => editStation(station)}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station._id, station)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {!canModify && !isSuperAdmin && (
                    <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
                      Added by {station.addedBy}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Station Details */}
        {selectedStation && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">{selectedStation.name}</h3>
            
            <div className="space-y-2 mb-4">
              <p>📍 {selectedStation.address || 'Address not available'}</p>
              <p>🔋 {selectedStation.availableBatteries}/{selectedStation.totalBatteries} batteries</p>
              <p>⏰ {selectedStation.operatingHours || '24/7'}</p>
              {selectedStation.phone && <p>📞 {selectedStation.phone}</p>}
              <p>👤 Added by: {selectedStation.addedBy}</p>
              <p>📅 Added: {new Date(selectedStation.addedDate).toLocaleDateString()}</p>
            </div>

            <ReviewSection
              station={selectedStation}
              onAddReview={onAddReview}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;