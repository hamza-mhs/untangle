import { router } from 'expo-router';

import { Button } from '@/design/components';
import { useT } from '@/i18n';

import { useAfterGameStore } from '../afterGame';
import { isGameId } from '../catalog';
import type { GameSource } from '../results';
import { GameShell } from '../shell/GameShell';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** /game/<id>?source=training|browse — training and the Games tab (pause runs its own). */
export function GameRoute({ gameId, source }: { gameId: string; source: string | undefined }) {
  const t = useT();
  if (!isGameId(gameId)) {
    close();
    return null;
  }
  const src: GameSource = source === 'training' ? 'training' : 'browse';
  return (
    <GameShell
      gameId={gameId}
      source={src}
      onQuit={() => {
        // Quitting a gated change's game applies nothing (20-phase2 §6.7).
        useAfterGameStore.getState().set(null);
        close();
      }}
      onCompleted={() => {
        const pending = useAfterGameStore.getState().pending;
        if (pending?.kind === 'lockChange') {
          pending.apply();
          useAfterGameStore.getState().set(null);
        }
      }}
      renderActions={(_r, again) => (
        <>
          <Button testID="game.done" label={t('games.result.done')} onPress={close} />
          <Button
            testID="game.again"
            variant="ghost"
            label={t('games.result.again')}
            onPress={again}
          />
        </>
      )}
    />
  );
}
