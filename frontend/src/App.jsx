import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Map from './components/Map';
import StationList from './components/StationList';
import SearchBar from './components/SearchBar';
import AdminPanel from './components/AdminPanel';
import ReviewSection from './components/ReviewSection';
import LiveNavigation from './components/LiveNavigation';
import About from './components/About'; // Fixed case
import Disclaimer from './components/Disclaimer'; // Fixed case
import InstallPrompt from './components/InstallPrompt';
import SEO from './components/SEO';
import {
  getStations,
  getNearbyStations,
  addStation,
  updateStation,
  deleteStation,
  addReview
} from './services/api';
import { 
  getCurrentLocation, 
  getAddressFromCoordinates, 
  calculateDistance,
  watchPosition,
  clearWatch
} from './services/location';

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState({
    address: '',
    city: '',
    country: ''
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGettingLocationName, setIsGettingLocationName] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Load stations immediately - PUBLIC ACCESS
  useEffect(() => {
    loadAllStations();
    getUserLocation();
  }, []);

  // Filter stations when location or radius changes
  useEffect(() => {
    if (userLocation) {
      filterStationsByLocation();
    } else {
      setFilteredStations(stations);
    }
  }, [userLocation, radius, stations]);

  // Get location name when userLocation changes
  useEffect(() => {
    if (userLocation) {
      getLocationName(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadAllStations = async () => {
    try {
      setLoading(true);
      const data = await getStations();
      setStations(data);
      setFilteredStations(data);
      console.log('✅ Loaded stations from API:', data.length);
    } catch (error) {
      console.error('❌ Failed to load stations from API:', error);
      setStations([]);
      setFilteredStations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStationsByLocation = () => {
    if (!userLocation) {
      setFilteredStations(stations);
      return;
    }

    console.log('Filtering stations by location:', userLocation, 'radius:', radius);
    
    const nearby = stations
      .map(station => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          station.latitude,
          station.longitude
        );
        return { ...station, distance };
      })
      .filter(station => station.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    console.log('Nearby stations:', nearby.length);
    setFilteredStations(nearby);
  };

  const getUserLocation = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);
      console.log('📡 Requesting location...');
      const location = await getCurrentLocation();
      console.log('📍 User location received:', location);
      setUserLocation(location);
    } catch (error) {
      console.error('❌ Location error:', error.message);
      setLocationError(error.message);
      setUserLocation(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      setIsGettingLocationName(true);
      console.log('🔍 Getting location name for:', lat, lng);
      const details = await getAddressFromCoordinates(lat, lng);
      console.log('📍 Location name received:', details);
      setLocationDetails(details);
    } catch (error) {
      console.error('Failed to get location name:', error);
      setLocationDetails({
        address: '',
        city: '',
        country: ''
      });
    } finally {
      setIsGettingLocationName(false);
    }
  };

  const handleStartNavigation = async (station) => {
    if (!userLocation) {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        setNavigationDestination(station);
        setShowNavigation(true);
        setSelectedStation(null);
      } catch (error) {
        alert('Please enable location access to use navigation');
      }
    } else {
      setNavigationDestination(station);
      setShowNavigation(true);
      setSelectedStation(null);
    }
  };

  // Handle navigate click from Map component popup
  const handleMapNavigate = (station) => {
    console.log('Map navigate clicked for station:', station.name);
    handleStartNavigation(station);
  };

  const handleAddReview = async (stationId, reviewData) => {
    try {
      await addReview(stationId, reviewData);
      loadAllStations();
      alert('✅ Review added successfully!');
    } catch (error) {
      console.error('❌ Failed to add review:', error);
      alert('Failed to add review. Please try again.');
    }
  };

  const handleAddStation = async (stationData) => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    try {
      await addStation({
        ...stationData,
        addedBy: user?.username
      });
      loadAllStations();
      alert('✅ Station added successfully!');
    } catch (error) {
      console.error('❌ Failed to add station:', error);
      alert('Failed to add station.');
    }
  };

  const handleUpdateStation = async (id, stationData) => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    try {
      await updateStation(id, stationData);
      loadAllStations();
      alert('✅ Station updated successfully!');
    } catch (error) {
      console.error('❌ Failed to update station:', error);
    }
  };

  const handleDeleteStation = async (id) => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    if (!confirm('Delete this station?')) return;
    try {
      await deleteStation(id);
      loadAllStations();
      if (selectedStation?._id === id) setSelectedStation(null);
      alert('✅ Station deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete station:', error);
    }
  };

  const handleLocationFound = (location) => {
    console.log('📍 Location found via search:', location);
    setUserLocation(location);
    setLocationError(null);
  };

  const handleSearchResult = (results) => {
    console.log('🔍 Search results:', results);
    setSearchResults(results);
    if (results.length > 0) {
      const location = {
        lat: results[0].lat,
        lng: results[0].lng
      };
      setUserLocation(location);
      // Get address for the searched location
      getLocationName(location.lat, location.lng);
      setLocationError(null);
    }
  };

  const setQuickRadius = (value) => {
    setRadius(value);
  };

  const retryLocation = () => {
    console.log('🔄 Retrying location...');
    getUserLocation();
  };

  const closeNavigation = () => {
    setShowNavigation(false);
    setNavigationDestination(null);
  };

  const handleLogout = () => {
    logout();
    setShowAdmin(false);
  };

  const handleAboutClick = () => {
    setShowAbout(true);
    setIsMobileMenuOpen(false);
  };

  const handleDisclaimerClick = () => {
    setShowDisclaimer(true);
    setIsMobileMenuOpen(false);
  };

  const closeAbout = () => {
    setShowAbout(false);
  };

  const closeDisclaimer = () => {
    setShowDisclaimer(false);
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="Loading Spiro Swap Stations - Please Wait"
          description="Loading the Spiro battery swap station finder application..."
        />
        <div className="min-h-screen bg-gradient-to-r from-green-600 to-emerald-700 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-white text-xl font-semibold text-center">Loading Spiro swap stations...</p>
          <p className="text-white text-sm opacity-80 mt-2">Please wait a moment</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Spiro Swap Stations - Find Battery Swap Stations Near You"
        description="Find and navigate to Spiro battery swap stations near you. Live navigation, battery availability, community reviews, and real-time station information for Spiro bike users in Uganda."
        keywords="spiro, battery swap, electric bike, swap station, spiro bikes, battery replacement, kampala, uganda, electric vehicle, navigation"
        url="/"
        type="website"
      />
      
      {showAbout && <About onClose={closeAbout} />}
      {showDisclaimer && <Disclaimer onClose={closeDisclaimer} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar 
          onAdminClick={() => {
            if (isAuthenticated) {
              setShowAdmin(!showAdmin);
            } else {
              setShowLogin(true);
            }
          }}
          onLoginClick={() => setShowLogin(true)}
          onLogoutClick={handleLogout}
          onAboutClick={handleAboutClick}
          onDisclaimerClick={handleDisclaimerClick}
          showAdmin={showAdmin}
          isAuthenticated={isAuthenticated}
          user={user}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Login Modal */}
        {showLogin && !isAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4" onClick={() => setShowLogin(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 z-10 transition-colors"
                onClick={() => setShowLogin(false)}
              >
                ✕
              </button>
              <Login 
                onSuccess={() => {
                  setShowLogin(false);
                  setShowAdmin(true);
                }}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* Main Content - Hidden when login, station details, navigation, or admin panel are open */}
        {!showNavigation && !showAdmin && !showLogin && !selectedStation && !showAbout && !showDisclaimer && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white opacity-5 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
              <div className="absolute bottom-0 left-0 w-40 sm:w-48 h-40 sm:h-48 bg-white opacity-5 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3">
                    <span className="text-3xl sm:text-4xl lg:text-5xl">⚡</span>
                    <span className="text-white">Spiro Swap Stations</span>
                  </h1>
                  
                  {/* Station count badge */}
                  <div className="bg-teal-50 bg-opacity-30 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-blue-400 border-opacity-50">
                    <span className="text-xs sm:text-sm font-semibold text-green-500">
                      {filteredStations.length} stations found
                    </span>
                  </div>
                </div>
                
                <p className="text-sm sm:text-base lg:text-lg opacity-95 mb-4 sm:mb-6">
                  Find and swap batteries at stations near you
                </p>
                
                {/* Location display - All on one line */}
                {isGettingLocation ? (
                  <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-3 border border-white border-opacity-20">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-white">Getting your location...</span>
                    </div>
                  </div>
                ) : userLocation ? (
                  <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-3 border border-white border-opacity-20">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {/* Your Location label */}
                      <span className="text-blue-300 font-medium text-sm whitespace-nowrap">
                        Your Location:
                      </span>
                      
                      {/* Location name */}
                      <span className="text-green-400 font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                        {locationDetails.city ? (
                          `${locationDetails.city}${locationDetails.country ? `, ${locationDetails.country}` : ''}`
                        ) : locationDetails.address ? (
                          locationDetails.address.split(',')[0]
                        ) : (
                          `${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°`
                        )}
                      </span>
                      
                      {/* Loading indicator */}
                      {isGettingLocationName && !locationDetails.city && (
                        <span className="text-xs text-blue-300 opacity-70 animate-pulse whitespace-nowrap">
                          (getting name...)
                        </span>
                      )}
                      
                      {/* Refresh button */}
                      <button
                        onClick={retryLocation}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium shadow-sm whitespace-nowrap"
                        aria-label="Refresh location"
                      >
                        <span className="text-sm">🔄</span>
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                    
                    {/* Full address - on its own line if needed */}
                    {locationDetails.address && locationDetails.address !== locationDetails.city && (
                      <div className="text-xs text-blue-400 opacity-70 truncate mt-1">
                        {locationDetails.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-500 bg-opacity-30 backdrop-blur-sm rounded-xl p-3 border border-yellow-400 border-opacity-30">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <div>
                          <p className="text-sm font-medium text-white">Location needed</p>
                          <p className="text-xs text-white opacity-80">{locationError || 'Enable to find stations'}</p>
                        </div>
                      </div>
                      <button
                        onClick={retryLocation}
                        className="w-full xs:w-auto px-4 py-1.5 bg-white text-yellow-600 rounded-lg hover:bg-gray-100 transition font-medium text-xs shadow-md"
                        aria-label="Enable location"
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <SearchBar 
                onSearch={handleSearchResult}
                onLocationFound={handleLocationFound} 
              />
              
              {/* Radius Control */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-md border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
                  <label className="text-sm sm:text-base lg:text-lg font-semibold text-blue-700">
                    Search Radius
                  </label>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold text-sm sm:text-base">
                    {radius} km
                  </span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Adjust search radius"
                />
                
                <div className="flex justify-between text-xs sm:text-sm text-blue-600 mt-2 px-1">
                  <span>1km</span>
                  <span>50km</span>
                  <span>100km</span>
                  <span>200km</span>
                </div>
                
                {/* Quick range buttons */}
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  {[1, 5, 10, 25, 50, 100, 150, 200].map(value => (
                    <button
                      key={value}
                      onClick={() => setQuickRadius(value)}
                      className={`px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                        radius === value 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                      aria-label={`Set radius to ${value} kilometers`}
                    >
                      {value}km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map and Station List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Map */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden h-[45vh] sm:h-[55vh] lg:h-[600px] border border-gray-200">
                  <Map
                    stations={filteredStations}
                    userLocation={userLocation}
                    onStationClick={setSelectedStation}
                    onNavigateClick={handleMapNavigate}
                    height="100%"
                  />
                </div>
              </div>

              {/* Station List */}
              <div className={`lg:col-span-1 ${selectedStation ? 'hidden lg:block' : 'block'}`}>
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg h-[45vh] sm:h-[55vh] lg:h-[600px] flex flex-col border border-gray-200">
                  <StationList
                    stations={filteredStations}
                    onStationSelect={setSelectedStation}
                    onNavigate={handleStartNavigation}
                    selectedStation={selectedStation}
                    title={`Stations (${filteredStations.length} found)`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Station Details Modal - Fixed at top on mobile, centered on larger screens */}
        {selectedStation && !showNavigation && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-hidden" 
            onClick={() => setSelectedStation(null)}
          >
            <div 
              className="bg-white w-full sm:rounded-2xl max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto relative shadow-2xl mt-0 sm:mt-0 rounded-b-2xl sm:rounded-b-2xl" 
              onClick={e => e.stopPropagation()}
              style={{
                maxHeight: 'calc(100vh - 20px)',
                marginTop: 'env(safe-area-inset-top, 0px)'
              }}
            >
              {/* Header with gradient background for better visibility */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-5 z-10 rounded-t-none sm:rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold pr-8 line-clamp-2">{selectedStation.name}</h2>
                  <button 
                    className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-800 transition-colors absolute right-2 top-2 sm:relative sm:right-0 sm:top-0"
                    onClick={() => setSelectedStation(null)}
                    aria-label="Close station details"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Content with better spacing for mobile */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Station Info Cards */}
                <div className="space-y-3">
                  {/* Address */}
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl shrink-0 bg-blue-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">📍</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Address</p>
                        <p className="text-sm sm:text-base text-gray-800">{selectedStation.address || 'Address not available'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Battery Status */}
                  <div className="bg-green-50 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl shrink-0 bg-green-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">🔋</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">Battery Status</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-gray-800">
                            {selectedStation.availableBatteries}/{selectedStation.totalBatteries}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-600">available</span>
                        </div>
                        {/* Battery level indicator */}
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ 
                              width: `${(selectedStation.availableBatteries / selectedStation.totalBatteries) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Operating Hours */}
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl shrink-0 bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">⏰</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Operating Hours</p>
                        <p className="text-sm sm:text-base text-gray-800">{selectedStation.operatingHours || '24/7'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone (if available) */}
                  {selectedStation.phone && (
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-xl sm:text-2xl shrink-0 bg-yellow-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">📞</span>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-yellow-600 font-medium mb-1">Contact</p>
                          <a href={`tel:${selectedStation.phone}`} className="text-sm sm:text-base text-blue-600 hover:underline block">
                            {selectedStation.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Distance (if available) */}
                  {selectedStation.distance && (
                    <div className="bg-orange-50 p-3 sm:p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-xl sm:text-2xl shrink-0 bg-orange-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">📏</span>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Distance from you</p>
                          <p className="text-sm sm:text-base font-bold text-gray-800">
                            {selectedStation.distance < 1 
                              ? `${Math.round(selectedStation.distance * 1000)} meters` 
                              : `${selectedStation.distance} km`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigate Button - Sticky on mobile */}
                <div className="sticky bottom-0 bg-white pt-2 pb-1 sm:pb-0 sm:relative sm:bottom-auto sm:pt-0">
                  <button
                    onClick={() => handleStartNavigation(selectedStation)}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg"
                    aria-label={`Start navigation to ${selectedStation.name}`}
                  >
                    <span className="text-lg">🧭</span>
                    <span>Start Live Navigation</span>
                  </button>
                </div>
                
                {/* Reviews Section */}
                <div className="mt-4 sm:mt-6">
                  <ReviewSection
                    station={selectedStation}
                    onAddReview={handleAddReview}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {showAdmin && !showNavigation && (
          <AdminPanel
            stations={stations}
            onAddStation={handleAddStation}
            onUpdateStation={handleUpdateStation}
            onDeleteStation={handleDeleteStation}
            onAddReview={handleAddReview}
            currentUser={user}
          />
        )}

        {/* Live Navigation */}
        {showNavigation && navigationDestination && (
          <LiveNavigation
            destination={navigationDestination}
            initialLocation={userLocation}
            onClose={closeNavigation}
          />
        )}

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;