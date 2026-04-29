module.exports = {
  expo: {
    name: "Setlist.fm Tracker",
    slug: "setlist-fm-tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "setlist-fm-tracker",
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
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.setlistfm.tracker"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.setlistfm.tracker",
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
