import type { CapacitorConfig } from '@capacitor/cli';

// Android app wrapper. The web build (npm run build -> dist) is copied in by `npx cap sync android`.
const config: CapacitorConfig = {
  appId: 'com.olearn.app',
  appName: 'OLearn',
  webDir: 'dist',
  // Same cream as the app, so there is no white flash between the native splash and the startup screen
  backgroundColor: '#F6F1EA',
  android: {
    // Keep the app between the status bar and the navigation bar on every Android version
    adjustMarginsForEdgeToEdge: 'force'
  }
};

export default config;
