// src/pages/settings.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useGeoPermission } from '../hooks/useGeoPermission';
import Link from 'next/link';

const SettingsPage = () => {
  const [radius, setRadius] = useState(1000); // Default radius 1km
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { position, error: geoError } = useGeoPermission();

  // Ambil data langganan yang ada saat komponen dimuat
  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, radius_m')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setRadius(data.radius_m);
        setSubscriptionId(data.id);
      }
    };

    fetchSubscription();
  }, []);

  const handleSave = async () => {
    setMessage(null);
    if (!position) {
      setMessage({ type: 'error', text: 'Tidak dapat menyimpan, lokasi Anda tidak ditemukan.' });
      return;
    }

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: 'error', text: 'Anda harus login untuk menyimpan pengaturan.' });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('subscriptions').upsert({
        id: subscriptionId, // null jika baru, akan di-handle oleh upsert
        user_id: user.id,
        center_lat: position.coords.latitude,
        center_lng: position.coords.longitude,
        radius_m: radius,
      }, {
        onConflict: 'user_id' // Asumsi pengguna hanya punya 1 langganan
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Kembali ke Peta Utama
      </Link>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Pengaturan Notifikasi</h1>
        <p className="text-gray-600 mb-6">
          Atur radius notifikasi dari lokasi Anda saat ini. Anda akan menerima pemberitahuan jika ada laporan baru di dalam area ini.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
              Radius Notifikasi (dalam meter)
            </label>
            <input
              id="radius"
              type="range"
              min="100"
              max="5000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center font-medium mt-2">{radius} meter</div>
          </div>

          <div>
            <h3 className="font-semibold">Pusat Area Notifikasi</h3>
            {position ? (
              <p className="text-sm text-gray-700">
                Lat: {position.coords.latitude.toFixed(5)}, Lng: {position.coords.longitude.toFixed(5)}
              </p>
            ) : (
              <p className="text-sm text-yellow-600">
                {geoError ? geoError : 'Mencari lokasi Anda...'}
              </p>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isLoading || !position}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
