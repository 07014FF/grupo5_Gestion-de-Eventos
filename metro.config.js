const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable remote updates completely
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts,
    // Add any custom asset extensions here
  ],
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Prevent remote update checks
      if (req.url && req.url.includes('/update')) {
        res.statusCode = 404;
        res.end('Updates disabled');
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
