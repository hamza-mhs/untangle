import type { AppSelection, Strength } from '@/features/rules/model';

/** OB02 answer buckets. */
export const SCREEN_TIME_BUCKETS = ['lt2', '2-4', '4-6', '6-8', '8+', 'unsure'] as const;
export type ScreenTimeBucket = (typeof SCREEN_TIME_BUCKETS)[number];

/** OB03 app labels (labels only; real apps come from the picker in OB10). */
export const APP_LABELS = [
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'reddit',
  'snapchat',
  'games',
  'other',
] as const;
export type AppLabel = (typeof APP_LABELS)[number];

/** OB04 triggers. */
export const WHEN_TRIGGERS = ['morning', 'bed', 'work', 'bored', 'stressed'] as const;
export type WhenTrigger = (typeof WHEN_TRIGGERS)[number];

/** OB05 goals (max two). */
export const GOAL_IDS = ['focus', 'sleep', 'people', 'hobbies', 'calm'] as const;
export type GoalId = (typeof GOAL_IDS)[number];
export const GOALS_MAX = 2;

export type BlockingAccess = 'unknown' | 'approved' | 'denied' | 'skipped';
export type NotificationAccess = 'unknown' | 'granted' | 'denied';

export type OnboardingAnswers = {
  screenTime: ScreenTimeBucket | null;
  apps: AppLabel[];
  when: WhenTrigger[];
  goals: GoalId[];
  /** OB08: default strength for the first rule. */
  strength: Strength;
  /** OB09 / E01 outcome. `skipped` = "Continue without blocking". */
  blocking: BlockingAccess;
  /** OB10 picker result (opaque on iOS). */
  appSelection: AppSelection | null;
  /** OB11 outcome. */
  notifications: NotificationAccess;
  /** OB13 starting Clarity, fixed once computed. */
  startingClarity: number | null;
};
