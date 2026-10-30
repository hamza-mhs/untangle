// Reanimated/worklets testing helpers: https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/
require('react-native-reanimated').setUpTests();

// SQLite is native-only: render the app without running migrations under Jest.
jest.mock('@/storage/db/DatabaseProvider', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// react-native-mmkv returns an in-memory mock under Jest, but still imports Nitro eagerly.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => {
      throw new Error('Nitro native modules are unavailable under Jest');
    },
  },
}));

// RevenueCat is native; tests that need behaviour override this with their own jest.mock.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  LOG_LEVEL: { WARN: 'WARN' },
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
}));

// The points ledger (SQLite) is native-only: a chainable stand-in where reads return nothing and
// writes are dropped. Tests that need ledger behaviour use the pure functions instead.
jest.mock('@/storage/db/client', () => {
  const chain: Record<string, unknown> = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'all') return () => [];
        if (prop === 'get') return () => undefined;
        if (prop === 'run') return () => undefined;
        if (prop === 'transaction') return (fn: (tx: unknown) => unknown) => fn(chain);
        if (prop === 'then') return undefined;
        return () => chain;
      },
    },
  );
  return { db: chain, sqlite: {}, DB_NAME: 'untangle.db' };
});

// expo-audio is native; sound.test.ts overrides this to check calls.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ play: () => {}, pause: () => {}, seekTo: () => Promise.resolve() }),
  setAudioModeAsync: () => Promise.resolve(),
}));
