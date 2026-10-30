import type { ReactNode } from 'react';

import type { GameId } from '../catalog';
import { GameScreen } from '../engine/GameScreen';
import type { RoundResult } from '../engine/types';
import { REGISTRY } from '../registry';
import type { GameSource } from '../results';

export type GameShellProps = {
  gameId: GameId;
  source: GameSource;
  /** Pause screen header: "You opened Instagram. Play this instead?". */
  kicker?: string;
  onQuit: () => void;
  /** Buttons under the result; `again` restarts the round. */
  renderActions: (r: RoundResult, again: () => void, calm: boolean) => ReactNode;
  onCompleted?: (r: RoundResult) => void;
};

/** One game, from intro to result, with its real board from the registry. */
export function GameShell({ gameId, ...rest }: GameShellProps) {
  return <GameScreen gameId={gameId} definition={REGISTRY[gameId]} {...rest} />;
}
