/**
 * Home + Lock Screen widgets and the focus Live Activity / Dynamic Island.
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'UntangleWidgets',
  bundleIdentifier: '.widgets',
  deploymentTarget: '16.4',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
  colors: {
    $accent: '#E9F21F',
    $widgetBackground: '#000000',
    primary: '#E9F21F',
    secondaryText: '#8E8E93',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
