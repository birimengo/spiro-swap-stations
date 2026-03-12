import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Map = ({ stations = [], userLocation, onStationClick, onNavigateClick, height = '500px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('Initializing map with container:', mapRef.current);
    console.log('Container height:', mapRef.current.clientHeight);

    // Default to Nairobi if no user location
    const center = userLocation 
      ? [userLocation.lat, userLocation.lng] 
      : [-1.286389, 36.817223];

    // Create map instance
    mapInstanceRef.current = L.map(mapRef.current).setView(center, 12);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    setMapReady(true);
    console.log('Map initialized successfully');

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array - run once

  // Update markers when stations or userLocation change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) {
      console.log('Map not ready yet');
      return;
    }

    console.log('Updating markers with', stations.length, 'stations');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      console.log('Adding user marker at:', userLocation);
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: 'user-marker',
          html: '📍',
          iconSize: [24, 24]
        })
      }).addTo(mapInstanceRef.current)
        .bindPopup('You are here');
      
      markersRef.current.push(userMarker);
    }

    // Add station markers
    stations.forEach(station => {
      if (!station.latitude || !station.longitude) {
        console.warn('Station missing coordinates:', station);
        return;
      }

      const batteryColor = 
        station.availableBatteries === 0 ? '#ef4444' :
        station.availableBatteries < 5 ? '#f59e0b' : '#10b981';

      // Create the marker
      const marker = L.marker([station.latitude, station.longitude], {
        icon: L.divIcon({
          className: 'station-marker',
          html: `<div style="
            background-color: ${batteryColor};
            width: 40px;
            height: 40px;
            border-radius: 20px;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          ">${station.availableBatteries || 0}</div>`,
          iconSize: [40, 40],
          popupAnchor: [0, -20]
        })
      });

      // Create popup content as a DOM element
      const popupDiv = document.createElement('div');
      popupDiv.style.minWidth = '240px';
      popupDiv.style.maxWidth = '280px';
      
      // Add station info
      popupDiv.innerHTML = `
        <h3 style="font-weight: bold; margin: 0 0 5px; font-size: 16px; color: #333;">${station.name || 'Unknown Station'}</h3>
        <p style="margin: 5px 0; display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 14px;">📍</span> 
          <span style="font-size: 13px; color: #666;">${station.address || 'Address not available'}</span>
        </p>
        <p style="margin: 5px 0; display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 14px;">🔋</span> 
          <span style="font-size: 13px; color: #666;">${station.availableBatteries || 0}/${station.totalBatteries || 10} batteries available</span>
        </p>
        <p style="margin: 5px 0; display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 14px;">⏰</span> 
          <span style="font-size: 13px; color: #666;">${station.operatingHours || 'Open 24/7'}</span>
        </p>
        ${station.phone ? `
          <p style="margin: 5px 0; display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 14px;">📞</span> 
            <span style="font-size: 13px; color: #666;">${station.phone}</span>
          </p>
        ` : ''}
        <div style="margin-top: 12px; display: flex; gap: 8px;"></div>
      `;

      // Create and add the navigate button
      const buttonContainer = popupDiv.querySelector('div:last-child');
      const navigateButton = document.createElement('button');
      
      navigateButton.innerHTML = '<span>🧭</span><span>Navigate to this station</span>';
      navigateButton.style.cssText = `
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background-color 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;

      // Add hover effects
      navigateButton.addEventListener('mouseover', () => {
        navigateButton.style.backgroundColor = '#2563eb';
      });
      navigateButton.addEventListener('mouseout', () => {
        navigateButton.style.backgroundColor = '#3b82f6';
      });

      // Add click handler directly to the button
      navigateButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Navigate button clicked for:', station.name);
        
        // Close the popup
        marker.closePopup();
        
        // Call the navigate handler with the station
        if (onNavigateClick) {
          onNavigateClick(station);
        }
      });

      buttonContainer.appendChild(navigateButton);

      // Bind the popup
      marker.bindPopup(popupDiv);

      marker.addTo(mapInstanceRef.current);

      // Add station click handler if provided
      if (onStationClick) {
        marker.on('click', () => onStationClick(station));
      }
      
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [stations, userLocation, mapReady, onNavigateClick]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }} 
      className="leaflet-container"
    />
  );
};

export default Map;