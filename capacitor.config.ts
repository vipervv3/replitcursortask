import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aiprojecthub.app',
  appName: 'AI ProjectHub',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://replitaiproject-production.up.railway.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      showSpinner: false,
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: "DEFAULT"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
