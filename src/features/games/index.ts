export {
  DEFAULT_PAUSE_GAME,
  GAMES,
  gameMeta,
  isGameId,
  isQuickGame,
  type GameAccent,
  type GameId,
  type GameMeta,
} from './catalog';
export { pickTraining, rng, TRAINING_SIZE } from './training';
export { useTrainingStore } from './trainingStore';
export {
  allBests,
  completedByDay,
  gamesPlayedBetween,
  lastPlayedDays,
  playedToday,
  saveResult,
  type BestRow,
  type GameSource,
} from './results';
export type { RoundResult } from './engine/types';
export { useAfterGameStore, type AfterGame } from './afterGame';
export { GameShell, type GameShellProps } from './shell/GameShell';
export { REGISTRY } from './registry';
export type { GameApi, GameDefinition, RoundProps } from './engine/types';
export { GameRoute } from './screens/GameRoute';
export { GamesTab } from './screens/GamesTab';
