
import { useState, useEffect } from 'react';
import { geolocationService } from '@/services/GeolocationService';

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      setError(null);
      const position = await geolocationService.getCurrentPosition();
      setPosition(position);
      return position;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to get current position');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const watchPosition = async (callback: (position: GeolocationPosition) => void) => {
    try {
      const watcher = await geolocationService.watchPosition(callback);
      return watcher;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to watch position');
      return { clear: () => {} };
    }
  };

  const checkPermissions = async () => {
    return await geolocationService.checkPermissions();
  };

  const requestPermissions = async () => {
    return await geolocationService.requestPermissions();
  };

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    checkPermissions,
    requestPermissions
  };
}

// Define types for better TypeScript support
export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number;
}
