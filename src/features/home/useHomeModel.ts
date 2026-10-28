import { createElement, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { AppTileApp, StatSlot } from '@/design/components';
import { useChallengesStore } from '@/features/challenges/store';
import { toChallengeItems } from '@/features/challenges/present';
import { currentClarity } from '@/features/clarity/score';
import { useClarityStore } from '@/features/clarity/clarityStore';
import { useFocusStore } from '@/features/focus/store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { usePaywallStore } from '@/features/paywall/paywallStore';
import { trialDayNumber, TRIAL_DAYS } from '@/features/paywall/trial';
import { useTrialStore } from '@/features/paywall/trialStore';
import { useAccessStore } from '@/features/rules/accessStore';
import { passesLeftThisWeek } from '@/features/rules/emergencyPasses';
import { activeRules, activeUntil, nextStart, totalApps } from '@/features/rules/rules';
import { useRulesStore } from '@/features/rules/store';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import {
  formatClock,
  formatDuration,
  formatHomeDate,
  formatRuleTime,
  formatSigned,
} from '@/lib/format';
import { dayKey, dayStart } from '@/lib/time';
import { blocking, type ShieldEvent, type UsageSummary } from '@/services/blocking';
import { useDevMocksStore } from '@/services/devMocks';
import { useEntitlementStore } from '@/services/purchases';

import { ReportStatCard } from './components/ReportStatCard';
import { homeFixture } from './fixtures';
import type { HomeModel } from './homeModel';
import { homeBanner, homeState, isBaseline, isGhostAnimated } from './homeState';
import { deltaTone, longestFocusStat, opensResistedStat, usageStats } from './stats';

/** Placeholder tiles until real icons arrive (iOS: native Label views, Phase 5). */
const PLACEHOLDER_APPS: AppTileApp[] = [
  { id: 'a1', initials: 'IG' },
  { id: 'a2', initials: 'TT' },
  { id: 'a3', initials: 'YT' },
];

/**
 * Home's view model: from the dev fixture if one is picked, otherwise from the stores. `now` is
 * captured once per mount (and refreshed on focus by the screen remounting the hook's key).
 */
export function useHomeModel(now: number): HomeModel {
  const fixture = useDevMocksStore((s) => s.home);
  const live = useLiveHomeModel(now);
  const forced = useMemo(() => (fixture === 'live' ? null : homeFixture(fixture)), [fixture]);
  return forced ?? live;
}

function useLiveHomeModel(now: number): HomeModel {
  const t = useT();
  const access = useAccessStore((s) => s.status);
  const session = useFocusStore((s) => s.session);
  const history = useFocusStore((s) => s.history);
  const draw = useChallengesStore((s) => s.draw);
  const rules = useRulesStore((s) => s.rules);
  const passLog = useRulesStore((s) => s.passLog);
  const startedAt = useTrialStore((s) => s.startedAt);
  const startDay = useTrialStore((s) => s.startDay);
  const isTrialCardSeen = usePaywallStore((s) => s.seen.trialCard);
  const entitlement = useEntitlementStore((s) => s.entitlement);
  const startingClarity = useOnboardingStore((s) => s.startingClarity);
  const habit = useScoringStore((s) => (s.firstDay ? s.clarity(now) : null));
  const streak = useScoringStore((s) => s.streak(now));
  const frozenClarity = useClarityStore((s) => s.lastLive);
  const setLastLive = useClarityStore((s) => s.setLastLive);
  const [events, setEvents] = useState<ShieldEvent[]>([]);
  const [usage, setUsage] = useState<{
    today: UsageSummary | null;
    yesterday: UsageSummary | null;
  }>({ today: null, yesterday: null });

  const today = dayKey(now);
  useEffect(() => {
    let alive = true;
    const from = dayStart(today) - 24 * 60 * 60 * 1000;
    void blocking.getShieldEvents(from).then((e) => alive && setEvents(e));
    void Promise.all([
      blocking.getUsageSummary(today),
      blocking.getUsageSummary(dayKey(dayStart(today) - 1)),
    ]).then(([t0, y]) => alive && setUsage({ today: t0, yesterday: y }));
    return () => {
      alive = false;
    };
  }, [today]);

  const items = draw ? toChallengeItems(draw) : [];
  const doneCount = items.filter((i) => i.status === 'done').length;
  const trial = { startedAt, startDay: startDay ?? null, expiryPaywallSeen: false };
  const dayNumber = trialDayNumber(trial, now);
  const inputs = {
    now: new Date(now),
    blocking: access,
    isFocusRunning: session.status === 'running',
    challengesDone: doneCount,
    challengesTotal: Math.max(1, items.length),
    dayNumber,
    isInGrace: entitlement.isInGrace,
    isTrialCardPending: dayNumber !== null && !isTrialCardSeen && !entitlement.isActive,
  };
  const state = homeState(inputs);
  const bannerKind = homeBanner(inputs);
  const liveClarity = currentClarity(startingClarity, habit);
  const isFrozen = state === 'off';
  const clarity = isFrozen ? (frozenClarity ?? liveClarity) : liveClarity;

  useEffect(() => {
    if (!isFrozen) setLastLive(liveClarity, today);
  }, [isFrozen, liveClarity, setLastLive, today]);

  const at = new Date(now);
  const enabled = rules.filter((r) => r.enabled);
  const appsTotal = totalApps(enabled);
  const blocked = ((): HomeModel['blocked'] => {
    switch (state) {
      case 'off':
        return {
          mode: 'off',
          title: t('home.blocked.offTitle'),
          subtitle: t('home.blocked.offSub', { count: appsTotal }),
          apps: PLACEHOLDER_APPS,
        };
      case 'focus':
        return {
          mode: 'focus',
          title: t('home.blocked.lockedTitle', {
            count: session.status === 'running' ? session.lockedCount : appsTotal,
          }),
          subtitle: t('home.blocked.focusUntil', {
            time: session.status === 'running' ? formatClock(session.endsAt) : '',
          }),
          apps: PLACEHOLDER_APPS,
        };
      case 'evening': {
        const next = nextStart(rules, at);
        if (next) {
          return {
            mode: 'evening',
            title: t('home.blocked.bedtimeAt', { time: formatRuleTime(next.rule.schedule.start) }),
            subtitle: t('home.blocked.startsIn', {
              duration: formatDuration(next.inMinutes),
              count: appsTotal,
            }),
            apps: PLACEHOLDER_APPS,
          };
        }
        break;
      }
      default:
        break;
    }
    const active = activeRules(rules, at);
    const until = activeUntil(rules, at);
    return {
      mode: 'idle',
      title: t('home.blocked.title', { count: appsTotal }),
      subtitle: until
        ? t('home.blocked.rulesUntil', { count: active.length, time: formatRuleTime(until) })
        : t('home.blocked.rulesOn', { count: enabled.length }),
      apps: PLACEHOLDER_APPS,
    };
  })();

  const banner: HomeModel['banner'] =
    bannerKind === 'blockingOff'
      ? {
          kind: 'blockingOff',
          title: t('home.banner.blockingOff.title'),
          sub: t('home.banner.blockingOff.sub'),
          actionLabel: t('home.banner.fix'),
        }
      : bannerKind === 'grace'
        ? {
            kind: 'grace',
            title: t('home.banner.grace.title'),
            sub: t('home.banner.grace.sub'),
            actionLabel: t('home.banner.fix'),
          }
        : null;

  const action: HomeModel['action'] =
    session.status === 'running'
      ? {
          kind: 'focus',
          startedAt: session.startedAt,
          endsAt: session.endsAt,
          endsAtLabel: formatClock(session.endsAt),
          passesLeft: passesLeftThisWeek(passLog, now),
        }
      : state === 'evening'
        ? { kind: 'lightsOut' }
        : { kind: 'startFocus' };

  const stats = ((): HomeModel['stats'] => {
    if (isBaseline(dayNumber)) return { mode: 'baseline', day: dayNumber ?? 1 };
    const longest = longestFocusStat(history, startedAt, now);
    const resisted = opensResistedStat(events, dayStart(today));
    const u = usageStats(usage.today, usage.yesterday, null);
    const screenTime: StatSlot =
      Platform.OS === 'ios'
        ? { custom: createElement(ReportStatCard, { kind: 'screenTime' }) }
        : {
            label: t('home.stats.screenTime'),
            value: u.screenTimeMinutes === null ? '—' : formatDuration(u.screenTimeMinutes),
            ...(u.screenTimeDelta !== null
              ? {
                  delta: formatSigned(u.screenTimeDelta, 'm'),
                  deltaTone: deltaTone(u.screenTimeDelta, true),
                }
              : {}),
            sub: t('home.stats.vsYesterday'),
          };
    const pickups: StatSlot =
      Platform.OS === 'ios'
        ? { custom: createElement(ReportStatCard, { kind: 'pickups' }) }
        : {
            label: t('home.stats.pickups'),
            value: u.pickups === null ? '—' : String(u.pickups),
            ...(u.pickupsDeltaPercent !== null
              ? {
                  delta: formatSigned(u.pickupsDeltaPercent, '%'),
                  deltaTone: deltaTone(u.pickupsDeltaPercent, true),
                }
              : {}),
            sub: t('home.stats.aDay'),
          };
    return {
      mode: 'normal',
      cards: [
        screenTime,
        {
          label: t('home.stats.longestFocus'),
          value: formatDuration(longest.minutes),
          ...(longest.deltaPercent !== null
            ? {
                delta: formatSigned(longest.deltaPercent, '%'),
                deltaTone: deltaTone(longest.deltaPercent, false),
              }
            : {}),
          sub: t('home.stats.withoutUnlocking'),
        },
        pickups,
        {
          label: t('home.stats.opensResisted'),
          value: String(resisted.closed),
          ...(resisted.percent !== null
            ? { delta: `${resisted.percent}%`, deltaTone: 'success' as const }
            : {}),
          sub: t('home.stats.ofTriesClosed'),
        },
      ],
    };
  })();

  return {
    state,
    dateLabel: formatHomeDate(now),
    streak,
    banner,
    trialCard:
      bannerKind === 'trial'
        ? {
            overline: t('paywall.trialCard.overline', { day: dayNumber ?? 1, total: TRIAL_DAYS }),
            title: t('paywall.trialCard.title'),
            body: t('paywall.trialCard.body'),
          }
        : null,
    clarity,
    isClarityFrozen: isFrozen,
    ghost: { mood: clarity / 100, isAnimated: isGhostAnimated(state, bannerKind) },
    action,
    challenges: { items, doneCount },
    blocked,
    stats,
  };
}
