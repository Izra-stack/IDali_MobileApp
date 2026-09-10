const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add sqlite database extension to asset extensions
config.resolver.assetExts.push('db');

module.exports = config;
