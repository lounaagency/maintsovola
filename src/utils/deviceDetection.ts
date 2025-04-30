
import { Capacitor } from '@capacitor/core';

export const isMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }
  
  return Capacitor.getPlatform() as 'ios' | 'android';
};

export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};
