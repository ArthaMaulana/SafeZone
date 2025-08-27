// lib/geo.ts

/**
 * Menghitung jarak antara dua titik koordinat geografis menggunakan formula Haversine.
 * @param lat1 Latitude titik pertama.
 * @param lon1 Longitude titik pertama.
 * @param lat2 Latitude titik kedua.
 * @param lon2 Longitude titik kedua.
 * @returns Jarak dalam meter.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // Jarak dalam meter
  return d;
}
