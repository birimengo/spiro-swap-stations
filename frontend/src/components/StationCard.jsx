import React from 'react';

const StationCard = ({ station, onClick, onNavigate, isSelected }) => {
  const getBatteryColor = () => {
    if (station.availableBatteries === 0) return 'bg-red-500';
    if (station.availableBatteries < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBatteryStatus = () => {
    if (station.availableBatteries === 0) return 'Out';
    if (station.availableBatteries < 5) return 'Low';
    return 'Good';
  };

  const formatDistance = (d) => d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow transition-all ${isSelected ? 'ring-1 ring-green-500' : ''}`}>
      <div className="p-2.5">
        {/* Header */}
        <div className="flex justify-between items-start gap-1 mb-1.5">
          <h4 className="font-medium text-gray-800 text-xs line-clamp-1">{station.name}</h4>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white whitespace-nowrap ${getBatteryColor()}`}>
            {getBatteryStatus()}
          </span>
        </div>

        {/* Address */}
        <p className="text-[10px] text-gray-600 mb-2 line-clamp-1">📍 {station.address || 'N/A'}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-600 mb-2">
          <span>🔋{station.availableBatteries}/{station.totalBatteries}</span>
          {station.distance && <span>📏{formatDistance(station.distance)}</span>}
          <span>⭐{station.reviews?.length || 0}</span>
        </div>

        {/* Hours & Phone */}
        {station.operatingHours && (
          <p className="text-[9px] text-gray-400 mb-1 truncate">⏰ {station.operatingHours}</p>
        )}
        {station.phone && (
          <p className="text-[9px] text-blue-500 mb-2 truncate">📞 {station.phone}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={() => onClick(station)}
            className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-[9px] font-medium"
          >
            Details
          </button>
          <button
            onClick={() => onNavigate(station)}
            className="flex-1 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-[9px] font-medium flex items-center justify-center gap-0.5"
          >
            <span>🧭</span> Go
          </button>
        </div>
      </div>

      {/* Footer */}
      {station.addedBy && (
        <div className="px-2.5 py-1 bg-gray-50 border-t text-[8px] text-gray-400 flex justify-between">
          <span>By: {station.addedBy}</span>
          <span>{new Date(station.addedDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default StationCard;