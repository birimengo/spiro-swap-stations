import React from 'react';
import StationCard from './StationCard';

const StationList = ({ stations, onStationSelect, selectedStation, onNavigate, title }) => {
  if (!stations || stations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-xs text-center">No stations found</p>
        <p className="text-[10px] text-gray-400 text-center mt-1">Increase radius</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium p-2 border-b border-gray-200">{title}</h3>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {stations.map(station => (
          <StationCard
            key={station._id}
            station={station}
            onClick={onStationSelect}
            onNavigate={onNavigate}
            isSelected={selectedStation?._id === station._id}
          />
        ))}
      </div>
    </div>
  );
};

export default StationList;