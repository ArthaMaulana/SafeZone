// src/pages/index.tsx

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGeoPermission } from '../hooks/useGeoPermission';
import { useRealtimeReports } from '../hooks/useRealtimeReports';
import ReportForm from '../components/ReportForm';
import Navbar from '../components/Navbar';
import ReportStats from '../components/ReportStats';
import { useRouter } from 'next/router';

// Category icon mapping
const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'crime': '🚨',      // Sirene untuk kejahatan
    'road': '🚧',       // Konstruksi untuk jalan
    'flood': '🌊',      // Gelombang untuk banjir
    'lamp': '💡',       // Lampu untuk penerangan
    'accident': '⚠️',   // Warning untuk kecelakaan
    'disaster': '🔥',   // Api untuk bencana
    'other': '📍',      // Pin untuk lainnya
  };
  return iconMap[category] || iconMap['other'];
};

// Category color mapping
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

// Dynamic import for Map component to prevent SSR issues
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false 
});

const HomePage = () => {
  const { reports, isLoading: isLoadingReports, error: reportsError } = useRealtimeReports();
  const { position, isLoading: isLoadingGeo, error: geoError } = useGeoPermission();
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [newReportLocation, setNewReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [endReportLocation, setEndReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Check for URL parameters to center map on specific location
  const { lat, lng, zoom } = router.query;
  
  const mapCenter: [number, number] = lat && lng 
    ? [parseFloat(lat as string), parseFloat(lng as string)]
    : position
    ? [position.coords.latitude, position.coords.longitude]
    : [-6.2088, 106.8456]; // Default to Jakarta
    
  const mapZoom = zoom ? parseInt(zoom as string) : 13;

  // Handle mobile detection and scroll
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollButton(scrollY > 200);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCreateReport = () => {
    setIsCreatingReport(true);
    setNewReportLocation(null); // Reset location when starting
    setEndReportLocation(null);
    setIsRouteMode(false);
  };

  const handleCancelCreateReport = () => {
    setIsCreatingReport(false);
    setNewReportLocation(null);
    setEndReportLocation(null);
    setIsRouteMode(false);
  };

  const handleFormSuccess = () => {
    setIsCreatingReport(false);
    setNewReportLocation(null);
    setEndReportLocation(null);
    setIsRouteMode(false);
    
    // Reports will be updated automatically via realtime subscription
    // No need to reload the page
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (isRouteMode) {
      if (!newReportLocation) {
        // First click in route mode - set start point
        setNewReportLocation(coords);
      } else if (!endReportLocation) {
        // Second click in route mode - set end point
        setEndReportLocation(coords);
      } else {
        // Third click - reset and start over
        setNewReportLocation(coords);
        setEndReportLocation(null);
      }
    } else {
      // Single point mode - just set the location
      setNewReportLocation(coords);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 font-sans">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col-reverse md:flex-row-reverse" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar for reports and form */}
      <aside className="md:h-full md:w-96 w-full bg-white flex flex-col shadow-lg overflow-y-auto z-10 p-4 md:p-6" 
             style={{ height: isMobile ? '66.67%' : '100%' }}>
        {isCreatingReport ? (
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h1 className="text-2xl font-bold text-gray-800">Buat Laporan Baru</h1>
              <button onClick={handleCancelCreateReport} className="text-gray-500 hover:text-gray-800 font-semibold py-1 px-3 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
            </div>
            <ReportForm 
              onSuccess={handleFormSuccess} 
              initialLocation={newReportLocation}
              endLocation={endReportLocation}
              isRouteMode={isRouteMode}
              onLocationChange={setNewReportLocation}
              onEndLocationChange={setEndReportLocation}
              onRouteModeChange={setIsRouteMode}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h1 className="text-2xl font-bold text-gray-800">SafeZone</h1>
              <button 
                onClick={handleStartCreateReport}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              >
                + Buat Laporan
              </button>
            </div>
            {reportsError && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {reportsError}</p>}
            {geoError && <p className="text-yellow-700 bg-yellow-100 p-3 rounded-md">Peringatan: {geoError}</p>}
            
            {/* Report Statistics */}
            <div className="mb-4">
              <ReportStats />
            </div>
            
            {/* All Reports Section */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Semua Laporan</h2>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {isLoadingReports ? (
                  <p className="text-gray-500">Memuat laporan...</p>
                ) : reports.length > 0 ? (
                  reports.map(report => (
                    <div 
                      key={report.report_id} 
                      className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-100"
                      onClick={() => router.push(`/report/${report.report_id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getCategoryIcon(report.category)}</span>
                          <span 
                            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: getCategoryColor(report.category) }}
                          >
                            {report.category.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{report.score}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-800 line-clamp-2">{report.description}</p>
                      <p className="mt-2 text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 px-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800">Belum Ada Laporan</h3>
                    <p className="text-gray-600 mt-2">Jadilah yang pertama melaporkan kondisi di sekitar Anda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area for the map */}
      <main className="flex-1 relative md:h-full" style={{ height: isMobile ? '33.33%' : '100%', zIndex: 1 }}>
        {(isLoadingGeo || isLoadingReports) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <span className="text-lg font-medium text-gray-700">Memuat Peta dan Laporan...</span>
          </div>
        )}
        <Map 
          reports={reports.map(r => {
            const mappedReport = {
              ...r, 
              id: r.report_id,
              end_lat: r.end_lat,
              end_lng: r.end_lng
            };
            console.log('Mapped report for Map:', mappedReport);
            return mappedReport;
          })} 
          center={mapCenter} 
          zoom={mapZoom}
          isMarkingMode={isCreatingReport}
          onMapClick={handleMapClick}
          newReportLocation={newReportLocation}
          endReportLocation={endReportLocation}
          isRouteMode={isRouteMode}
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

        {/* Floating Scroll to Top Button - Mobile Only */}
        {showScrollButton && (
          <button
            onClick={scrollToTop}
            className="md:hidden fixed bottom-4 right-4 z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Scroll to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </main>
      </div>
    </div>
  );
};

export default HomePage;
