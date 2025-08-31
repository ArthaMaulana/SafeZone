// src/pages/report/[id].tsx

import { GetServerSideProps, NextPage } from 'next';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { ReportWithScore } from '../../hooks/useRealtimeReports';
import VoteButtons from '../../components/VoteButtons';
import Link from 'next/link';
import { useState } from 'react';

// Komponen Peta di-load secara dinamis
const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false 
});

interface ReportDetailPageProps {
  report: ReportWithScore | null;
  error?: string;
}

const ReportDetailPage: NextPage<ReportDetailPageProps> = ({ report, error }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Laporan Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">Laporan yang Anda cari tidak dapat ditemukan atau telah dihapus.</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = [report.lat, report.lng];

  const getCategoryColor = (category: string) => {
    const colors = {
      'CRIME': 'bg-red-500 text-white',
      'ROAD': 'bg-orange-500 text-white',
      'FLOOD': 'bg-blue-500 text-white',
      'LAMP': 'bg-yellow-500 text-white',
      'ACCIDENT': 'bg-purple-500 text-white',
      'DISASTER': 'bg-red-600 text-white',
      'OTHER': 'bg-gray-500 text-white'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'CRIME': '🚨',
      'ROAD': '🚧',
      'FLOOD': '🌊',
      'LAMP': '💡',
      'ACCIDENT': '⚠️',
      'DISASTER': '🔥',
      'OTHER': '📍'
    };
    return icons[category as keyof typeof icons] || '📍';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'verified': 'bg-blue-100 text-blue-800 border-blue-200',
      'resolved': 'bg-gray-100 text-gray-800 border-gray-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'pending_review': 'Menunggu Review',
      'approved': 'Disetujui',
      'verified': 'Terverifikasi',
      'resolved': 'Selesai',
      'rejected': 'Ditolak'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href={`/?lat=${report.lat}&lng=${report.lng}&zoom=16`} 
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 border border-white/20"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Peta Utama
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden border border-white/20">

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getCategoryColor(report.category)}`}>
                    <span className="mr-2">{getCategoryIcon(report.category)}</span>
                    {report.category.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{report.description}</h1>
                <div className="flex items-center text-gray-600 space-x-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      {new Date(report.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Vote Buttons */}
              <div className="lg:ml-6">
                <VoteButtons reportId={report.report_id} initialScore={report.score} />
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Lokasi Laporan</h2>
              </div>
              <div className="h-72 w-full rounded-xl overflow-hidden border-2 border-white shadow-lg">
                <Map reports={[{...report, id: report.report_id}]} center={mapCenter} zoom={16} />
              </div>
              <div className="mt-4 text-sm text-gray-600 bg-white/60 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  <span>Koordinat: {report.lat.toFixed(6)}, {report.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Photo Section - Moved to bottom */}
            {report.photo_url && (
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Foto Laporan</h2>
                </div>
                <div className="max-w-sm mx-auto">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-gray-200 to-gray-300">
                    <img 
                      src={report.photo_url} 
                      alt={`Foto laporan ${report.category}`} 
                      className={`w-full aspect-square object-cover transition-opacity duration-500 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  // Fetch data langsung dari table reports karena report_summary mungkin tidak ada
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching report:', error?.message);
    return { props: { report: null, error: error?.message || 'Laporan tidak ditemukan.' } };
  }

  // Transform data untuk compatibility dengan ReportWithScore interface
  const reportData = {
    report_id: data.id,
    description: data.description,
    category: data.category,
    status: data.status,
    created_at: data.created_at,
    lat: data.lat,
    lng: data.lng,
    end_lat: data.end_lat,
    end_lng: data.end_lng,
    photo_url: data.photo_url,
    upvotes: 0,
    downvotes: 0,
    score: 0,
  };

  return {
    props: {
      report: reportData,
    },
  };
};

export default ReportDetailPage;
