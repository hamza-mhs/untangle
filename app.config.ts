import { readdirSync } from 'node:fs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Single source of truth for native config. Android only: `npx expo prebuild --clean -p android`
 * regenerates android/ from this file plus the plugins below — never edit that folder.
 */

type Variant = 'development' | 'preview' | 'production';
const VARIANT = (process.env.APP_VARIANT as Variant | undefined) ?? 'development';

// TODO(owner): replace "TODO" with the real reverse-DNS owner before the first store build
// (also the Kotlin namespace in modules/).
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

export const PACKAGE_ID = `${BASE_ID}${SUFFIX[VARIANT]}`;

/** Fonts are embedded at build time; files are named by PostScript name. */
const FONT_FILES = readdirSync('./assets/fonts')
  .filter((f) => f.endsWith('.ttf'))
  .map((f) => `./assets/fonts/${f}`);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME[VARIANT],
  slug: 'untangle',
  version: '0.1.0',
  platforms: ['android'],
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'untangle',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',
  android: {
    package: PACKAGE_ID,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Pulled in by libraries for features we don't use — each is a Play data-safety question.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      // Added by the Expo template; v1 must not request it (02-android-platform §2.3).
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
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
    ['expo-build-properties', { android: { minSdkVersion: 26 } }],
    'expo-sqlite',
    'expo-asset',
    // Short game sounds only: no recording, no background playback (that would add a
    // foreground service, which v1 must not have).
    [
      'expo-audio',
      {
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
      },
    ],
    './plugins/withUntangleNative.js',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    variant: VARIANT,
  },
});
