'use client';
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
let DefaultIcon;
if (typeof window !== 'undefined') {
  DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  L.Marker.prototype.options.icon = DefaultIcon;
}

// Only sets the view once when map is created or when first technician is found
function MapAutoCenter({ techs }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!hasCentered.current && techs.length > 0) {
      const activeTechs = techs.filter(t => t.lat !== 0 && t.lng !== 0);
      if (activeTechs.length > 0) {
        const bounds = L.latLngBounds(activeTechs.map(t => [t.lat, t.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        hasCentered.current = true;
      }
    }
  }, [techs, map]);

  return null;
}

export default function LiveMap({ technicians }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return (
    <div style={{ height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        <span>Initializing Fleet Map...</span>
      </div>
    </div>
  );

  const defaultCenter = [20.5937, 78.9629]; // Center of India
  const activeTechs = (technicians || []).filter(t => t.lat !== 0 && t.lng !== 0);

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {activeTechs.map((tech) => (
          <Marker 
            key={tech.technicianId || tech.id} 
            position={[tech.lat, tech.lng]}
            icon={L.divIcon({
                className: 'custom-div-icon',
                html: `
                  <div style="position: relative;">
                    <div style="background-color: ${tech.isOnline ? '#22c55e' : '#64748b'}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.06); animation: ${tech.isOnline ? 'pulse 2s infinite' : 'none'};"></div>
                    ${tech.isOnline ? '<div style="position: absolute; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%; background-color: #22c55e; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
                  </div>
                  <style>
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.1); }
                    }
                    @keyframes ping {
                      75%, 100% { transform: scale(3); opacity: 0; }
                    }
                  </style>
                `,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })}
          >
            <Popup>
              <div style={{ padding: '8px', minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tech.isOnline ? '#22c55e' : '#64748b' }}></div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{tech.name}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Role:</span> {tech.role || 'Technician'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Last Update: {tech.lastUpdate ? new Date(tech.lastUpdate).toLocaleTimeString() : 'Recently'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapAutoCenter techs={activeTechs} />
      </MapContainer>
    </div>
  );
}
