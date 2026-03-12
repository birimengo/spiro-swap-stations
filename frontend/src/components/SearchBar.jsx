import React, { useState } from 'react';

const SearchBar = ({ onSearch, onLocationFound }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'User-Agent': 'Spiro/1.0' } }
      );
      const data = await res.json();
      const searchResults = data.map(item => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name
      }));
      setResults(searchResults);
      onSearch?.(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    onLocationFound?.({ lat: location.lat, lng: location.lng });
    setResults([]);
    setQuery(location.displayName || '');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationFound?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoading(false);
          setQuery('📍 Current location');
          setResults([]);
        },
        () => {
          alert('Enable location services');
          setLoading(false);
        }
      );
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-1">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          {loading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs">
          Go
        </button>
        <button type="button" onClick={getCurrentLocation} className="px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          📍
        </button>
      </form>

      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectLocation(r)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 border-b last:border-b-0 text-[10px]"
            >
              <span className="mr-1">📍</span>
              <span className="line-clamp-1">{r.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;