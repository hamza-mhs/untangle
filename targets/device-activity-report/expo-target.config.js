/**
 * DeviceActivityReport extension. @bacons/apple-targets v5 has no type for it, so this uses
 * the ExtensionKit-based `app-intent` type (same product type and Extensions/ embedding) with
 * a hand-written Info.plist (apple-targets never overwrites an existing one) that sets
 * EXExtensionPointIdentifier to the report extension point.
 * TODO(verify): build on a Mac and confirm the report renders; switch to a native type if
 * apple-targets adds `device-activity-report`.
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'app-intent',
  name: 'UntangleReport',
  bundleIdentifier: '.report',
  deploymentTarget: '16.4',
  frameworks: ['DeviceActivity', 'SwiftUI', 'FamilyControls'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
