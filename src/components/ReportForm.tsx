// src/components/ReportForm.tsx

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getOptimalRoute } from '../lib/routingService';
import AuthModal from './AuthModal';
import SuccessModal from './SuccessModal';

const reportCategories = ['crime', 'road', 'flood', 'lamp', 'accident', 'other'];

interface ReportFormProps {
  onSuccess: () => void;
  initialLocation: { lat: number; lng: number } | null;
  endLocation?: { lat: number; lng: number } | null;
  isRouteMode?: boolean;
  onLocationChange: (coords: { lat: number; lng: number } | null) => void;
  onEndLocationChange?: (coords: { lat: number; lng: number } | null) => void;
  onRouteModeChange?: (isRoute: boolean) => void;
}

const ReportForm = ({ 
  onSuccess, 
  initialLocation, 
  endLocation: propEndLocation, 
  isRouteMode: propIsRouteMode = false,
  onLocationChange, 
  onEndLocationChange,
  onRouteModeChange 
}: ReportFormProps) => {
  const [category, setCategory] = useState(reportCategories[0]);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState(initialLocation);
  const [endLocation, setEndLocation] = useState<{ lat: number; lng: number } | null>(propEndLocation || null);
  const [isRouteMode, setIsRouteMode] = useState(propIsRouteMode);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync state with props from parent
  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    setEndLocation(propEndLocation || null);
  }, [propEndLocation]);

  useEffect(() => {
    setIsRouteMode(propIsRouteMode);
  }, [propIsRouteMode]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Deskripsi tidak boleh kosong.');
      return;
    }
    if (!location) {
      setError('Lokasi laporan harus ditentukan. Silakan klik pada peta untuk menandai lokasi.');
      return;
    }

    if (isRouteMode && !endLocation) {
      setError('Dalam mode rute, titik akhir harus ditentukan. Silakan klik pada peta untuk menandai titik akhir.');
      return;
    }

    setIsLoading(true);

    try {
      // Bypass auth completely for testing - create anonymous report
      const anonymousUserId = 'anonymous-' + Date.now();
      console.log('Creating anonymous report for testing');

      // Skip photo upload and profile creation for now
      const reportData = {
        user_id: null, // Allow null user_id for anonymous reports
        category,
        description,
        lat: location.lat,
        lng: location.lng,
        end_lat: endLocation?.lat || null,
        end_lng: endLocation?.lng || null,
        photo_url: null,
      };

      console.log('Inserting report data:', reportData);
      
      // Try insert with service role bypass
      const { data, error: insertError } = await supabase
        .from('reports')
        .insert(reportData)
        .select();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log('Report inserted successfully:', data);
      
      // Reset form
      setDescription('');
      setPhoto(null);
      setCategory(reportCategories[0]);
      setEndLocation(null);
      setIsRouteMode(false);
      onLocationChange(null);
      
      // Show success modal
      setShowSuccessModal(true);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {reportCategories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Description Textarea */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Jelaskan detail kejadian..."
        />
      </div>

      {/* Route Mode Toggle */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isRouteMode}
            onChange={(e) => {
              const newRouteMode = e.target.checked;
              setIsRouteMode(newRouteMode);
              onRouteModeChange?.(newRouteMode);
              if (!newRouteMode) {
                setEndLocation(null);
                onEndLocationChange?.(null);
              }
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Laporan berbasis rute (dari titik awal ke titik akhir)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Aktifkan untuk melaporkan masalah yang terjadi sepanjang jalur tertentu (misal: jalan rusak, banjir area)
        </p>
      </div>

      {/* Location Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isRouteMode ? 'Titik Awal' : 'Lokasi Laporan'}
        </label>
        <div className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm">
          <svg className={`-ml-1 mr-2 h-5 w-5 ${location ? 'text-green-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          <span className="text-gray-700">
            {location ? `${isRouteMode ? 'Titik Awal' : 'Lokasi'}: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Klik pada peta untuk menandai lokasi'}
          </span>
        </div>
      </div>

      {/* End Location Info (only shown in route mode) */}
      {isRouteMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titik Akhir</label>
          <div className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm">
            <svg className={`-ml-1 mr-2 h-5 w-5 ${endLocation ? 'text-green-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            <span className="text-gray-700">
              {endLocation ? `Titik Akhir: ${endLocation.lat.toFixed(4)}, ${endLocation.lng.toFixed(4)}` : 'Klik pada peta untuk menandai titik akhir'}
            </span>
          </div>
          {isRouteMode && !endLocation && (
            <p className="text-xs text-red-500 mt-1">
              Dalam mode rute, Anda perlu menandai titik akhir setelah menandai titik awal
            </p>
          )}
        </div>
      )}

      {/* Photo Upload */}
      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">Foto (Opsional)</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="photo" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <span>Unggah file</span>
                <input id="photo" name="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)} className="sr-only" />
              </label>
              <p className="pl-1">atau seret dan lepas</p>
            </div>
            <p className="text-xs text-gray-500">{photo ? photo.name : 'PNG, JPG, GIF hingga 10MB'}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? 'Mengirim Laporan...' : 'Kirim Laporan'}
      </button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setIsAuthenticating(false);
        }}
        onSuccess={() => {
          console.log('Auth success, closing modal and retrying submit');
          setShowAuthModal(false);
          setIsAuthenticating(false);
          
          // Auto-retry submit setelah auth berhasil
          setTimeout(async () => {
            console.log('Auto-retrying submit after auth success');
            const fakeEvent = { preventDefault: () => {} } as FormEvent;
            await handleSubmit(fakeEvent);
          }, 1500); // Increase delay to 1.5 seconds
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onSuccess();
        }}
        title="Laporan Berhasil Dikirim! 🎉"
        message="Terima kasih telah berkontribusi untuk keamanan lingkungan. Laporan Anda akan membantu warga lain mengetahui kondisi terkini di area tersebut."
        actionText="Lihat di Peta"
        onAction={() => {
          setShowSuccessModal(false);
          onSuccess();
        }}
      />
    </form>
  );
};

export default ReportForm;
