import { Capacitor } from '@capacitor/core';

let Camera: any = null;
let CameraResultType: any = null;
let CameraSource: any = null;

if (Capacitor.isNativePlatform()) {
  const cameraModule = require('@capacitor/camera');
  Camera = cameraModule.Camera;
  CameraResultType = cameraModule.CameraResultType;
  CameraSource = cameraModule.CameraSource;
}

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
    if (!Camera) return { camera: 'denied' };
    return await Camera.checkPermissions();
  }

  async requestPermissions() {
    if (!Camera) return { camera: 'denied' };
    return await Camera.requestPermissions();
  }

  async takePicture() {
    if (!Camera || !CameraResultType || !CameraSource) {
      console.warn("Camera plugin not available in web environment.");
      throw new Error("Camera not available in web.");
    }

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
    if (!Camera) {
      console.warn("Camera plugin not available in web environment.");
      throw new Error("Gallery access not available in web.");
    }

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

  async getPhotoUrl(photo: any): Promise<string> {
    return photo?.webPath || '';
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
