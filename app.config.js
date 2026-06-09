module.exports = {
  expo: {
    name: 'Brainlock',
    slug: 'brain-lock',
    version: '1.4.5',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'brainlock',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F2660E',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pk4pf.brain-lock',
      buildNumber: '203',
      deploymentTarget: '16.0',
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': ['group.com.pk4pf.brain-lock'],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FBF5EC',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.pk4pf.brainlock',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#F2660E',
        },
      ],
      './plugins/withScreenTimeExtensions',
    ],
    extra: {
      router: {},
      eas: {
        projectId: '31dff2f4-7930-4d3f-8fd9-55d8410bd215',
      },
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
    },
  },
};
