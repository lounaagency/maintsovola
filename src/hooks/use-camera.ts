
import { useState } from 'react';
import { cameraService } from '@/services/CameraService';

export interface Photo {
  webPath?: string;
  saved: boolean;
}

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async (): Promise<Photo | null> => {
    try {
      setIsCapturing(true);
      const photo = await cameraService.takePicture();
      return photo;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async (multiple = true): Promise<Photo[]> => {
    try {
      setIsCapturing(true);
      const photos = await cameraService.selectFromGallery(multiple);
      // Convert GalleryPhotos to Photos by adding the saved property
      return photos.map(photo => ({ ...photo, saved: false }));
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      return [];
    } finally {
      setIsCapturing(false);
    }
  };

  return {
    isCapturing,
    takePicture,
    selectFromGallery,
    getPhotoUrl: cameraService.getPhotoUrl,
    convertBlobToBase64: cameraService.convertBlobToBase64,
  };
}
