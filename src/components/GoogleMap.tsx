'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
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

export default function GoogleMapComponent({ shops }: { shops: Shop[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        // Only initialize map once
        if (!googleMapRef.current) {
            const map = new google.maps.Map(mapRef.current, {
                center: { lat: 8.5, lng: 99.0 },
                zoom: 8,
                styles: CLEAN_MAP_STYLES,
            });
            googleMapRef.current = map;
        }

        const map = googleMapRef.current;

        // Clear existing markers and clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Create markers
        const markers = shops.map((shop) => {
            const bgColor = shop.checkedIn ? '#9333ea' : '#dc2626';

            const marker = new google.maps.Marker({
                position: { lat: shop.lat, lng: shop.lng },
                title: shop.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: bgColor,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 12, // ทำให้ใหญ่ขึ้น
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

        // Add MarkerClusterer - only create once
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.addMarkers(markers);
        } else {
            clustererRef.current = new MarkerClusterer({
                map,
                markers,
            });
        }
    }, [shops]); // shops is a dependency because it's used to create markers

    useEffect(() => {
        if (!apiKey || !mapRef.current) return;

        let mounted = true;

        const loadGoogleMaps = () => {
            if (window.google?.maps) {
                initMap();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=th&region=TH`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (mounted) { // Ensure component is still mounted before calling initMap
                    initMap();
                }
            };
            document.head.appendChild(script);
        };

        loadGoogleMaps();

        return () => {
            mounted = false;
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
            }
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, [apiKey, initMap]); // initMap is a dependency because it's called here

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
        <div ref={mapRef} className="w-full h-screen" />
    );
}
