module.exports = {
  expo: {
    name: "Chronicles",
    slug: "chronicles",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "chronicles",
    platforms: [
      "ios",
      "android"
    ],
    experiments: {
      reactCompiler: true,
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0D0D1A"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.leopicado.chronicles"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0D0D1A"
      },
      package: "com.leopicado.chronicles",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY
        }
      }
    },
    plugins: [
      "expo-router",
      "expo-sqlite"
    ],
    extra: {
      setlistfmApiKey: process.env.SETLISTFM_API_KEY,
      setlistfmTestUsername: process.env.SETLISTFM_TEST_USERNAME,
      googleMapsAndroidApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY
    }
  }
};
