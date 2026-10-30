import { router } from 'expo-router';

import { PaywallScreen } from '@/features/paywall';

/** In-app paywall: Settings, 4th lock, locked game, Progress month, trial-ended card. */
export default function Paywall() {
  return <PaywallScreen variant="inApp" testID="paywall.inApp" onDone={() => router.back()} />;
}
