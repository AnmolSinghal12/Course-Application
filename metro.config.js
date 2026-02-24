const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path alias support
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(__dirname, '.'),
  },
  sourceExts: [...(config.resolver.sourceExts || []), 'mjs', 'cjs'],
};

module.exports = withNativeWind(config, { input: './global.css' });
