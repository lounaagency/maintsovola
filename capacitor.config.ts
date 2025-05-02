
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maintsovola.app',
  appName: 'Maintsovola',
  webDir: 'build',
  server: {
    url: 'https://6acfbd31-7c6a-4cb2-8ad5-1ccd0835ad02.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
