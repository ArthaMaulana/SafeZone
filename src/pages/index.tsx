// src/pages/index.tsx

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRealtimeReports } from '../hooks/useRealtimeReports';
import { useGeoPermission } from '../hooks/useGeoPermission';
import ReportForm from '../components/ReportForm';

// Komponen Peta di-load secara dinamis untuk menghindari masalah SSR dengan Leaflet
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false 
});

const HomePage = () => {
  const { reports, isLoading: isLoadingReports, error: reportsError } = useRealtimeReports();
  const { position, isLoading: isLoadingGeo, error: geoError } = useGeoPermission();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Tentukan pusat peta: lokasi pengguna jika ada, jika tidak, default ke Jakarta
  const mapCenter: [number, number] = position
    ? [position.coords.latitude, position.coords.longitude]
    : [-6.2088, 106.8456]; // Default: Jakarta

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    // Data akan refresh otomatis via useRealtimeReports
  };

  return (
    <div className="relative h-screen w-screen flex flex-col md:flex-row">
      {/* Kolom Peta */}
      <div className="h-1/2 w-full md:h-full md:w-2/3 relative">
        {(isLoadingGeo || isLoadingReports) && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-10">
            <p className="text-white text-lg">Memuat data...</p>
          </div>
        )}
        <Map reports={reports.map(r => ({...r, id: r.report_id}))} center={mapCenter} />
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="absolute bottom-4 right-4 z-10 bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          Buat Laporan
        </button>
      </div>

      {/* Kolom Daftar Laporan */}
      <aside className="h-1/2 w-full md:h-full md:w-1/3 p-4 overflow-y-auto bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Laporan Terkini</h1>
        {reportsError && <p className="text-red-500">Error: {reportsError}</p>}
        {geoError && <p className="text-yellow-600">Peringatan: {geoError.message}</p>}
        <div className="space-y-3">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.report_id} className="bg-white p-3 rounded-lg shadow">
                <h3 className="font-semibold">{report.category.toUpperCase()}</h3>
                <p className="text-sm text-gray-600 truncate">{report.description}</p>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Skor: {report.score}</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p>Belum ada laporan.</p>
          )}
        </div>
      </aside>

      {/* Modal Form Laporan */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Laporan Baru</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <ReportForm onSuccess={handleFormSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
