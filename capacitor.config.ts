import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.thechefpantry.app',
  appName: 'Chef Pantry',
  webDir: 'dist',
  server: { url: 'https://thechefpantry.co', cleartext: false },
  ios: { contentInset: 'always' },
  android: { allowMixedContent: false }
};

export default config;