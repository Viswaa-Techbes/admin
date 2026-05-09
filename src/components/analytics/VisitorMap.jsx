"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Props: viewers (dashboard data), onCityClick(city)
export default function VisitorMap({ viewers, onCityClick }) {
  // viewers.topCities: [{ city, visitors, coords?: {lat,lng} }]
  const points = [];
  if (viewers && Array.isArray(viewers.topCities)) {
    viewers.topCities.forEach((c, i) => {
      if (c.coords && typeof c.coords.lat === 'number' && typeof c.coords.lng === 'number') {
        points.push({ city: c.city, count: c.visitors || 1, lat: c.coords.lat, lng: c.coords.lng });
      }
    });
  }

  // fallback: if rawLocations provided
  if (viewers && Array.isArray(viewers.rawLocations)) {
    viewers.rawLocations.forEach((p) => {
      if (p.lat && p.lng) points.push({ city: p.city || 'unknown', count: p.count || 1, lat: p.lat, lng: p.lng });
    });
  }

  if (!points.length) {
    return (
      <div style={{ padding: 20, color: '#64748b' }}>
        No geolocation data available. Enable client geolocation in the tracking script to show markers.
      </div>
    );
  }

  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

  return (
    <MapContainer center={[avgLat, avgLng]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: 12 }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((pt, idx) => (
        <CircleMarker
          key={idx}
          center={[pt.lat, pt.lng]}
          radius={6 + Math.min(25, Math.log(pt.count + 1) * 6)}
          pathOptions={{ color: '#1565C0', fillColor: '#1565C0', fillOpacity: 0.25 }}
          eventHandlers={{ click: () => onCityClick && onCityClick(pt.city) }}
        >
          <Tooltip>
            <div style={{ fontWeight: 700 }}>{pt.city}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{pt.count} visitors</div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
