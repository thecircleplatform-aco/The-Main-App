import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.circle.app',
  appName: 'Circle',
  webDir: 'out',
  server: {
    // Set CAPACITOR_SERVER_URL: your deployed URL or http://10.0.2.2:3000 for dev
    url: process.env.CAPACITOR_SERVER_URL || "https://www.thecircleplatform.org",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
  // When android/ and ios/ are moved to mobile/android and mobile/ios, add:
  // android: { path: "mobile/android", allowMixedContent: true },
  // ios: { path: "mobile/ios" },
};

export default config;
