import { ErrorBoundary } from '@/design/components';
import { RewardsScreen } from '@/features/rewards/components/RewardsScreen';

export default function Rewards() {
  return (
    <ErrorBoundary name="rewards">
      <RewardsScreen />
    </ErrorBoundary>
  );
}
