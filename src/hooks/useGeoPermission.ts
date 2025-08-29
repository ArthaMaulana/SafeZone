// src/hooks/useGeoPermission.ts

import { useState, useEffect } from 'react';

// Fungsi untuk menerjemahkan kode error menjadi pesan yang lebih ramah
const getFriendlyErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda untuk menggunakan fitur ini.';
    case error.POSITION_UNAVAILABLE:
      return 'Informasi lokasi tidak tersedia saat ini. Coba lagi nanti.';
    case error.TIMEOUT:
      return 'Gagal mendapatkan lokasi dalam waktu yang ditentukan. Periksa koneksi internet Anda.';
    default:
      return 'Terjadi kesalahan saat mencoba mendapatkan lokasi Anda.';
  }
};

export function useGeoPermission() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda.');
      setIsLoading(false);
      return;
    }

    // Minta lokasi sekali saat komponen dimuat
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(getFriendlyErrorMessage(err));
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Waktu tunggu lebih lama
    );

  }, []);

  return { position, isLoading, error };
}
