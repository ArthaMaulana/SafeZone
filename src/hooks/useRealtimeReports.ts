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
  end_lat?: number; // Koordinat akhir untuk laporan berbasis rute
  end_lng?: number; // Koordinat akhir untuk laporan berbasis rute
  photo_url?: string | null; // Add photo_url property
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
      // Panggil fungsi RPC untuk mendapatkan data yang sudah digabungkan
      const { data, error } = await supabase.rpc('get_all_reports_with_scores');

      if (error) {
        setError(error.message);
        setReports([]);
      } else {
        // Data dari RPC sudah memiliki format yang benar, tidak perlu transformasi
        // Cukup pastikan nilai null diganti dengan default 0
        const cleanData = data.map(r => ({
          ...r,
          upvotes: r.upvotes ?? 0,
          downvotes: r.downvotes ?? 0,
          score: r.score ?? 0,
        }));
        console.log('Raw data from database:', data);
        console.log('Cleaned data:', cleanData);
        console.log('Setting reports state with', cleanData.length, 'reports');
        setReports(cleanData);

      }
      setIsLoading(false);
    };

    const setupRealtime = () => {
      channel = supabase
        .channel('public:reports_and_votes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          (payload) => {
            console.log('Reports table changed:', payload);
            fetchInitialReports(); // Cara paling sederhana: fetch ulang semua data jika ada perubahan
          }
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
