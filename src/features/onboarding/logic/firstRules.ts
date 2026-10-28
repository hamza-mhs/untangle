import type { AppSelection, Rule, Strength, Weekday } from '@/features/rules/model';

import type { WhenTrigger } from '../types';

/**
 * OB14 / OB15: the rules the plan promises. Bedtime 23:00–07:00 is always on; mornings
 * 07:00–09:00 is added when OB04 includes "morning". Both use the OB08 strength.
 */
export const BEDTIME = { start: '23:00', end: '07:00' } as const;
export const MORNINGS = { start: '07:00', end: '09:00' } as const;
const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function wantsMornings(when: readonly WhenTrigger[]): boolean {
  return when.includes('morning');
}

export function buildFirstRules(args: {
  apps: AppSelection;
  strength: Strength;
  when: readonly WhenTrigger[];
  names: { bedtime: string; mornings: string };
  now: number;
}): Rule[] {
  const { apps, strength, when, names, now } = args;
  const rule = (id: string, name: string, window: { start: string; end: string }): Rule => ({
    id,
    name,
    strength,
    schedule: { days: EVERY_DAY, ...window },
    apps,
    enabled: true,
    createdAt: now,
  });
  const rules = [rule(`bedtime-${now}`, names.bedtime, BEDTIME)];
  if (wantsMornings(when)) rules.push(rule(`mornings-${now}`, names.mornings, MORNINGS));
  return rules;
}
