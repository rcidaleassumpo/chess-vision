const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add tflite to asset extensions for ML model support
config.resolver.assetExts.push('tflite');

module.exports = config;
