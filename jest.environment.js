// jest-expo's native test environment + a real CanvasKit (Skia's WASM build) on the global,
// so @shopify/react-native-skia's Jest mock can build real paths, gradients and bounds.
// Mirrors @shopify/react-native-skia/jestEnv.js without dropping jest-expo's fixes.
const ExpoNativeEnvironment = require('jest-expo/src/preset/nativeEnvironment');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit');

class SkiaExpoEnvironment extends ExpoNativeEnvironment {
  async setup() {
    await super.setup();
    this.global.CanvasKit = await CanvasKitInit({});
  }
}

module.exports = SkiaExpoEnvironment;
module.exports.TestEnvironment = SkiaExpoEnvironment;
