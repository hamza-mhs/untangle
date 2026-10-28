import { isoWeekKey } from '@/lib/time';

/**
 * Emergency passes: 2 logged passes per ISO week (Monday 00:00 local), Pro only. A pass lifts
 * the shields of a focus session or a Locked rule for 10 min, then they come back by themselves.
 */

export const EMERGENCY_PASSES_PER_WEEK = 2;
export const EMERGENCY_PASS_MINUTES = 10;

export const PASS_REASONS = ['work', 'family', 'travel', 'other'] as const;
export type PassReason = (typeof PASS_REASONS)[number];

/** `ruleId` is the rule's id, or 'focus' for a focus session. */
export type EmergencyPassLog = { at: number; ruleId: string; reason: PassReason; note?: string };

export function passesLeftThisWeek(log: readonly EmergencyPassLog[], now: number): number {
  const week = isoWeekKey(now);
  const used = log.filter((p) => isoWeekKey(p.at) === week).length;
  return Math.max(0, EMERGENCY_PASSES_PER_WEEK - used);
}

export function canUseEmergencyPass(
  log: readonly EmergencyPassLog[],
  now: number,
  hasPro: boolean,
): { ok: true } | { ok: false; reason: 'not_pro' | 'none_left' } {
  if (!hasPro) return { ok: false, reason: 'not_pro' };
  if (passesLeftThisWeek(log, now) <= 0) return { ok: false, reason: 'none_left' };
  return { ok: true };
}

/** This week's passes, oldest first (E10's "Used Tue · Work" log). */
export function passesThisWeek(log: readonly EmergencyPassLog[], now: number): EmergencyPassLog[] {
  const week = isoWeekKey(now);
  return log.filter((p) => isoWeekKey(p.at) === week).sort((a, b) => a.at - b.at);
}
