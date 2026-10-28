import { create } from 'zustand';

import type { AppSelection, Rule, Strength, Weekday } from './model';
import { WEEKDAYS } from './rules';

/**
 * The rule being edited (FRuleEdit). In memory only, so sheets on top of the editor (P07 gate)
 * can change it: "Use Earn instead" sets the strength and goes back.
 */
export type RuleDraft = {
  id: string | null;
  name: string;
  apps: AppSelection | null;
  days: Weekday[];
  start: string;
  end: string;
  strength: Strength;
  isDefault: boolean;
  createdAt: number | null;
};

type DraftStore = {
  draft: RuleDraft;
  begin: (rule: Rule | null, defaults: { name: string; strength: Strength }) => void;
  patch: (p: Partial<RuleDraft>) => void;
};

export const useRuleDraftStore = create<DraftStore>((set, get) => ({
  draft: emptyDraft('', 'earn'),
  begin: (rule, defaults) =>
    set({
      draft: rule
        ? {
            id: rule.id,
            name: rule.name,
            apps: rule.apps,
            days: [...rule.schedule.days],
            start: rule.schedule.start,
            end: rule.schedule.end,
            strength: rule.strength,
            isDefault: !!rule.isDefault,
            createdAt: rule.createdAt,
          }
        : emptyDraft(defaults.name, defaults.strength),
    }),
  patch: (p) => set({ draft: { ...get().draft, ...p } }),
}));

function emptyDraft(name: string, strength: Strength): RuleDraft {
  return {
    id: null,
    name,
    apps: null,
    days: [...WEEKDAYS],
    start: '09:00',
    end: '17:00',
    strength,
    isDefault: false,
    createdAt: null,
  };
}

export function draftToRule(d: RuleDraft, now: number): Rule | null {
  if (!d.apps) return null;
  return {
    id: d.id ?? `rule-${now}`,
    name: d.name,
    strength: d.strength,
    schedule: { days: d.days, start: d.start, end: d.end },
    apps: d.apps,
    enabled: true,
    createdAt: d.createdAt ?? now,
    ...(d.isDefault ? { isDefault: true } : {}),
  };
}
