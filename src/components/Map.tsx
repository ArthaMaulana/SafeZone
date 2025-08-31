// src/components/Map.tsx

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState, useRef } from 'react';
import { getOptimalRoute, RouteResponse } from '../lib/routingService';
import { getAddressInfo, AddressInfo } from '../lib/geocodingService';

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

// Fungsi untuk membuat ikon marker dengan simbol kategori
const createCategoryIcon = (category: string, color: string) => {
  const iconMap: { [key: string]: string } = {
    'crime': '🚨',      // Sirene untuk kejahatan
    'road': '🚧',       // Konstruksi untuk jalan
    'flood': '🌊',      // Gelombang untuk banjir
    'lamp': '💡',       // Lampu untuk penerangan
    'accident': '⚠️',   // Warning untuk kecelakaan
    'disaster': '🔥',   // Api untuk bencana
    'other': '📍',      // Pin untuk lainnya
  };
  
  const icon = iconMap[category] || iconMap['other'];
  
  return L.divIcon({
    className: 'custom-category-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 16px;
          line-height: 1;
          filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
        ">${icon}</div>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
  });
};

// Fungsi untuk membuat ikon marker sederhana untuk end point
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        ">●</div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
  });
};

// Mapping warna untuk setiap kategori
const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'crime': '#dc2626',     // Merah - untuk kejahatan
    'road': '#f59e0b',      // Kuning/Orange - untuk jalan
    'flood': '#2563eb',     // Biru - untuk banjir
    'lamp': '#7c3aed',      // Ungu - untuk lampu
    'accident': '#ea580c',  // Orange gelap - untuk kecelakaan
    'other': '#6b7280',     // Abu-abu - untuk lainnya
  };
  return colorMap[category] || colorMap['other'];
};

// Fungsi untuk mendapatkan ikon berdasarkan kategori
const getCategoryIcon = (category: string) => {
  const color = getCategoryColor(category);
  return createCategoryIcon(category, color);
};

// Definisikan tipe data untuk properti laporan
interface Report {
  id: number;
  lat: number;
  lng: number;
  end_lat?: number;
  end_lng?: number;
  category: string;
  description: string;
}

// Component untuk menampilkan rute yang mengikuti jalan
const RoutePolyline = ({ report, categoryColor }: { report: Report; categoryColor: string }) => {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (report.end_lat && report.end_lng) {
      setIsLoading(true);
      getOptimalRoute(
        { lat: report.lat, lng: report.lng },
        { lat: report.end_lat, lng: report.end_lng }
      ).then((route: RouteResponse | null) => {
        if (route && route.coordinates) {
          // Convert [lng, lat] to [lat, lng] for Leaflet
          const leafletCoords: [number, number][] = route.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(leafletCoords);
        } else {
          // Fallback to straight line if routing fails
          setRouteCoordinates([[report.lat, report.lng], [report.end_lat!, report.end_lng!]]);
        }
        setIsLoading(false);
      }).catch(() => {
        // Fallback to straight line on error
        setRouteCoordinates([[report.lat, report.lng], [report.end_lat!, report.end_lng!]]);
        setIsLoading(false);
      });
    }
  }, [report.lat, report.lng, report.end_lat, report.end_lng]);

  if (!routeCoordinates) return null;

  return (
    <Polyline
      positions={routeCoordinates}
      color={categoryColor}
      weight={4}
      opacity={0.8}
      dashArray={isLoading ? "2, 8" : "5, 10"}
    />
  );
};

// Component untuk mengakses map instance
const MapEventHandler = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

// Component untuk menampilkan alamat dengan loading state
const AddressDisplay = ({ lat, lng, label }: { lat: number; lng: number; label: string }) => {
  const [address, setAddress] = useState<AddressInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAddressInfo(lat, lng).then((addressInfo) => {
      setAddress(addressInfo);
      setIsLoading(false);
    });
  }, [lat, lng]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-1">
        {address?.streetName}
      </p>
      {address?.district && (
        <p className="text-xs text-gray-600">
          {address.district}, {address.city}
        </p>
      )}
      <p className="text-xs text-gray-500 font-mono mt-1">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </p>
    </div>
  );
};

interface MapProps {
  reports: Report[];
  center: [number, number];
  zoom?: number;
  isMarkingMode?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  newReportLocation?: { lat: number; lng: number } | null;
  endReportLocation?: { lat: number; lng: number } | null;
  isRouteMode?: boolean;
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

const Map: React.FC<MapProps> = ({ 
  reports, 
  center, 
  zoom = 13, 
  isMarkingMode = false, 
  onMapClick,
  newReportLocation,
  endReportLocation,
  isRouteMode = false
}) => {
  const mapRef = useRef<L.Map | null>(null);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    (window as any).leafletMap = map;
  };

  const mapClassName = isMarkingMode ? 'crosshair-cursor' : '';

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', zIndex: 1 }} 
      className={mapClassName}
      zoomControl={true}
    >
      <MapEventHandler onMapReady={handleMapReady} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => {
        const hasRoute = report.end_lat != null && report.end_lng != null && report.end_lat !== 0 && report.end_lng !== 0;
        const categoryColor = getCategoryColor(report.category);
        console.log(`Report ${report.id}: hasRoute=${hasRoute}, end_lat=${report.end_lat}, end_lng=${report.end_lng}`);
        
        return (
          <React.Fragment key={report.id}>
            {/* Start marker */}
            <Marker 
              position={[report.lat, report.lng]}
              icon={getCategoryIcon(report.category)}
            >
              <Popup 
                closeButton={false}
                autoClose={true}
                closeOnClick={true}
                className="modern-popup"
                maxWidth={320}
                minWidth={280}
              >
                <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span 
                          className="font-bold text-sm uppercase tracking-wide"
                          style={{ color: categoryColor }}
                        >
                          {report.category}
                        </span>
                        {hasRoute && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Rute
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                          #{report.id}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // Find the marker and close its popup
                            const map = (window as any).leafletMap;
                            if (map) {
                              map.closePopup();
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-500 hover:text-gray-700"
                          title="Tutup popup"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      {report.description}
                    </p>

                    {/* Location Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <AddressDisplay 
                        lat={report.lat} 
                        lng={report.lng} 
                        label={hasRoute ? 'Titik Awal' : 'Lokasi'} 
                      />
                      
                      {hasRoute && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <AddressDisplay 
                            lat={report.end_lat!} 
                            lng={report.end_lng!} 
                            label="Titik Akhir" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/report/${report.id}`;
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Lihat Detail</span>
                      </div>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Route line and end marker if route exists */}
            {hasRoute && (
              <>
                <RoutePolyline report={report} categoryColor={categoryColor} />
                <Marker 
                  position={[report.end_lat!, report.end_lng!]}
                  icon={createColoredIcon('#ff0000')}
                >
                  <Popup 
                    closeButton={false}
                    autoClose={true}
                    closeOnClick={true}
                    className="modern-popup"
                    maxWidth={320}
                    minWidth={280}
                  >
                    <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 border-b border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="font-bold text-sm uppercase tracking-wide text-red-600">
                              {report.category} - Titik Akhir
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">
                              #{report.id}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const popup = e.currentTarget.closest('.leaflet-popup');
                                if (popup) {
                                  const closeBtn = popup.querySelector('.leaflet-popup-close-button') as HTMLElement;
                                  if (closeBtn) closeBtn.click();
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-200 transition-colors duration-200 text-red-500 hover:text-red-700"
                              title="Tutup popup"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-gray-800 text-sm leading-relaxed mb-3">
                          {report.description}
                        </p>

                        {/* Location Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <AddressDisplay 
                            lat={report.end_lat!} 
                            lng={report.end_lng!} 
                            label="Titik Akhir Rute" 
                          />
                        </div>

                        {/* Action Button */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/report/${report.id}`;
                          }}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Lihat Detail</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* Penanda untuk laporan baru yang akan dibuat */}
      {isMarkingMode && newReportLocation && (
        <Marker 
          position={[newReportLocation.lat, newReportLocation.lng]}
          icon={getCategoryIcon('other')}
        />
      )}

      {/* Penanda untuk titik akhir rute */}
      {isMarkingMode && isRouteMode && endReportLocation && (
        <>
          <Marker 
            position={[endReportLocation.lat, endReportLocation.lng]}
            icon={createColoredIcon('#ffffff')}
          />
          {newReportLocation && (
            <Polyline
              positions={[
                [newReportLocation.lat, newReportLocation.lng],
                [endReportLocation.lat, endReportLocation.lng]
              ]}
              color="#6b7280"
              weight={4}
              opacity={0.8}
              dashArray="5, 10"
            />
          )}
        </>
      )}

      <MapEvents onMapClick={onMapClick} isMarkingMode={isMarkingMode} />
      <MapUpdater isMarkingMode={isMarkingMode} />
    </MapContainer>
  );
};

export default Map;
