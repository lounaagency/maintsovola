
import { Geolocation, Position, GeolocationOptions } from '@capacitor/geolocation';
import { Toast } from '@capacitor/toast';

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Get the current position of the device
   */
  public async getCurrentPosition(options?: GeolocationOptions): Promise<Position | null> {
    try {
      // Request permission first
      const permissionStatus = await Geolocation.requestPermissions();
      
      if (!permissionStatus || permissionStatus.location !== 'granted') {
        await Toast.show({
          text: 'Location permission is required to get position',
          duration: 'long',
          position: 'bottom'
        });
        return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        ...options
      });

      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      await Toast.show({
        text: 'Failed to get current location',
        duration: 'long',
        position: 'bottom'
      });
      return null;
    }
  }

  /**
   * Watch the position of the device
   */
  public watchPosition(callback: (position: Position | null, error?: any) => void, options?: GeolocationOptions) {
    Geolocation.requestPermissions()
      .then(permissionStatus => {
        if (!permissionStatus || permissionStatus.location !== 'granted') {
          Toast.show({
            text: 'Location permission is required to watch position',
            duration: 'long',
            position: 'bottom'
          });
          callback(null, new Error('Location permission denied'));
          return { remove: () => {} };
        }

        const watchId = Geolocation.watchPosition({
          enableHighAccuracy: true,
          ...options
        }, (position, error) => {
          if (error) {
            callback(null, error);
          } else {
            callback(position);
          }
        });

        return { 
          remove: async () => {
            Geolocation.clearWatch({ id: watchId });
          }
        };
      })
      .catch(error => {
        console.error('Error starting position watch:', error);
        callback(null, error);
        return { remove: () => {} };
      });
  }

  /**
   * Convert coordinates to a location string
   */
  public formatCoordinates(latitude: number, longitude: number): string {
    const lat = Math.abs(latitude).toFixed(6) + (latitude >= 0 ? '°N' : '°S');
    const lng = Math.abs(longitude).toFixed(6) + (longitude >= 0 ? '°E' : '°W');
    return `${lat}, ${lng}`;
  }
}

export const geolocationService = GeolocationService.getInstance();
