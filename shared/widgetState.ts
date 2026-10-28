/**
 * Shared state contract — the ONLY data widgets, the Live Activity and the shield/block screens
 * read. The app writes it as JSON to:
 *   iOS:     App Group UserDefaults (suite `group.<bundle id>`), key `WIDGET_STATE_KEY`
 *   Android: SharedPreferences file `untangle.shared`, key `WIDGET_STATE_KEY`
 *
 * Mirrors (keep in sync — src/__tests__/widgetState.test.ts checks every field name):
 *   targets/_shared/WidgetState.swift
 *   modules/blocker-android/android/src/main/java/com/todo/untangle/blocker/SharedState.kt
 *
 * Bump WIDGET_STATE_VERSION on breaking changes; readers must tolerate unknown fields.
 */

export const WIDGET_STATE_VERSION = 1;
export const WIDGET_STATE_KEY = 'widgetState';

export type WidgetChallenge = { id: string; title: string; done: boolean };

export type WidgetState = {
  version: number;
  /** 0 (fully tangled) – 1 (loose). Driven by today's challenges. */
  tangleProgress: number;
  /** Clarity habit score, 0–100. */
  clarity: number;
  /** Current streak in days. */
  streak: number;
  challenges: WidgetChallenge[];
  focus: {
    active: boolean;
    /** Epoch ms; null when no session is running. */
    endsAt: number | null;
    lockedCount: number;
  };
  /** Number of rules currently inside their schedule window. */
  rulesActive: number;
  /** False when blocking can't work (permission revoked, service killed) — widgets warn. */
  blockingHealthy: boolean;
  /** Epoch ms of the last write. */
  updatedAt: number;
};

export const WIDGET_STATE_FIELDS = [
  'version',
  'tangleProgress',
  'clarity',
  'streak',
  'challenges',
  'focus',
  'rulesActive',
  'blockingHealthy',
  'updatedAt',
] as const satisfies readonly (keyof WidgetState)[];

export const emptyWidgetState = (now = Date.now()): WidgetState => ({
  version: WIDGET_STATE_VERSION,
  tangleProgress: 0,
  clarity: 0,
  streak: 0,
  challenges: [],
  focus: { active: false, endsAt: null, lockedCount: 0 },
  rulesActive: 0,
  blockingHealthy: true,
  updatedAt: now,
});

/** Clamp + normalise before serialising, so native readers can trust ranges. */
export function serializeWidgetState(s: WidgetState): string {
  const clean: WidgetState = {
    ...s,
    version: WIDGET_STATE_VERSION,
    tangleProgress: Math.max(0, Math.min(1, s.tangleProgress)),
    clarity: Math.max(0, Math.min(100, Math.round(s.clarity))),
    streak: Math.max(0, Math.floor(s.streak)),
    challenges: s.challenges.slice(0, 3),
  };
  return JSON.stringify(clean);
}
