
import { Geolocation, Position, GeolocationPosition } from '@capacitor/geolocation';

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
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
    } catch (error) {
      console.error('Error getting current position:', error);
      throw new Error('Unable to get current position');
    }
  }

  async watchPosition(callback: (position: Position) => void) {
    try {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position) => {
          if (position) {
            callback(position);
          }
        }
      );
      
      return {
        clear: () => Geolocation.clearWatch({ id: watchId }),
      };
    } catch (error) {
      console.error('Error watching position:', error);
      throw new Error('Unable to watch position');
    }
  }

  async checkPermissions() {
    return await Geolocation.checkPermissions();
  }

  async requestPermissions() {
    return await Geolocation.requestPermissions();
  }
}

export const geolocationService = GeolocationService.getInstance();
