
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Toast } from '@capacitor/toast';

export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Take a photo using the device camera
   */
  public async takePhoto(): Promise<string | null> {
    try {
      // Request permission first
      const permissionStatus = await Camera.requestPermissions();
      
      if (!permissionStatus.camera || permissionStatus.camera !== 'granted') {
        await Toast.show({
          text: 'Camera permission is required to take photos',
          duration: 'long',
          position: 'bottom'
        });
        return null;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        correctOrientation: true
      });

      if (!photo || !photo.base64String) {
        return null;
      }

      return `data:image/jpeg;base64,${photo.base64String}`;
    } catch (error) {
      console.error('Error taking photo:', error);
      await Toast.show({
        text: 'Failed to take photo',
        duration: 'long',
        position: 'bottom'
      });
      return null;
    }
  }

  /**
   * Select a photo from the device gallery
   */
  public async selectPhoto(): Promise<string | null> {
    try {
      // Request permission first
      const permissionStatus = await Camera.requestPermissions();
      
      if (!permissionStatus.photos || permissionStatus.photos !== 'granted') {
        await Toast.show({
          text: 'Photos permission is required to select images',
          duration: 'long',
          position: 'bottom'
        });
        return null;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024,
        correctOrientation: true
      });

      if (!photo || !photo.base64String) {
        return null;
      }

      return `data:image/jpeg;base64,${photo.base64String}`;
    } catch (error) {
      console.error('Error selecting photo:', error);
      await Toast.show({
        text: 'Failed to select photo',
        duration: 'long',
        position: 'bottom'
      });
      return null;
    }
  }

  /**
   * Convert a base64 string to a Blob
   */
  public base64ToBlob(base64: string, contentType = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
}

export const cameraService = CameraService.getInstance();
