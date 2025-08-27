// src/components/Map.tsx

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
}

const Map = ({ reports, center, zoom = 13 }: MapProps) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <Marker key={report.id} position={[report.lat, report.lng]}>
          <Popup>
            <b>{report.category.toUpperCase()}</b>
            <p>{report.description}</p>
            <a href={`/report/${report.id}`}>Lihat Detail</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
