// src/lib/routingService.ts
// Service untuk mendapatkan rute jalan yang sebenarnya menggunakan OpenRouteService

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResponse {
  coordinates: [number, number][]; // Array of [lng, lat] coordinates
  distance: number; // Distance in meters
  duration: number; // Duration in seconds
}

// Menggunakan OpenRouteService API (gratis, tidak perlu API key untuk penggunaan terbatas)
export async function getRoute(start: RoutePoint, end: RoutePoint): Promise<RouteResponse | null> {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      }
    });

    if (!response.ok) {
      console.warn('OpenRouteService failed, falling back to straight line');
      return null;
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      const coordinates = route.geometry.coordinates;
      const properties = route.properties;
      
      return {
        coordinates: coordinates, // Already in [lng, lat] format
        distance: properties.segments[0].distance,
        duration: properties.segments[0].duration
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

// Alternative: Menggunakan OSRM (Open Source Routing Machine) sebagai fallback
export async function getRouteOSRM(start: RoutePoint, end: RoutePoint): Promise<RouteResponse | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      return {
        coordinates: route.geometry.coordinates, // [lng, lat] format
        distance: route.distance,
        duration: route.duration
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
}

// Fungsi utama yang mencoba beberapa service
export async function getOptimalRoute(start: RoutePoint, end: RoutePoint): Promise<RouteResponse | null> {
  // Coba OpenRouteService dulu
  let route = await getRoute(start, end);
  
  // Jika gagal, coba OSRM
  if (!route) {
    route = await getRouteOSRM(start, end);
  }
  
  return route;
}
