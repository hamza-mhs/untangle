import { create } from 'zustand';

/**
 * What happens when a game ends, for games started from somewhere that waits on them: the pause
 * screen (unlock offer) or a loosening change on a lock (applies after the game). In memory: if
 * the app is killed mid-game, nothing is applied (the safe default).
 */
export type AfterGame =
  | { kind: 'pause'; targetKey: string; lockId: string | null }
  | { kind: 'lockChange'; lockId: string; apply: () => void };

type AfterGameState = {
  pending: AfterGame | null;
  set: (a: AfterGame | null) => void;
};

export const useAfterGameStore = create<AfterGameState>((set) => ({
  pending: null,
  set: (pending) => set({ pending }),
}));
