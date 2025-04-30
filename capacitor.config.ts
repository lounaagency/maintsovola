
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maintsovola.myapp',
  appName: 'Maintsovola',
  webDir: 'build',
  // Add server configuration for hot reload during development
  server: {
    url: "https://gtqpgewedhbprmebghhr.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  // Android specific configuration
  android: {
    backgroundColor: "#ffffff",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  // iOS specific configuration
  ios: {
    contentInset: "always",
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#4CAF50",
      androidSplashResourceName: "splash"
    }
  }
};

export default config;
