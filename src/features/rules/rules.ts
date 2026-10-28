import { parseClock } from '@/lib/time';

import { appCount, type Rule, type Schedule, type Strength, type Weekday } from './model';
import { isScheduleActive } from './schedule';
import { STRENGTH_RULES } from './strengths';

/**
 * Pure rule logic (CODE_STANDARDS: no React here, unit-tested): validation, overlaps, the
 * free-plan limit and the "until 23:00" / "starts in 1h 20m" lines.
 */

export const MAX_FREE_RULES = 2;
export const ALL_DAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5];
/** Display order of the weekday circles: Monday first. */
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export type RuleDraft = Pick<Rule, 'name' | 'strength' | 'schedule'> & {
  apps: Rule['apps'] | null;
};

export type RuleProblem = 'noApps' | 'noDays' | 'sameTimes';

/** FRuleEdit validation: ≥1 app, ≥1 day, From ≠ To (overnight ranges are fine). */
export function validateRule(draft: RuleDraft): RuleProblem[] {
  const problems: RuleProblem[] = [];
  if (!draft.apps || appCount(draft.apps) === 0) problems.push('noApps');
  if (draft.schedule.days.length === 0) problems.push('noDays');
  if (parseClock(draft.schedule.start) === parseClock(draft.schedule.end))
    problems.push('sameTimes');
  return problems;
}

export function isOvernight(s: Schedule): boolean {
  return parseClock(s.end) <= parseClock(s.start);
}

export function activeRules(rules: readonly Rule[], at: Date): Rule[] {
  return rules.filter((r) => r.enabled && isScheduleActive(r.schedule, at));
}

/** Overlapping rules: the strictest wins (Locked > Earn > Pause). */
export function strictest(rules: readonly Rule[]): Rule | null {
  return rules.reduce<Rule | null>(
    (best, r) =>
      best === null || STRENGTH_RULES[r.strength].rank > STRENGTH_RULES[best.strength].rank
        ? r
        : best,
    null,
  );
}

/** Minutes from `at` until a schedule's current window ends (0 if it isn't active). */
export function minutesUntilEnd(s: Schedule, at: Date): number {
  if (!isScheduleActive(s, at)) return 0;
  const now = at.getHours() * 60 + at.getMinutes();
  const end = parseClock(s.end);
  return end > now ? end - now : end + 24 * 60 - now;
}

/** The latest end among the active rules, as 'HH:MM' (Home: "2 rules on · until 23:00"). */
export function activeUntil(rules: readonly Rule[], at: Date): string | null {
  const active = activeRules(rules, at);
  if (active.length === 0) return null;
  return active.reduce((a, b) =>
    minutesUntilEnd(b.schedule, at) > minutesUntilEnd(a.schedule, at) ? b : a,
  ).schedule.end;
}

/** The next rule to start today, and how many minutes away (HomeBEvening). */
export function nextStart(
  rules: readonly Rule[],
  at: Date,
): { rule: Rule; inMinutes: number } | null {
  const now = at.getHours() * 60 + at.getMinutes();
  const today = at.getDay() as Weekday;
  let best: { rule: Rule; inMinutes: number } | null = null;
  for (const r of rules) {
    if (!r.enabled || !r.schedule.days.includes(today)) continue;
    const start = parseClock(r.schedule.start);
    if (start <= now || isScheduleActive(r.schedule, at)) continue;
    if (!best || start - now < best.inMinutes) best = { rule: r, inMinutes: start - now };
  }
  return best;
}

/** Apps covered by these rules. iOS selections are opaque, so counts are summed (upper bound). */
export function totalApps(rules: readonly Rule[]): number {
  const android = new Set<string>();
  let ios = 0;
  for (const r of rules) {
    if (r.apps.platform === 'android') r.apps.packages.forEach((p) => android.add(p));
    else ios = Math.max(ios, r.apps.count);
  }
  return android.size + ios;
}

export function canAddRule(rules: readonly Rule[], isPro: boolean): boolean {
  return isPro || rules.filter((r) => !r.isPausedByPlan).length < MAX_FREE_RULES;
}

/** Editing an active Locked rule is blocked until it ends ("locked until 12:00"). */
export function lockedUntil(rule: Rule, at: Date): string | null {
  return rule.enabled && rule.strength === 'locked' && isScheduleActive(rule.schedule, at)
    ? rule.schedule.end
    : null;
}

/**
 * Trial over / Pro lapsed (P06): Locked becomes Earn, the 2 most recently used rules stay on,
 * the rest are paused (never deleted). Returns the new list and what changed.
 */
export function downgradeToFree(rules: readonly Rule[]): {
  rules: Rule[];
  softened: string[];
  kept: string[];
  paused: string[];
} {
  const byRecent = [...rules].sort(
    (a, b) => (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt),
  );
  const keep = new Set(byRecent.slice(0, MAX_FREE_RULES).map((r) => r.id));
  const softened: string[] = [];
  const kept: string[] = [];
  const paused: string[] = [];
  const next = rules.map((r) => {
    let strength: Strength = r.strength;
    if (strength === 'locked') {
      strength = 'earn';
      softened.push(r.id);
    }
    if (keep.has(r.id)) {
      kept.push(r.id);
      return { ...r, strength };
    }
    paused.push(r.id);
    return { ...r, strength, enabled: false, isPausedByPlan: true };
  });
  return { rules: next, softened, kept, paused };
}

/** Pro is back (purchase or restore): un-pause what the plan paused. Strengths stay as they are. */
export function restoreAfterUpgrade(rules: readonly Rule[]): Rule[] {
  return rules.map((r) => (r.isPausedByPlan ? { ...r, enabled: true, isPausedByPlan: false } : r));
}

/** Weekday set → "Every day" / "Mon – Fri" / "Weekends" / "Mon, Wed" (labels from i18n). */
export function daysKind(
  days: readonly Weekday[],
): 'everyDay' | 'weekdays' | 'weekends' | 'custom' {
  const set = new Set(days);
  if (set.size === 7) return 'everyDay';
  if (set.size === 5 && WEEKDAYS.every((d) => set.has(d))) return 'weekdays';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'weekends';
  return 'custom';
}
