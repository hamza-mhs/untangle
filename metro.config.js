// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// drizzle-kit migrations (drizzle/*.sql) are bundled as source.
config.resolver.sourceExts.push('sql');

module.exports = config;
