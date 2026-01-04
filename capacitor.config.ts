import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dompetdigital.app',
  appName: 'Dompet Digital',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
