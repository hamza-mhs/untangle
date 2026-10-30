import { useLocalSearchParams } from 'expo-router';

import { GameRoute } from '@/features/games';

export default function Game() {
  const { gameId, source } = useLocalSearchParams<{ gameId: string; source?: string }>();
  return <GameRoute gameId={gameId} source={source} />;
}
