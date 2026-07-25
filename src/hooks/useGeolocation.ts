import { useState } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
  });

  const getLocation = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState({
        lat: null,
        lng: null,
        error: 'A geolocalização não é suportada neste navegador.',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          lat: null,
          lng: null,
          error: error.message || 'Não foi possível obter a localização.',
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return { ...state, getLocation };
}
