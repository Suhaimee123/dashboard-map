'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Shop } from '@/lib/data';

const ClusterLayer = ({ shops }: { shops: Shop[] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const markerClusterGroup = (L as any).markerClusterGroup();

        shops.forEach((shop) => {
            // Use inline styles to guarantee visibility regardless of Tailwind extraction
            const bgColor = shop.checkedIn ? '#9333ea' : '#dc2626'; // Purple-600 : Red-600

            // Simple, robust HTML for the icon
            const html = `
          <div style="
            background-color: ${bgColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 6px;
              height: 6px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `;

            const icon = L.divIcon({
                className: 'custom-pin-icon', // Still useful for removing default styles via CSS
                html: html,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            const marker = L.marker([shop.lat, shop.lng], { icon, title: shop.name });

            marker.bindPopup(`
            <div style="min-width: 150px;">
                <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${shop.name}</h3>
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${shop.address}</div>
                <span style="
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 12px;
                  font-weight: 500;
                  color: white;
                  background-color: ${bgColor};
                ">
                    ${shop.checkedIn ? 'เช็คอินแล้ว' : 'รอดำเนินการ'}
                </span>
            </div>
        `);

            markerClusterGroup.addLayer(marker);
        });

        map.addLayer(markerClusterGroup);

        return () => {
            map.removeLayer(markerClusterGroup);
        };
    }, [map, shops]);

    return null;
};

export default function Map({ shops }: { shops: Shop[] }) {
    return (
        <MapContainer
            center={[8.5, 99.0]}
            zoom={8}
            scrollWheelZoom={true}
            className="w-full h-full z-0 outline-none"
            style={{ minHeight: '100vh', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; Google Maps'
                url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}&hl=th"
            />
            <ClusterLayer shops={shops} />
        </MapContainer>
    );
}
