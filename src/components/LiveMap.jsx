'use client';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function LiveMap({ technicians }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div style={{ height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Map...</div>;

  const defaultCenter = [20.5937, 78.9629]; // Center of India
  
  // Find a center based on technicians if available
  const activeTechs = technicians.filter(t => t.lat !== 0 && t.lng !== 0);
  const center = activeTechs.length > 0 
    ? [activeTechs[0].lat, activeTechs[0].lng] 
    : defaultCenter;

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer 
        center={center} 
        zoom={activeTechs.length > 0 ? 12 : 5} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {activeTechs.map((tech) => (
          <Marker 
            key={tech.technicianId} 
            position={[tech.lat, tech.lng]}
            icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${tech.isOnline ? '#4ade80' : '#94a3b8'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })}
          >
            <Popup>
              <div style={{ padding: '5px' }}>
                <strong style={{ display: 'block', fontSize: '14px' }}>{tech.name}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{tech.specialty || 'Technician'}</span>
                <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tech.isOnline ? '#4ade80' : '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px' }}>{tech.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {activeTechs.length > 0 && <ChangeView center={center} zoom={12} />}
      </MapContainer>
    </div>
  );
}
