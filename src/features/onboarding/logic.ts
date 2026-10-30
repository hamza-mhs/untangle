/**
 * Pure onboarding maths and option tables (10-phase1-onboarding §2). No React, no storage.
 */

export type Option<V = string> = { id: string; emoji: string; value: V };

/** §2.2: stored value = midpoint age of the band. */
export const AGE_OPTIONS: readonly Option<number>[] = [
  { id: 'under18', emoji: '🧒', value: 16 },
  { id: '18to24', emoji: '🎓', value: 21 },
  { id: '25to34', emoji: '💼', value: 29 },
  { id: '35to44', emoji: '🏡', value: 39 },
  { id: '45to54', emoji: '🌿', value: 49 },
  { id: '55plus', emoji: '☕', value: 60 },
];

/** "Not sure" uses the global average, 2 h 39 min. */
export const NOT_SURE_HOURS = 2.65;

/** §2.3: hours used for the maths. */
export const SCROLL_OPTIONS: readonly Option<number>[] = [
  { id: 'under1', emoji: '🙂', value: 0.5 },
  { id: '1to2', emoji: '😐', value: 1.5 },
  { id: '2to3', emoji: '😕', value: 2.5 },
  { id: '3to4', emoji: '😣', value: 3.5 },
  { id: 'over4', emoji: '🫠', value: 4.5 },
  { id: 'notSure', emoji: '🤷', value: NOT_SURE_HOURS },
];

/** §2.4: stored only (Progress compares it with the real average later). */
export const PICKUP_OPTIONS: readonly Option<string>[] = [
  { id: 'under50', emoji: '🙂', value: 'under50' },
  { id: '50to100', emoji: '😐', value: '50to100' },
  { id: '100to200', emoji: '😬', value: '100to200' },
  { id: 'over200', emoji: '🤯', value: 'over200' },
  { id: 'noIdea', emoji: '🤷', value: 'noIdea' },
];

/** §2.5: five signs plus an exclusive "None of these". */
export const SIGN_IDS = ['work', 'videos', 'reading', 'grabbing', 'foggy'] as const;
export type SignId = (typeof SIGN_IDS)[number];
export const SIGN_EMOJI: Record<SignId | 'none', string> = {
  work: '🎯',
  videos: '⏳',
  reading: '📖',
  grabbing: '📱',
  foggy: '🌫️',
  none: '🙅',
};
export const SIGN_TOTAL = SIGN_IDS.length;

export type SignsState = { signs: string[]; none: boolean };

/**
 * Multi-select with an exclusive "None": picking None clears the others; picking any sign
 * clears None. Tapping a picked row unpicks it.
 */
export function toggleSign(state: SignsState, id: SignId | 'none'): SignsState {
  if (id === 'none') return state.none ? { signs: [], none: false } : { signs: [], none: true };
  const has = state.signs.includes(id);
  const signs = has
    ? state.signs.filter((s) => s !== id)
    : SIGN_IDS.filter((s) => s === id || state.signs.includes(s));
  return { signs, none: false };
}

export function signsAnswered(state: SignsState): boolean {
  return state.none || state.signs.length > 0;
}

/** §2.7: full 24-hour days a year spent scrolling. 2.5 h → 38. */
export function daysPerYear(hours: number): number {
  return Math.round((hours * 365) / 24);
}

/** §2.7 body: days over the next five years, and the age then. */
export function fiveYearLine(hours: number, ageMid: number): { days: number; age: number } {
  return { days: daysPerYear(hours) * 5, age: ageMid + 5 };
}

/** §2.11: the daily cut we suggest: 30 min, or 15 min for people under an hour a day. */
export function goalCutMinutes(hours: number): 15 | 30 {
  return hours >= 1 ? 30 : 15;
}

/** §2.11: hours a year won back by the daily cut. 30 min → 183. */
export function hoursBack(hours: number): number {
  return Math.round((goalCutMinutes(hours) / 60) * 365);
}

/**
 * The two year lines on Hours back: cumulative hours at today's pace and with the cut, sampled
 * monthly (13 points, Now … 12 mo).
 */
export function yearLines(hours: number): { now: number[]; goal: number[] } {
  const cut = goalCutMinutes(hours) / 60;
  const days = (m: number) => (m * 365) / 12;
  const months = Array.from({ length: 13 }, (_, m) => m);
  return {
    now: months.map((m) => days(m) * hours),
    goal: months.map((m) => days(m) * Math.max(0, hours - cut)),
  };
}

/**
 * Names for "Next time you open {App1}, {App2} or {App3}…" (§2.19): up to three names, or the
 * first two plus "and N more" for four or more.
 */
export function appNamesSummary(names: readonly string[]): { shown: string[]; more: number } {
  if (names.length <= 3) return { shown: [...names], more: 0 };
  return { shown: names.slice(0, 2), more: names.length - 2 };
}
