import { and, gte, inArray, lt } from 'drizzle-orm';

import { addDays, dayKey, dayStart, type DayKey } from '@/lib/time';
import { db } from '@/storage/db/client';
import { detours } from '@/storage/db/schema';

export type DetourChoice = 'game' | 'breath' | 'back';

/** Every pause-screen choice is a detours row (§8), except Time's up and preview. */
export function logDetour(row: {
  targetKey: string;
  choice: DetourChoice;
  lockId: string | null;
  at?: number;
}) {
  db.insert(detours)
    .values({
      at: row.at ?? Date.now(),
      targetKey: row.targetKey,
      choice: row.choice,
      lockId: row.lockId,
    })
    .run();
}

function between(from: number, to: number) {
  return db
    .select()
    .from(detours)
    .where(and(gte(detours.at, from), lt(detours.at, to)))
    .all();
}

export function detoursBetween(from: number, to: number): number {
  return between(from, to).length;
}

/** Detours per day, counting only the streak-worthy choices (back, breath) when asked. */
export function detoursByDay(
  from: DayKey,
  to: DayKey,
  choices: readonly DetourChoice[] = ['game', 'breath', 'back'],
): Record<DayKey, number> {
  const rows = db
    .select({ at: detours.at })
    .from(detours)
    .where(
      and(
        gte(detours.at, dayStart(from)),
        lt(detours.at, dayStart(addDays(to, 1))),
        inArray(detours.choice, [...choices]),
      ),
    )
    .all();
  const out: Record<DayKey, number> = {};
  for (const r of rows) {
    const k = dayKey(r.at);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Today's detours by local hour (Screen time chart tint). */
export function detourHoursToday(now = Date.now()): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const r of between(dayStart(dayKey(now)), now + 1)) hours[new Date(r.at).getHours()]! += 1;
  return hours;
}
