import type { GameId } from './catalog';
import type { GameDefinition } from './engine/types';
import { BlockFitRound, LaneDashRound, RocketHopRound, StackTowerRound } from './list/ArcadeRounds';
import { BreathCountRound, SilenceRound, UrgeSurfingRound } from './list/CalmRounds';
import {
  CardPairsRound,
  ColourWordRound,
  DontTapRedRound,
  EchoRound,
  MiddleArrowRound,
} from './list/FocusRounds';

/** Every playable board (BATCH-3.1 §B). */
export const REGISTRY: Record<GameId, GameDefinition> = {
  stackTower: { Round: StackTowerRound, background: 'persp' },
  rocketHop: { Round: RocketHopRound, background: 'dots' },
  laneDash: { Round: LaneDashRound, background: 'persp' },
  blockFit: { Round: BlockFitRound, background: 'grid' },
  colourWord: { Round: ColourWordRound, background: 'grid' },
  middleArrow: { Round: MiddleArrowRound, background: 'grid' },
  dontTapRed: { Round: DontTapRedRound, background: 'persp' },
  echo: { Round: EchoRound, background: 'grid' },
  cardPairs: { Round: CardPairsRound, background: 'dots' },
  breathCount: { Round: BreathCountRound, background: 'dots' },
  silence: { Round: SilenceRound, background: 'dots' },
  urgeSurfing: { Round: UrgeSurfingRound, background: 'dots' },
};
