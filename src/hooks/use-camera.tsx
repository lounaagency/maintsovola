
import { useState, useCallback } from 'react';
import { cameraService } from '@/services/CameraService';
import { supabase } from '@/integrations/supabase/client';
import { Toast } from '@capacitor/toast';
import { v4 as uuidv4 } from 'uuid';

export function useCamera(bucketName: string = 'photos') {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const takePhoto = useCallback(async () => {
    const photoBase64 = await cameraService.takePhoto();
    if (photoBase64) {
      return photoBase64;
    }
    return null;
  }, []);

  const selectPhoto = useCallback(async () => {
    const photoBase64 = await cameraService.selectPhoto();
    if (photoBase64) {
      return photoBase64;
    }
    return null;
  }, []);

  const uploadPhoto = useCallback(async (photoBase64: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Extract the base64 data
      const base64Data = photoBase64.split(',')[1];
      
      // Decode base64 string to a Uint8Array
      const byteCharacters = atob(base64Data);
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
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      const fileName = `${uuidv4()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob);
      
      if (error) {
        console.error('Error uploading photo:', error);
        await Toast.show({
          text: 'Failed to upload photo',
          duration: 'long',
          position: 'bottom'
        });
        return null;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      await Toast.show({
        text: 'Failed to upload photo',
        duration: 'long',
        position: 'bottom'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [bucketName]);

  const takeAndUploadPhoto = useCallback(async (): Promise<string | null> => {
    const photo = await takePhoto();
    if (photo) {
      return await uploadPhoto(photo);
    }
    return null;
  }, [takePhoto, uploadPhoto]);

  const selectAndUploadPhoto = useCallback(async (): Promise<string | null> => {
    const photo = await selectPhoto();
    if (photo) {
      return await uploadPhoto(photo);
    }
    return null;
  }, [selectPhoto, uploadPhoto]);

  return {
    takePhoto,
    selectPhoto,
    uploadPhoto,
    takeAndUploadPhoto,
    selectAndUploadPhoto,
    isUploading
  };
}
