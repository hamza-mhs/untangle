import { ErrorBoundary } from '@/design/components';
import { HomeScreen } from '@/features/home/components/HomeScreen';

/** Today tab (SPEC §5 Home). */
export default function Today() {
  return (
    <ErrorBoundary name="today">
      <HomeScreen />
    </ErrorBoundary>
  );
}
