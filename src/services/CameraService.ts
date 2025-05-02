
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  static getInstance() {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  async checkPermissions() {
    return await Camera.checkPermissions();
  }

  async requestPermissions() {
    return await Camera.requestPermissions();
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      return image;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }

  async selectFromGallery(multiple: boolean = true) {
    try {
      const images = await Camera.pickImages({
        quality: 90,
        limit: multiple ? 10 : 1,
      });
      
      return images.photos;
    } catch (error) {
      console.error('Error selecting images:', error);
      throw error;
    }
  }

  async getPhotoUrl(photo: Photo): Promise<string> {
    return photo.webPath || '';
  }

  async convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }
}

export const cameraService = CameraService.getInstance();
