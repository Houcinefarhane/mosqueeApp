import type { CapacitorConfig } from "@capacitor/cli";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(__dirname, ".env") });

const serverUrl =
  process.env.MADRASAPP_SERVER_URL?.trim().replace(/\/$/, "") ||
  "https://madrasa-app-pi.vercel.app";

const config: CapacitorConfig = {
  appId: "fr.madrasapp.mobile",
  appName: "MadrasApp",
  webDir: "www",
  server: {
    url: serverUrl,
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    errorPath: "offline.html",
  },
  android: {
    appendUserAgent: " MadrasApp-Mobile",
  },
  ios: {
    appendUserAgent: " MadrasApp-Mobile",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#1E110A",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1E110A",
    },
  },
};

export default config;
