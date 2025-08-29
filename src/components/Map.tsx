// src/components/Map.tsx

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect } from 'react';

// Fix untuk ikon default Leaflet yang rusak dengan bundler modern
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});

// Definisikan tipe data untuk properti laporan
interface Report {
  id: number;
  lat: number;
  lng: number;
  category: string;
  description: string;
}

interface MapProps {
  reports: Report[];
  center: [number, number];
  zoom?: number;
  isMarkingMode?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  newReportLocation?: { lat: number; lng: number } | null;
}

// Komponen terpisah untuk menangani event klik pada peta
// Komponen untuk me-refresh peta saat mode berubah
const MapEvents = ({ onMapClick, isMarkingMode }: Pick<MapProps, 'onMapClick' | 'isMarkingMode'>) => {
  const map = useMapEvents({
    click(e) {
      if (isMarkingMode && onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  
  // Tambahkan event listener langsung ke map instance sebagai fallback
  useEffect(() => {
    if (map && isMarkingMode && onMapClick) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng);
      };
      
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [map, isMarkingMode, onMapClick]);
  
  return null;
};

const MapUpdater = ({ isMarkingMode }: { isMarkingMode?: boolean }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [isMarkingMode, map]);
  return null;
};

const Map = ({ reports, center, zoom = 13, isMarkingMode = false, onMapClick, newReportLocation }: MapProps) => {
  const mapClassName = isMarkingMode ? 'crosshair-cursor' : '';

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', zIndex: 1 }} 
      className={mapClassName}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <Marker key={report.id} position={[report.lat, report.lng]}>
          <Popup 
            closeButton={true}
            autoClose={false}
            closeOnClick={false}
            className="custom-popup"
          >
            <div style={{ zIndex: 10000 }}>
              <b>{report.category.toUpperCase()}</b>
              <p>{report.description}</p>
              <a href={`/report/${report.id}`} className="text-blue-600 hover:underline">Lihat Detail</a>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Penanda untuk laporan baru yang akan dibuat */}
      {isMarkingMode && newReportLocation && (
        <Marker position={[newReportLocation.lat, newReportLocation.lng]} />
      )}

      <MapEvents onMapClick={onMapClick} isMarkingMode={isMarkingMode} />
      <MapUpdater isMarkingMode={isMarkingMode} />
    </MapContainer>
  );
};

export default Map;
