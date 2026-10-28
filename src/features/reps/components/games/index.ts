import type { ComponentType } from 'react';

import { REPS, type RepId } from '../../catalog';
import type { GameProps } from '../gameTypes';
import { LetterGame } from './LetterGame';
import { MathsGame, mathsStepsFor } from './MathsGame';
import { pairsSecondsFor, PairsGame } from './PairsGame';
import { LetterPreview, MathsPreview, PairsPreview, SpanPreview, TargetPreview } from './previews';
import { SpanGame, spanStartFor } from './SpanGame';
import { TargetGame, targetFor } from './TargetGame';
import { wordLengthFor } from '../../calmWords';

export type GameId = Exclude<RepId, 'read'>;

export type GameDef = {
  Component: ComponentType<GameProps>;
  Preview: ComponentType;
  durationMs: (level: number) => number;
  /** The number in "Next time · {n}-step chains" for a level. */
  levelValue: (level: number) => number;
};

const fixed = (id: GameId) => () => REPS[id].durationSec * 1000;

/** Read aloud is a rep too, but it lives in its own flow (/reading). */
export const GAMES: Record<GameId, GameDef> = {
  maths: {
    Component: MathsGame,
    Preview: MathsPreview,
    durationMs: fixed('maths'),
    levelValue: mathsStepsFor,
  },
  letter: {
    Component: LetterGame,
    Preview: LetterPreview,
    durationMs: fixed('letter'),
    levelValue: wordLengthFor,
  },
  target: {
    Component: TargetGame,
    Preview: TargetPreview,
    durationMs: fixed('target'),
    levelValue: targetFor,
  },
  pairs: {
    Component: PairsGame,
    Preview: PairsPreview,
    durationMs: (level) => pairsSecondsFor(level) * 1000,
    levelValue: pairsSecondsFor,
  },
  span: {
    Component: SpanGame,
    Preview: SpanPreview,
    durationMs: fixed('span'),
    levelValue: spanStartFor,
  },
};

export function isGameId(id: string | undefined): id is GameId {
  return id !== undefined && id in GAMES;
}
