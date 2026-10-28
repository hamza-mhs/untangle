/**
 * Blocking rules. A rule = which apps + when + how strongly.
 * The app selection is opaque: on iOS it's a serialized FamilyActivitySelection (the app can't
 * see which apps are inside it); on Android it's a list of package names.
 */

export type Strength = 'pause' | 'earn' | 'locked';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, matches Date#getDay

export type Schedule = {
  days: Weekday[];
  /** 'HH:MM' local. If end <= start the window crosses midnight. */
  start: string;
  end: string;
};

export type AppSelection =
  { platform: 'ios'; token: string; count: number } | { platform: 'android'; packages: string[] };

export type Rule = {
  id: string;
  name: string;
  strength: Strength;
  schedule: Schedule;
  apps: AppSelection;
  enabled: boolean;
  createdAt: number;
  /** The bedtime rule from onboarding ("Default" tag on FBlock). */
  isDefault?: boolean;
  /** Open-budget variant: N opens a day, reset at a local time. */
  budget?: { opens: number; resetsAt: string };
  /** Last time the rule was active or edited (keep-by-default after a downgrade, P06). */
  lastUsedAt?: number;
  /** Switched off by the trial ending (P06), not by the user: "paused · not deleted". */
  isPausedByPlan?: boolean;
};

export function appCount(sel: AppSelection): number {
  return sel.platform === 'ios' ? sel.count : sel.packages.length;
}
