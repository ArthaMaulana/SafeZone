// src/components/ReportForm.tsx

import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

const reportCategories = ['crime', 'road', 'flood', 'lamp', 'accident', 'other'];

interface ReportFormProps {
  onSuccess: () => void; // Callback to close modal or refresh list
}

const ReportForm = ({ onSuccess }: ReportFormProps) => {
  const [category, setCategory] = useState(reportCategories[0]);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setError(`Gagal mendapatkan lokasi: ${err.message}`);
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Deskripsi tidak boleh kosong.');
      return;
    }
    if (!location) {
      setError('Lokasi GPS harus ditentukan.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda harus login untuk membuat laporan.');

      let photoUrl: string | null = null;

      // 1. Upload foto jika ada
      if (photo) {
        const filePath = `reports/${user.id}/${Date.now()}_${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('reports') // Nama bucket
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(filePath);
        photoUrl = publicUrl;
      }

      // 2. Simpan data laporan ke tabel 'reports'
      const { error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        category,
        description,
        lat: location.lat,
        lng: location.lng,
        photo_url: photoUrl,
      });

      if (insertError) throw insertError;

      alert('Laporan berhasil dibuat!');
      onSuccess(); // Panggil callback sukses

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {reportCategories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Jelaskan kejadian atau kondisi..."
        />
      </div>

      <div>
        <button type="button" onClick={handleGetLocation} className="text-sm text-blue-600 hover:underline">
          {location ? `Lokasi Ditemukan: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Dapatkan Lokasi Saat Ini'}
        </button>
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Foto (Opsional)</label>
        <input
          type="file"
          id="photo"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Mengirim...' : 'Kirim Laporan'}
      </button>
    </form>
  );
};

export default ReportForm;
