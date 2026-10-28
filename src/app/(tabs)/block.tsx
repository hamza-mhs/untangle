import { ErrorBoundary } from '@/design/components';
import { BlockScreen } from '@/features/rules/components/BlockScreen';

/** Block tab (FBlock). */
export default function Block() {
  return (
    <ErrorBoundary name="block">
      <BlockScreen />
    </ErrorBoundary>
  );
}
