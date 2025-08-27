// src/hooks/useRealtimeReports.ts

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// Definisikan tipe data yang lebih lengkap sesuai dengan view `report_summary`
export interface ReportWithScore {
  report_id: number;
  description: string;
  category: string;
  status: string;
  created_at: string;
  lat: number; // Perlu join untuk mendapatkan ini
  lng: number; // Perlu join untuk mendapatkan ini
  upvotes: number;
  downvotes: number;
  score: number;
}

export function useRealtimeReports() {
  const [reports, setReports] = useState<ReportWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchInitialReports = async () => {
      setIsLoading(true);
      // Ambil data awal dari view `report_summary` dan join dengan `reports` untuk lat/lng
      const { data, error } = await supabase
        .from('report_summary')
        .select(`
          report_id,
          description,
          category,
          status,
          created_at,
          upvotes,
          downvotes,
          score,
          reports (lat, lng)
        `);

      if (error) {
        setError(error.message);
        setReports([]);
      } else {
        // Transform data untuk meratakan struktur
        const transformedData = data.map((r: any) => ({
          ...r,
          lat: r.reports.lat,
          lng: r.reports.lng,
          reports: undefined, // Hapus properti bersarang
        }));
        setReports(transformedData);
      }
      setIsLoading(false);
    };

    const setupRealtime = () => {
      channel = supabase
        .channel('public:reports_and_votes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          () => fetchInitialReports() // Cara paling sederhana: fetch ulang semua data jika ada perubahan
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'votes' },
          () => fetchInitialReports() // Bisa dioptimalkan untuk hanya fetch ulang report yang relevan
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to realtime channel!');
          }
          if (err) {
            console.error('Realtime subscription error:', err);
            setError('Gagal terhubung ke pembaruan langsung.');
          }
        });
    };

    fetchInitialReports();
    setupRealtime();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { reports, isLoading, error };
}
