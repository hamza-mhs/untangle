/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'shield-config',
  name: 'UntangleShieldConfig',
  bundleIdentifier: '.shieldconfig',
  deploymentTarget: '16.4',
  colors: {
    primary: '#E9F21F',
    background: '#000000',
    secondaryText: '#8E8E93',
  },
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
