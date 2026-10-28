import type {
  AppTileApp,
  BannerKind,
  BlockedAppsMode,
  ChallengeItem,
  StatSlot,
} from '@/design/components';

import type { HomeStateKind } from './homeState';

/**
 * Everything Home renders, already worded. Built from the stores (`useHomeModel`) or from a
 * fixture (dev menu), so the screen itself has no logic.
 */
export type HomeModel = {
  state: HomeStateKind;
  dateLabel: string;
  streak: number;
  banner: { kind: BannerKind; title: string; sub: string; actionLabel: string } | null;
  /** P01: replaces nothing; sits between Clarity and the action. */
  trialCard: { overline: string; title: string; body: string } | null;
  clarity: number;
  isClarityFrozen: boolean;
  ghost: { mood: number; isAnimated: boolean };
  action:
    | { kind: 'startFocus' }
    | { kind: 'lightsOut' }
    | { kind: 'focus'; startedAt: number; endsAt: number; endsAtLabel: string; passesLeft: number };
  challenges: { items: ChallengeItem[]; doneCount: number };
  blocked: { mode: BlockedAppsMode; title: string; subtitle: string; apps: AppTileApp[] };
  stats:
    | { mode: 'normal'; cards: [StatSlot, StatSlot, StatSlot, StatSlot] }
    | { mode: 'baseline'; day: number };
};
