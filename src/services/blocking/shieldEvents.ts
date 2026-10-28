import { z } from 'zod';

import type { ShieldEvent, UsageSummary } from './BlockingService';

/** Native payloads are `unknown` until validated (CODE_STANDARDS › TypeScript). */
const eventSchema = z.object({
  at: z.number(),
  appId: z.string(),
  ruleId: z.string(),
  strength: z.enum(['pause', 'earn', 'locked']),
  outcome: z.enum(['closed', 'opened', 'spent']),
  reason: z.enum(['bored', 'habit', 'need', 'avoiding']).optional(),
});

export function parseShieldEvents(raw: readonly unknown[]): ShieldEvent[] {
  return raw.flatMap((r) => {
    const parsed = eventSchema.safeParse(r);
    if (!parsed.success) return [];
    const { reason, ...rest } = parsed.data;
    return [reason ? { ...rest, reason } : rest];
  });
}

const usageSchema = z.object({ screenTimeMinutes: z.number(), pickups: z.number() });

export function parseUsage(raw: unknown): UsageSummary | null {
  const parsed = usageSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
