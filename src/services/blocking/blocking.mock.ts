import { Platform } from 'react-native';

import { err, ok } from '@/lib/result';

import { useDevMocksStore } from '../devMocks';
import type {
  BlockingAuthStatus,
  BlockingService,
  BlockingSelection,
  InstalledApp,
} from './BlockingService';

const MOCK_APPS: InstalledApp[] = [
  { packageName: 'com.example.feed', label: 'Feed', icon: '' },
  { packageName: 'com.example.shorts', label: 'Shorts', icon: '' },
  { packageName: 'com.example.chat', label: 'Chat', icon: '' },
];

const MOCK_SELECTION: BlockingSelection =
  Platform.OS === 'android'
    ? { platform: 'android', packages: MOCK_APPS.map((a) => a.packageName) }
    : { platform: 'ios', token: 'mock-selection', count: 3 };

/** A short wait so the flow feels like a real system sheet appeared. */
const SHEET_DELAY_MS = 350;
const wait = () => new Promise((r) => setTimeout(r, SHEET_DELAY_MS));

/** Mock for simulators, Expo Go and tests. Outcomes follow the dev switches (services/devMocks). */
export function createMockBlocking(): BlockingService {
  const mocks = () => useDevMocksStore.getState();
  const setStatus = (authStatus: BlockingAuthStatus) => mocks().set({ authStatus });
  return {
    isMock: true,
    getAuthorization: async () => mocks().authStatus,
    requestAuthorization: async () => {
      await wait();
      if (useDevMocksStore.getState().screenTime === 'deny') {
        setStatus('denied');
        return err('denied');
      }
      setStatus('approved');
      return ok('approved');
    },
    pickApps: async () => {
      await wait();
      return useDevMocksStore.getState().picker === 'cancel'
        ? err('cancelled')
        : ok(MOCK_SELECTION);
    },
    listInstalledApps: async () => MOCK_APPS,
    applyRules: () => {},
    startFocus: () => {},
    endFocus: () => {},
    liftShields: () => {},
    getShieldEvents: async () => [],
    getUsageSummary: async () => null,
    resolveShield: () => {},
  };
}
