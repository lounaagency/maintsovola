
import { useState, useEffect } from 'react';
import { geolocationService } from '@/services/GeolocationService';
import type { Position } from '@capacitor/geolocation';

export function useGeolocation(watchPosition = false) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      setError(null);
      const pos = await geolocationService.getCurrentPosition();
      setPosition(pos);
      return pos;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (watchPosition) {
      setLoading(true);
      let watcher: { clear: () => void } | null = null;

      const setupWatcher = async () => {
        try {
          watcher = await geolocationService.watchPosition((pos) => {
            setPosition(pos);
            setLoading(false);
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      };

      setupWatcher();

      return () => {
        if (watcher) {
          watcher.clear();
        }
      };
    } else {
      getCurrentPosition();
    }
  }, [watchPosition]);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    checkPermissions: geolocationService.checkPermissions,
    requestPermissions: geolocationService.requestPermissions,
  };
}
