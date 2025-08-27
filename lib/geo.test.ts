// lib/geo.test.ts

import { haversineDistance } from './geo';

// Test suite for haversineDistance function
describe('haversineDistance', () => {
  // Test case 1: Jarak antara dua titik yang sama harus 0
  it('should return 0 for the same coordinates', () => {
    const lat = -6.2088;
    const lon = 106.8456;
    expect(haversineDistance(lat, lon, lat, lon)).toBe(0);
  });

  // Test case 2: Jarak antara Jakarta dan Bandung (perkiraan)
  // Jarak sebenarnya sekitar 120-130 km
  it('should calculate the approximate distance between Jakarta and Bandung', () => {
    const jakarta = { lat: -6.2088, lon: 106.8456 };
    const bandung = { lat: -6.9175, lon: 107.6191 };
    const distanceInMeters = haversineDistance(jakarta.lat, jakarta.lon, bandung.lat, bandung.lon);
    const distanceInKm = distanceInMeters / 1000;

    // Harapkan jarak berada dalam rentang yang masuk akal (120km - 150km)
    expect(distanceInKm).toBeGreaterThan(120);
    expect(distanceInKm).toBeLessThan(150);
  });

  // Test case 3: Jarak melintasi ekuator
  it('should handle coordinates across the equator', () => {
    const pointNorth = { lat: 1.0, lon: 0 };
    const pointSouth = { lat: -1.0, lon: 0 };
    const distanceInMeters = haversineDistance(pointNorth.lat, pointNorth.lon, pointSouth.lat, pointSouth.lon);
    const expectedDistance = 2 * 111.32 * 1000; // Sekitar 2 derajat latitude dalam meter

    // Beri toleransi 1%
    expect(distanceInMeters).toBeCloseTo(expectedDistance, -3);
  });
});
