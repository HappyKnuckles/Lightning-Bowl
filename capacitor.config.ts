import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.bowling',
  appName: 'Lightning Bowl',
  webDir: 'www/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
