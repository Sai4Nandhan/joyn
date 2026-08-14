import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';

export function InteractiveMapPin({ lat, lng, onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const defaultLat = lat != null ? lat : 17.9784; // Warangal default
  const defaultLng = lng != null ? lng : 79.5941;

  useEffect(() => {
    // Ensure Leaflet window.L is available
    if (typeof window === 'undefined' || !window.L || !mapContainerRef.current) return;

    const L = window.L;

    // Custom pulse marker icon
    const customIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -100%);
        ">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(225, 29, 72, 0.3);
            animation: pulsePin 2s infinite;
          "></div>
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed, #e11d48);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Handle Map Click to Drop Pin
      map.on('click', (e) => {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;
        marker.setLatLng([newLat, newLng]);
        handleLocationUpdate(newLat, newLng);
      });

      // Handle Marker Drag End
      marker.on('dragend', (e) => {
        const newPos = marker.getLatLng();
        handleLocationUpdate(newPos.lat, newPos.lng);
      });
    } else {
      // Update existing map view & marker position if lat/lng props change
      const map = mapInstanceRef.current;
      const marker = markerInstanceRef.current;
      if (map && marker) {
        marker.setLatLng([defaultLat, defaultLng]);
        map.setView([defaultLat, defaultLng], map.getZoom());
      }
    }
  }, [defaultLat, defaultLng]);

  // Reverse Geocode & Callback when Pin Position Changes
  const handleLocationUpdate = async (newLat, newLng) => {
    setIsGeocoding(true);

    let placeName = 'Pinned Location';
    let address = `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`,
        { headers: { 'User-Agent': 'JOYN-Activity-Platform/1.0' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        address = data.display_name;
        const parts = data.display_name.split(',');
        placeName = `${parts[0].trim()}${parts[1] ? `, ${parts[1].trim()}` : ''}`;
      }
    } catch {
      // Ignore network geocode error
    } finally {
      setIsGeocoding(false);
    }

    const mapUrl = `https://maps.google.com/?q=${newLat},${newLng}`;

    onLocationSelect({
      lat: newLat,
      lng: newLng,
      placeName,
      address,
      mapUrl,
      source: 'pin_drop',
    });
  };

  return (
    <div className="space-y-2">
      {/* Map Container with Instruction Overlay */}
      <div className="relative h-72 w-full rounded-2xl overflow-hidden border-2 border-violet-500/40 shadow-lg group">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-500 animate-bounce" />
              <span>Click map or drag pin to drop location</span>
            </div>
            {isGeocoding && (
              <div className="flex items-center gap-1.5 text-violet-300 text-[11px]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Updating address...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulsePin {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
