import 'dotenv/config';

export default {
  expo: {
    name: "chess-vision",
    slug: "chess-vision",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Chess Vision needs camera access to detect chess pieces"
      },
      bundleIdentifier: "com.rcidaleassumpcao.chessvision"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      permissions: ["android.permission.CAMERA"],
      package: "com.rcidaleassumpcao.chessvision"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: "Chess Vision needs camera access to detect chess pieces",
          enableFrameProcessors: true
        }
      ]
    ],
    extra: {
      xaiApiKey: process.env.XAI_API_KEY,
      zaiApiKey: process.env.ZAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  },
};
