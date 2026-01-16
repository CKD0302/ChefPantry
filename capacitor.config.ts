import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.thechefpantry.app',
  appName: 'Chef Pantry',
  webDir: 'dist/public',
  server: {
    url: 'https://thechefpantry.co',
    cleartext: false,
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F97316',
      showSpinner: false
    }
  }
};

export default config;