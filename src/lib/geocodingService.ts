// src/lib/geocodingService.ts
// Service untuk reverse geocoding - mengubah koordinat menjadi nama jalan

export interface AddressInfo {
  streetName: string;
  fullAddress: string;
  city: string;
  district?: string;
}

// Cache untuk menyimpan hasil geocoding agar tidak perlu request berulang
const geocodingCache = new Map<string, AddressInfo>();

// Fungsi untuk membuat cache key dari koordinat
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// Menggunakan Nominatim (OpenStreetMap) untuk reverse geocoding - gratis dan tidak perlu API key
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<AddressInfo | null> {
  const cacheKey = getCacheKey(lat, lng);
  
  // Cek cache terlebih dahulu
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeZone-App/1.0'
      }
    });

    if (!response.ok) {
      console.warn('Nominatim geocoding failed');
      return null;
    }

    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      
      // Ekstrak informasi jalan dengan prioritas
      const streetName = 
        address.road || 
        address.pedestrian || 
        address.footway || 
        address.path || 
        address.residential ||
        address.suburb ||
        address.neighbourhood ||
        'Jalan tidak dikenal';

      const addressInfo: AddressInfo = {
        streetName: streetName,
        fullAddress: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: address.city || address.town || address.village || 'Jakarta',
        district: address.suburb || address.neighbourhood || address.quarter
      };

      // Simpan ke cache
      geocodingCache.set(cacheKey, addressInfo);
      return addressInfo;
    }
    
    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
}

// Alternative menggunakan MapBox Geocoding API (memerlukan API key)
export async function getAddressFromCoordinatesMapbox(lat: number, lng: number, apiKey: string): Promise<AddressInfo | null> {
  const cacheKey = getCacheKey(lat, lng);
  
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${apiKey}&types=address,poi`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const context = feature.context || [];
      
      const streetName = feature.text || 'Jalan tidak dikenal';
      const city = context.find((c: any) => c.id.includes('place'))?.text || 'Jakarta';
      const district = context.find((c: any) => c.id.includes('neighborhood'))?.text;

      const addressInfo: AddressInfo = {
        streetName: streetName,
        fullAddress: feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: city,
        district: district
      };

      geocodingCache.set(cacheKey, addressInfo);
      return addressInfo;
    }
    
    return null;
  } catch (error) {
    console.error('Error in MapBox geocoding:', error);
    return null;
  }
}

// Fungsi utama yang mencoba beberapa service
export async function getAddressInfo(lat: number, lng: number): Promise<AddressInfo> {
  // Coba Nominatim dulu (gratis)
  let addressInfo = await getAddressFromCoordinates(lat, lng);
  
  // Jika gagal, fallback ke koordinat
  if (!addressInfo) {
    addressInfo = {
      streetName: `Lokasi ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: 'Jakarta',
      district: undefined
    };
  }
  
  return addressInfo;
}
