const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add sqlite database extension to asset extensions
if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}

// Redirect expo-sqlite on web to web mock so Metro web bundler never fails on Web Worker chunks
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: path.resolve(__dirname, 'src/database/expoSqliteWebMock.js'),
      type: 'sourceFile',
    };
  }
  if (
    moduleName.includes('expo-sqlite/web/worker') ||
    moduleName.endsWith('web/worker.ts') ||
    moduleName.endsWith('web/worker')
  ) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
