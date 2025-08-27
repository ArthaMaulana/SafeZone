// src/hooks/useGeoPermission.ts

import { useState, useEffect } from 'react';

type GeolocationState = {
  isLoading: boolean;
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
};

export function useGeoPermission() {
  const [state, setState] = useState<GeolocationState>({
    isLoading: true,
    position: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, isLoading: false, error: new GeolocationPositionError() }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        isLoading: false,
        position,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        isLoading: false,
        position: null,
        error,
      });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}
