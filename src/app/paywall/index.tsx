import { useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/design/components';
import { PaywallScreen } from '@/features/paywall/components/PaywallScreen';
import { parseSource } from '@/features/paywall/paywallCopy';

/** P03 / P13 · `untangle://paywall?from=<source>`. */
export default function Paywall() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ErrorBoundary name="paywall">
      <PaywallScreen source={parseSource(from)} />
    </ErrorBoundary>
  );
}
