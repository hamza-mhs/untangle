import { readdirSync } from 'node:fs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Single source of truth for native config. `npx expo prebuild --clean` regenerates
 * ios/ and android/ from this file plus the plugins below — never edit those folders.
 */

type Variant = 'development' | 'preview' | 'production';
const VARIANT = (process.env.APP_VARIANT as Variant | undefined) ?? 'development';

// TODO(verify): replace "TODO" with the real reverse-DNS owner before the first store build.
const BASE_ID = 'com.TODO.untangle';
const SUFFIX: Record<Variant, string> = {
  development: '.dev',
  preview: '.preview',
  production: '',
};
const NAME: Record<Variant, string> = {
  development: 'Untangle (Dev)',
  preview: 'Untangle (Preview)',
  production: 'Untangle',
};

export const BUNDLE_ID = `${BASE_ID}${SUFFIX[VARIANT]}`;
/** Shared container for the app + every iOS extension (widgets, shield, monitor, report). */
export const APP_GROUP = `group.${BUNDLE_ID}`;

/** Fonts are embedded at build time; files are named by PostScript name (see src/design/typography.ts). */
const FONT_FILES = readdirSync('./assets/fonts')
  .filter((f) => f.endsWith('.ttf'))
  .map((f) => `./assets/fonts/${f}`);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME[VARIANT],
  slug: 'untangle',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'untangle',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    icon: './assets/expo.icon',
    supportsTablet: false,
    // TODO(verify): set APPLE_TEAM_ID in EAS env or here once known.
    ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Health Connect record permission (the library's plugin only wires the rationale screen).
    permissions: ['android.permission.health.READ_STEPS'],
    // Pulled in by libraries for features we don't use — each is a Play data-safety question.
    blockedPermissions: [
      'android.permission.ACTIVITY_RECOGNITION', // expo-sensors Pedometer
      'android.permission.USE_BIOMETRIC', // expo-secure-store requireAuthentication
      'android.permission.USE_FINGERPRINT',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ['expo-font', { fonts: FONT_FILES }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-build-properties',
      {
        // FamilyControls (.individual) + ActivityKit; Health Connect needs minSdk 26.
        ios: { deploymentTarget: '16.4' },
        android: { minSdkVersion: 26 },
      },
    ],
    'expo-sqlite',
    'expo-secure-store',
    // Local notifications only: don't add the push (aps-environment) entitlement.
    ['expo-notifications', { enableRemoteNotifications: false, color: '#E9F21F' }],
    [
      'expo-sensors',
      { motionPermission: 'Untangle uses motion to notice when your phone is face down.' },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Untangle listens while you read aloud during a rep.',
        speechRecognitionPermission:
          'Untangle checks your read-aloud reps on your device. Audio is not stored.',
      },
    ],
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription: 'Untangle reads your step count to verify walk challenges.',
        // Read-only: we never write to Health.
        NSHealthUpdateUsageDescription: false,
      },
    ],
    'react-native-health-connect',
    '@bacons/apple-targets',
    './plugins/withUntangleNative.js',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    variant: VARIANT,
    appGroup: APP_GROUP,
  },
});
