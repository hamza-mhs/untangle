/** The contract between RepScreen (states R1–R7, the clock) and one game's playing view. */

export type LossTile = { label: string; hit: boolean };

/** What FTimeUp shows: one line (with an optional highlighted word) and optional answer tiles. */
export type LossInfo = { line: string; highlight?: string; tiles?: readonly LossTile[] };

export type GameProgress = { total: number; done: number } | null;

export type GameProps = {
  level: number;
  seed: number;
  /** False while paused (R5) or after the round ended: no internal timers may fire. */
  running: boolean;
  /** Finished inside the time; `detail` is the R6 sub line ("4 of 5 chains right"). */
  onWin: (detail: string) => void;
  /** Lost before the clock ran out (Letter guess: out of lives). */
  onLose: (info: LossInfo) => void;
  /** Keep FTimeUp's content current in case the clock runs out now. */
  report: (info: LossInfo) => void;
  setProgress: (p: GameProgress) => void;
};
