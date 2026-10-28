import { ErrorBoundary } from '@/design/components';
import { ChallengesScreen } from '@/features/challenges/components/ChallengesScreen';

/** Challenges tab (FChallenges). */
export default function Challenges() {
  return (
    <ErrorBoundary name="challenges">
      <ChallengesScreen />
    </ErrorBoundary>
  );
}
