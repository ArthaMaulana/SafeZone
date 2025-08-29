// src/pages/index.tsx

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useGeoPermission } from '../hooks/useGeoPermission';
import { useRealtimeReports } from '../hooks/useRealtimeReports';
import ReportForm from '../components/ReportForm';
import { useRouter } from 'next/router';

// Dynamic import for Map component to prevent SSR issues
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false 
});

const HomePage = () => {
  const { reports, isLoading: isLoadingReports, error: reportsError } = useRealtimeReports();
  const { position, isLoading: isLoadingGeo, error: geoError } = useGeoPermission();
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [newReportLocation, setNewReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  // Check for URL parameters to center map on specific location
  const { lat, lng, zoom } = router.query;
  
  const mapCenter: [number, number] = lat && lng 
    ? [parseFloat(lat as string), parseFloat(lng as string)]
    : position
    ? [position.coords.latitude, position.coords.longitude]
    : [-6.2088, 106.8456]; // Default to Jakarta
    
  const mapZoom = zoom ? parseInt(zoom as string) : 13;

  const handleStartCreateReport = () => {
    setIsCreatingReport(true);
    setNewReportLocation(null); // Reset location when starting
  };

  const handleCancelCreateReport = () => {
    setIsCreatingReport(false);
    setNewReportLocation(null);
  };

  const handleFormSuccess = async () => {
    setIsCreatingReport(false);
    setNewReportLocation(null); // Reset location after submission
    
    // Force refresh reports by re-triggering the hook
    window.location.reload();
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row-reverse bg-gray-100 font-sans">
      {/* Sidebar for reports and form */}
      <aside className="w-full md:w-96 bg-white p-6 flex flex-col shadow-lg overflow-y-auto z-10">
        {isCreatingReport ? (
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h1 className="text-2xl font-bold text-gray-800">Buat Laporan Baru</h1>
              <button onClick={handleCancelCreateReport} className="text-gray-500 hover:text-gray-800 font-semibold py-1 px-3 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
            </div>
            <ReportForm 
              onSuccess={handleFormSuccess} 
              initialLocation={newReportLocation}
              onLocationChange={setNewReportLocation}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h1 className="text-3xl font-bold text-gray-800">Laporan Terkini</h1>
              <button 
                onClick={handleStartCreateReport}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              >
                + Buat Laporan
              </button>
            </div>
            {reportsError && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {reportsError}</p>}
            {geoError && <p className="text-yellow-700 bg-yellow-100 p-3 rounded-md">Peringatan: {geoError}</p>}
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              {isLoadingReports ? (
                <p className="text-gray-500">Memuat laporan...</p>
              ) : reports.length > 0 ? (
                reports.map(report => (
                  <div key={report.report_id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{report.category.toUpperCase()}</span>
                      <span className="text-lg font-bold text-gray-700">{report.score}</span>
                    </div>
                    <p className="mt-2 text-gray-800">{report.description}</p>
                    <p className="mt-3 text-xs text-gray-500">Dilaporkan pada {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Belum Ada Laporan</h3>
                  <p className="text-gray-600 mt-2">Jadilah yang pertama melaporkan kondisi di sekitar Anda dengan menekan tombol di atas.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main content area for the map */}
      <main className="flex-1 relative" style={{ zIndex: 1 }}>
        {(isLoadingGeo || isLoadingReports) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <span className="text-lg font-medium text-gray-700">Memuat Peta dan Laporan...</span>
          </div>
        )}
        <Map 
          reports={reports.map(r => ({...r, id: r.report_id}))} 
          center={mapCenter} 
          zoom={mapZoom}
          isMarkingMode={isCreatingReport}
          onMapClick={(coords) => setNewReportLocation(coords)}
          newReportLocation={newReportLocation}
        />

        {/* Welcome Overlay when no reports are available - hanya tampil jika tidak sedang membuat laporan */}
        {!isLoadingReports && reports.length === 0 && !isCreatingReport && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4 pointer-events-auto">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto transform animate-modal-pop-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Selamat Datang di SafeZone!</h2>
              <p className="text-gray-600 mb-6">
                Lihat dan laporkan kondisi bahaya di sekitar Anda. Mari mulai!
              </p>
              <div className="text-left space-y-3 bg-gray-50 p-4 rounded-lg border">
                <p className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">1.</span>
                  <span><span className="font-semibold">Lihat Peta:</span> Temukan laporan dari pengguna lain yang ditandai di peta.</span>
                </p>
                <p className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">2.</span>
                  <span><span className="font-semibold">Buat Laporan:</span> Klik tombol di bawah ini atau di sidebar untuk melaporkan masalah.</span>
                </p>
                <p className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">3.</span>
                  <span><span className="font-semibold">Berkontribusi:</span> Laporan Anda akan langsung muncul di peta untuk membantu warga lain.</span>
                </p>
              </div>
              <button 
                onClick={handleStartCreateReport}
                className="mt-6 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all transform hover:scale-105"
              >
                Buat Laporan Pertama Anda
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
