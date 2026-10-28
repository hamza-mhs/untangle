import { Redirect, useLocalSearchParams } from 'expo-router';

import { ErrorBoundary } from '@/design/components';
import { RepScreen } from '@/features/reps/components/RepScreen';
import { isGameId } from '@/features/reps/components/games';

/** /reps/[game]: one rep in every state (R1–R7, FTimeUp). Read aloud has its own flow. */
export default function RepRoute() {
  const { game } = useLocalSearchParams<{ game?: string }>();
  if (game === 'read') return <Redirect href="/reading" />;
  if (!isGameId(game)) return <Redirect href="/challenges" />;
  return (
    <ErrorBoundary name="rep">
      <RepScreen key={game} id={game} />
    </ErrorBoundary>
  );
}
