// Web entry (preview only). Skia's web build needs CanvasKit (public/canvaskit.wasm) on
// `global.CanvasKit` before any module that imports @shopify/react-native-skia is evaluated.
// This is what Skia's LoadSkiaWeb does, minus its dynamic import (which Metro's lazy dev
// bundling can't resolve). The router entry is required only once CanvasKit is ready.
import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit';

CanvasKitInit({ locateFile: (file) => `/${file}` }).then((CanvasKit) => {
  globalThis.CanvasKit = CanvasKit;
  require('expo-router/entry');
});
