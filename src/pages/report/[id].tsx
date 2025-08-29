// src/pages/report/[id].tsx

import { GetServerSideProps, NextPage } from 'next';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { ReportWithScore } from '../../hooks/useRealtimeReports';
import VoteButtons from '../../components/VoteButtons';
import Link from 'next/link';

// Komponen Peta di-load secara dinamis
const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false 
});

interface ReportDetailPageProps {
  report: ReportWithScore | null;
  error?: string;
}

const ReportDetailPage: NextPage<ReportDetailPageProps> = ({ report, error }) => {
  if (error) {
    return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-center mt-10">Laporan tidak ditemukan.</div>;
  }

  const mapCenter: [number, number] = [report.lat, report.lng];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link 
        href={`/?lat=${report.lat}&lng=${report.lng}&zoom=16`} 
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Kembali ke Peta Utama
      </Link>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {report.photo_url && (
          <img src={report.photo_url} alt={`Foto laporan ${report.category}`} className="w-full h-64 object-cover" />
        )}
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-semibold bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                {report.category.toUpperCase()}
              </span>
              <h1 className="text-3xl font-bold mt-2">{report.description}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Dilaporkan pada {new Date(report.created_at).toLocaleString('id-ID')}
              </p>
            </div>
            <VoteButtons reportId={report.report_id} initialScore={report.score} />
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Lokasi Laporan</h2>
            <div className="h-64 w-full rounded-lg overflow-hidden border">
              <Map reports={[{...report, id: report.report_id}]} center={mapCenter} zoom={16} />
            </div>
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
