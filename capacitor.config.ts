import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maintsovola.app',
  appName: 'Maintso vola',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'gtqpgewedhbprmebghhr.supabase.co',
      '*.supabase.co'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
