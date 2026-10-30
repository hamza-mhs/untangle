import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { completedByDay, playedToday } from '@/features/games';
import { targetKey, useLocksStore } from '@/features/locks';
import { detoursByDay } from '@/features/pause';
import { useSettingsStore } from '@/features/settings';
import { addDays, dayKey, type DayKey } from '@/lib/time';
import { blocker, type DailyUsage, type TargetCounters, type UsageToday } from '@/native';
import { db } from '@/storage/db/client';
import { dailySummary } from '@/storage/db/schema';

import { computeStreak, dayMeetsGoal, usualOf, type DayActivity } from './streak';

/** Heartbeat older than this while enabled = the service is dead (02 §4.5). */
export const HEARTBEAT_STALE_MS = 10 * 60_000;
const USUAL_DAYS = 7;

export type TodayData = {
  loaded: boolean;
  hasUsage: boolean;
  usage: UsageToday | null;
  usualScreenMs: number | null;
  usualPickups: number | null;
  counters: Record<string, TargetCounters>;
  blockedMs: number;
  blockingOff: boolean;
  batteryRestricted: boolean;
  streak: number;
  activity: Record<DayKey, DayActivity>;
  played: Set<string>;
};

const EMPTY: TodayData = {
  loaded: false,
  hasUsage: false,
  usage: null,
  usualScreenMs: null,
  usualPickups: null,
  counters: {},
  blockedMs: 0,
  blockingOff: false,
  batteryRestricted: false,
  streak: 0,
  activity: {},
  played: new Set(),
};

/** Games and streak-worthy detours per day over the last `days` days. */
export function activityByDay(today: DayKey, days = 60): Record<DayKey, DayActivity> {
  const from = addDays(today, -days);
  const games = completedByDay(from, today);
  const detours = detoursByDay(from, today, ['back', 'breath']);
  const out: Record<DayKey, DayActivity> = {};
  for (const k of new Set([...Object.keys(games), ...Object.keys(detours)])) {
    out[k] = { games: games[k] ?? 0, detours: detours[k] ?? 0 };
  }
  return out;
}

export async function loadToday(goal: number, now = Date.now()): Promise<TodayData> {
  const today = dayKey(now);
  const [hasUsage, enabled, health, battery, counters] = await Promise.all([
    blocker.hasUsageAccess(),
    blocker.isAccessibilityEnabled(),
    blocker.getServiceHealth(),
    blocker.isIgnoringBatteryOptimizations(),
    blocker.getTodayCounters(),
  ]);
  const usage = hasUsage ? await blocker.getUsageToday() : null;
  let range: DailyUsage[] = [];
  if (hasUsage)
    range = await blocker
      .getUsageRange(addDays(today, -USUAL_DAYS), addDays(today, -1))
      .catch(() => []);
  const locks = useLocksStore.getState().locks;
  const keys = new Set(locks.map((l) => targetKey(l.target)));
  const blockedMs = Object.entries(counters)
    .filter(([k]) => keys.has(k as `app:${string}`))
    .reduce((s, [, c]) => s + c.usedMs, 0);
  let activity: Record<DayKey, DayActivity> = {};
  let played = new Set<string>();
  try {
    activity = activityByDay(today);
    played = playedToday(today);
  } catch {
    // Database not ready.
  }
  const stale =
    health.lastHeartbeatAt !== null && now - health.lastHeartbeatAt > HEARTBEAT_STALE_MS;
  return {
    loaded: true,
    hasUsage,
    usage,
    usualScreenMs: usualOf(range.map((d) => d.screenTimeMs)),
    usualPickups: usualOf(range.map((d) => d.pickups)),
    counters,
    blockedMs,
    blockingOff: !enabled || (enabled && stale && !blocker.isMock),
    batteryRestricted: !battery,
    streak: computeStreak(activity, today, goal),
    activity,
    played,
  };
}

/** Today's numbers; refreshes on focus, on return to the app and every 30 s while visible. */
export function useToday(): TodayData & { refresh: () => void } {
  const goal = useSettingsStore((s) => s.dailyGoal);
  const [data, setData] = useState<TodayData>(EMPTY);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadToday(goal)
        .then((d) => {
          if (alive) setData(d);
        })
        .catch(() => {});
      const id = setInterval(refresh, 30_000);
      return () => {
        alive = false;
        clearInterval(id);
      };
      // `tick` re-runs the load on refresh().
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goal, refresh, tick]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  return { ...data, refresh };
}

/**
 * B.11: write today's and the last days' daily_summary rows (screen time, pick-ups, blocked
 * time, detours, games, goal met). Safe to run on every app open.
 */
export async function syncDailySummaries(goal: number, days = 30, now = Date.now()): Promise<void> {
  const today = dayKey(now);
  const from = addDays(today, -days);
  const hasUsage = await blocker.hasUsageAccess().catch(() => false);
  const usage = hasUsage ? await blocker.getUsageRange(from, today).catch(() => []) : [];
  const byDate = new Map(usage.map((d) => [d.date, d]));
  const counters = await blocker.getTodayCounters().catch(() => ({}));
  const blockedToday = Object.values(counters).reduce((s, c) => s + c.usedMs, 0);
  const activity = activityByDay(today, days);
  const detoursAll = detoursByDay(from, today);
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    const u = byDate.get(date);
    const a = activity[date];
    if (!u && !a && date !== today) continue;
    const row = {
      date,
      screenTimeMs: u?.screenTimeMs ?? 0,
      blockedTimeMs: date === today ? blockedToday : 0,
      pickups: u?.pickups ?? null,
      detours: detoursAll[date] ?? 0,
      gamesPlayed: a?.games ?? 0,
      goalMet: dayMeetsGoal(a, goal),
    };
    // Past days keep the blocked time recorded while they were today.
    const set = date === today ? row : { ...row, blockedTimeMs: undefined };
    db.insert(dailySummary)
      .values(row)
      .onConflictDoUpdate({
        target: dailySummary.date,
        set: Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined)),
      })
      .run();
  }
}
