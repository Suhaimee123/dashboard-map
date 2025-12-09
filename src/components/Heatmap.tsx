'use client';

import { useEffect, useRef, useState } from 'react';
import { Shop } from '@/lib/data';

// Clean map styles - hide labels but keep icons  
const CLEAN_MAP_STYLES = [
    {
        featureType: 'poi',
        elementType: 'labels.text',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'poi.business',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit.station',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    }
];

const ZOOM_THRESHOLD = 11; // Switch to markers when zoom >= 11

export default function HeatmapComponent({ shops }: { shops: Shop[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [currentZoom, setCurrentZoom] = useState(8);
    const scriptLoadedRef = useRef(false);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        if (!apiKey || !mapRef.current) return;

        let mounted = true;

        const loadGoogleMaps = () => {
            // Check if already loaded
            if (window.google?.maps?.visualization) {
                initMap();
                return;
            }

            // Check if script already added
            if (scriptLoadedRef.current) return;
            scriptLoadedRef.current = true;

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&language=th&region=TH`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (mounted) {
                    initMap();
                }
            };
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!mapRef.current || !window.google?.maps) return;

            // Only initialize map once
            if (!googleMapRef.current) {
                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: 8.5, lng: 99.0 },
                    zoom: 8,
                    styles: CLEAN_MAP_STYLES,
                });
                googleMapRef.current = map;

                // Listen to zoom changes
                map.addListener('zoom_changed', () => {
                    const zoom = map.getZoom() || 8;
                    setCurrentZoom(zoom);
                });

                // Create heatmap layer
                const heatmapData = shops.map((shop) => {
                    return new google.maps.LatLng(shop.lat, shop.lng);
                });

                heatmapRef.current = new google.maps.visualization.HeatmapLayer({
                    data: heatmapData,
                    map: map,
                    radius: 20,
                    opacity: 0.6,
                });

                // Create markers (hidden initially)
                const markers = shops.map((shop) => {
                    const bgColor = shop.checkedIn ? '#3933eaff' : '#dc2626';

                    const marker = new google.maps.Marker({
                        position: { lat: shop.lat, lng: shop.lng },
                        map: null, // Start hidden
                        title: shop.name,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: bgColor,
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                            scale: 10,
                        },
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
              <div style="min-width: 150px; padding: 8px; font-family: system-ui;">
                <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0; color: #1a1a1a;">${shop.name}</h3>
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${shop.address}</div>
                <span style="
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 500;
                  color: white;
                  background-color: ${bgColor};
                ">
                  ${shop.checkedIn ? 'เช็คอินแล้ว' : 'รอดำเนินการ'}
                </span>
              </div>
            `,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });

                    return marker;
                });

                markersRef.current = markers;
            }
        };

        loadGoogleMaps();

        return () => {
            mounted = false;
        };
    }, [apiKey, shops]);

    // Handle zoom-based view switching
    useEffect(() => {
        if (!googleMapRef.current) return;

        const map = googleMapRef.current;

        if (currentZoom >= ZOOM_THRESHOLD) {
            // Show markers, hide heatmap
            markersRef.current.forEach(marker => marker.setMap(map));
            if (heatmapRef.current) {
                heatmapRef.current.setMap(null);
            }
        } else {
            // Show heatmap, hide markers
            if (heatmapRef.current) {
                heatmapRef.current.setMap(map);
            }
            markersRef.current.forEach(marker => marker.setMap(null));
        }
    }, [currentZoom]);

    if (!apiKey) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center p-8 max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ ไม่พบ API Key</h2>
                    <p className="text-gray-700 mb-4">
                        กรุณาเพิ่ม Google Maps API Key ในไฟล์ <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code>
                    </p>
                    <div className="bg-gray-800 text-green-400 p-4 rounded text-left text-sm font-mono">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ใส่_KEY_ตรงนี้
                    </div>
                    <p className="text-gray-600 mt-4 text-sm">
                        หลังจากใส่แล้ว ให้รีสตาร์ท dev server (Ctrl+C แล้ว npm run dev ใหม่)
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div ref={mapRef} className="w-full h-screen" />

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 text-sm z-10">
                <span className="font-medium">
                    {currentZoom >= ZOOM_THRESHOLD ? '📍 โหมดหมุด' : '🔥 โหมด Heatmap'}
                </span>
                <span className="ml-2 text-gray-600">Zoom: {currentZoom}</span>
            </div>
        </>
    );
}
