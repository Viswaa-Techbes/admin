'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Customer and Technician
const CustomerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const TechIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapBoundsCenter({ customer, tech, routeLine }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (customer && customer[0] && customer[1]) points.push(customer);
    if (tech && tech[0] && tech[1]) points.push(tech);
    if (routeLine && routeLine.length > 0) {
      routeLine.forEach(p => points.push(p));
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [customer, tech, routeLine, map]);

  return null;
}

export default function RouteMap({ customerCoords, techCoords, bookingId }) {
  const [routeData, setRouteData] = useState({
    distanceKm: 0,
    durationMinutes: 0,
    polyline: [],
    loading: false,
    error: '',
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch routing directions
  useEffect(() => {
    if (!customerCoords || !techCoords || !customerCoords.lat || !customerCoords.lng || !techCoords.lat || !techCoords.lng) {
      return;
    }

    async function fetchDirections() {
      setRouteData(prev => ({ ...prev, loading: true, error: '' }));
      try {
        const url = `/api/v2/routing/directions?startLat=${techCoords.lat}&startLng=${techCoords.lng}&endLat=${customerCoords.lat}&endLng=${customerCoords.lng}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Routing API failed');
        const json = await res.json();
        if (json.success && json.data) {
          setRouteData({
            distanceKm: json.data.distanceKm,
            durationMinutes: json.data.durationMinutes,
            polyline: json.data.polyline || [],
            loading: false,
            error: '',
          });
        } else {
          throw new Error(json.message || 'Failed to fetch directions');
        }
      } catch (err) {
        console.error('Directions fetching error:', err);
        // Fallback straight line
        const dist = haversineDistance(techCoords.lat, techCoords.lng, customerCoords.lat, customerCoords.lng);
        setRouteData({
          distanceKm: parseFloat(dist.toFixed(2)),
          durationMinutes: parseFloat((dist * 2).toFixed(1)),
          polyline: [
            [techCoords.lat, techCoords.lng],
            [customerCoords.lat, customerCoords.lng]
          ],
          loading: false,
          error: 'Using straight-line approximation',
        });
      }
    }

    fetchDirections();
  }, [customerCoords, techCoords]);

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  if (!isClient) return <div style={{ height: '220px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#64748b' }}>Map loading...</div>;

  const hasCust = customerCoords && customerCoords.lat && customerCoords.lng;
  const hasTech = techCoords && techCoords.lat && techCoords.lng;
  const centerPoint = hasCust ? [customerCoords.lat, customerCoords.lng] : [12.9716, 77.5946];

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ flex: 1, height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', zIndex: 10 }}>
        <MapContainer center={centerPoint} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {hasCust && (
            <Marker position={[customerCoords.lat, customerCoords.lng]} icon={CustomerIcon}>
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>Service Location</strong>
                  <br />
                  Lat: {customerCoords.lat.toFixed(5)}, Lng: {customerCoords.lng.toFixed(5)}
                </div>
              </Popup>
            </Marker>
          )}

          {hasTech && (
            <Marker position={[techCoords.lat, techCoords.lng]} icon={TechIcon}>
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>Assigned Technician</strong>
                  <br />
                  Lat: {techCoords.lat.toFixed(5)}, Lng: {techCoords.lng.toFixed(5)}
                </div>
              </Popup>
            </Marker>
          )}

          {routeData.polyline.length > 0 && (
            <Polyline positions={routeData.polyline} color="#6366f1" weight={4} opacity={0.8} />
          )}

          <MapBoundsCenter 
            customer={hasCust ? [customerCoords.lat, customerCoords.lng] : null}
            tech={hasTech ? [techCoords.lat, techCoords.lng] : null}
            routeLine={routeData.polyline}
          />
        </MapContainer>
      </div>

      {hasCust && hasTech && (
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Distance:</span>{' '}
            <strong style={{ color: '#1e293b' }}>{routeData.distanceKm.toFixed(2)} km</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ETA:</span>{' '}
            <strong style={{ color: '#1e293b' }}>{routeData.durationMinutes.toFixed(1)} mins</strong>
          </div>
          {routeData.error && (
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 500 }}>{routeData.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
