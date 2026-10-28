import { z } from 'zod';

import { blocking, type BlockingRule } from '@/services/blocking';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { useTrialStore } from '../paywall/trialStore';
import { PASS_REASONS, type EmergencyPassLog } from './emergencyPasses';
import type { Rule } from './model';
import { downgradeToFree, restoreAfterUpgrade } from './rules';

type RulesStore = {
  rules: Rule[];
  /** Recent emergency passes (the full history is in SQLite `emergency_passes`). */
  passLog: EmergencyPassLog[];
  /** Set while a pass is lifting the shields; they come back at this time. */
  passEndsAt: number | null;
  upsertRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
  setEnabled: (id: string, enabled: boolean) => void;
  logPass: (entry: EmergencyPassLog, endsAt: number) => void;
  endPass: () => void;
  /** P06: what the last downgrade changed, for the sheet (not persisted). */
  lastDowngrade: ReturnType<typeof downgradeToFree> | null;
  /** P06: returns what changed so the sheet can say it. */
  downgrade: () => ReturnType<typeof downgradeToFree>;
  upgrade: () => void;
};

/** Rule → the native scheduler's payload. */
export function toBlockingRule(r: Rule): BlockingRule {
  return {
    id: r.id,
    enabled: r.enabled,
    strength: r.strength,
    start: r.schedule.start,
    end: r.schedule.end,
    days: r.schedule.days,
    selection: r.apps,
  };
}

const FOUR_WEEKS = 28 * 24 * 60 * 60 * 1000;

const ruleSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.enum(['pause', 'earn', 'locked']),
  schedule: z.object({
    days: z.array(z.number().int().min(0).max(6)),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  apps: z.union([
    z.object({ platform: z.literal('ios'), token: z.string(), count: z.number() }),
    z.object({ platform: z.literal('android'), packages: z.array(z.string()) }),
  ]),
  enabled: z.boolean(),
  createdAt: z.number(),
  isDefault: z.boolean().optional(),
  budget: z.object({ opens: z.number(), resetsAt: z.string() }).optional(),
  lastUsedAt: z.number().optional(),
  isPausedByPlan: z.boolean().optional(),
});

const persistedSchema = z
  .object({
    rules: z.array(ruleSchema),
    passLog: z.array(
      z.object({
        at: z.number(),
        ruleId: z.string(),
        reason: z.enum(PASS_REASONS),
        note: z.string().optional(),
      }),
    ),
    passEndsAt: z.number().nullable(),
  })
  .partial();

const apply = (rules: readonly Rule[]) => blocking.applyRules(rules.map(toBlockingRule));

export const useRulesStore = createPersistedStore<RulesStore>(
  STORE_KEYS.rules,
  (set, get) => ({
    rules: [],
    passLog: [],
    passEndsAt: null,
    lastDowngrade: null,
    upsertRule: (rule) => {
      const stamped = { ...rule, lastUsedAt: Date.now() };
      const exists = get().rules.some((r) => r.id === rule.id);
      set({
        rules: exists
          ? get().rules.map((r) => (r.id === rule.id ? stamped : r))
          : [...get().rules, stamped],
      });
      // The reverse trial starts the first time any rule is switched on.
      if (rule.enabled) useTrialStore.getState().startIfNeeded();
      apply(get().rules);
    },
    removeRule: (id) => {
      set({ rules: get().rules.filter((r) => r.id !== id) });
      apply(get().rules);
    },
    setEnabled: (id, enabled) => {
      set({
        rules: get().rules.map((r) =>
          r.id === id ? { ...r, enabled, isPausedByPlan: false, lastUsedAt: Date.now() } : r,
        ),
      });
      if (enabled) useTrialStore.getState().startIfNeeded();
      apply(get().rules);
    },
    logPass: (entry, endsAt) => {
      set({
        passLog: [...get().passLog.filter((p) => entry.at - p.at < FOUR_WEEKS), entry],
        passEndsAt: endsAt,
      });
      blocking.liftShields(endsAt);
    },
    endPass: () => {
      set({ passEndsAt: null });
      apply(get().rules);
    },
    downgrade: () => {
      const result = downgradeToFree(get().rules);
      set({ rules: result.rules, lastDowngrade: result });
      apply(result.rules);
      return result;
    },
    upgrade: () => {
      const rules = restoreAfterUpgrade(get().rules);
      set({ rules });
      apply(rules);
    },
  }),
  { version: 2, schema: persistedSchema },
);
