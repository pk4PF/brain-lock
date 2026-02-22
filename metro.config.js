const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tamagui V2 + Expo SDK 54 fix: ensure Metro resolves .native.js over .mjs
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'tamagui' ||
    moduleName.startsWith('tamagui/') ||
    moduleName.startsWith('@tamagui/')
  ) {
    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: ['react-native', 'require', 'default'],
      },
      moduleName,
      platform
    );
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
