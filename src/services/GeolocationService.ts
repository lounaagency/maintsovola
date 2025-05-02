
import { Capacitor } from '@capacitor/core';

// Define types to match the Capacitor Geolocation plugin
export interface Position {
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

export interface GeolocationPosition extends Position {}

export interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt';
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  static getInstance() {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  async getCurrentPosition(): Promise<GeolocationPosition> {
    try {
      // Check if we're on a native platform
      if (Capacitor.isNativePlatform()) {
        // Dynamic import for native platforms only
        const { Geolocation } = await import('@capacitor/geolocation');
        return await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            position => resolve({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
              },
              timestamp: position.timestamp
            }),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      throw new Error('Unable to get current position');
    }
  }

  async watchPosition(callback: (position: Position) => void) {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000 },
          (position) => {
            if (position) {
              callback(position);
            }
          }
        );
        
        return {
          clear: () => {
            if (Geolocation) {
              Geolocation.clearWatch({ id: watchId });
            }
          },
        };
      } else {
        // Web fallback
        const id = navigator.geolocation.watchPosition(
          position => callback({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          }),
          error => {
            console.error('Error watching position:', error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        
        return {
          clear: () => navigator.geolocation.clearWatch(id),
        };
      }
    } catch (error) {
      console.error('Error watching position:', error);
      throw new Error('Unable to watch position');
    }
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      return await Geolocation.checkPermissions();
    } else {
      // Web fallback - permissions are not exactly the same in the web
      return { location: navigator.permissions ? 'prompt' : 'granted' };
    }
  }

  async requestPermissions(): Promise<PermissionStatus> {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      return await Geolocation.requestPermissions();
    } else {
      // Web fallback
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ location: 'denied' });
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          () => resolve({ location: 'granted' }),
          () => resolve({ location: 'denied' }),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
    }
  }
}

export const geolocationService = GeolocationService.getInstance();
