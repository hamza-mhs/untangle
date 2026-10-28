import type { AppTileApp, ChallengeItem, StatSlot } from '@/design/components';
import { t } from '@/i18n';
import { formatClock, formatHomeDate } from '@/lib/format';
import type { MockHome } from '@/services/devMocks';

import type { HomeModel } from './homeModel';

/**
 * The five Home states (plus grace and the P01 trial card) as data from the designs, for the
 * dev menu. Copy still comes from i18n; only the numbers are the designs' examples.
 */

const APPS: AppTileApp[] = [
  { id: 'ig', initials: 'IG' },
  { id: 'tt', initials: 'TT' },
  { id: 'yt', initials: 'YT' },
];

const item = (
  id: string,
  title: string,
  meta: string,
  status: ChallengeItem['status'],
  points: number,
): ChallengeItem => ({ id, title, meta, status, points });

const challenges = (done: number): HomeModel['challenges'] => {
  const rows = [
    item('silence', t('home.fixtures.silence'), t('home.fixtures.silenceMeta'), 'todo', 10),
    item('read', t('home.fixtures.read'), t('challenges.verification.word'), 'todo', 15),
    item('lockIn', t('home.fixtures.lockIn'), t('challenges.verification.timed'), 'todo', 25),
  ];
  return {
    doneCount: done,
    items: rows.map((r, i) => ({
      ...r,
      status: i < done ? 'done' : i === done ? 'next' : 'todo',
    })),
  };
};

const SPARK = [1, 0.83, 0.94, 0.72, 0.78, 0.67, 0.56];

const stats = (): Extract<HomeModel['stats'], { mode: 'normal' }> => ({
  mode: 'normal',
  cards: [
    {
      label: t('home.stats.screenTime'),
      value: '1h 48m',
      delta: '−32m',
      sub: t('home.stats.vsYesterday'),
      spark: SPARK,
    },
    {
      label: t('home.stats.longestFocus'),
      value: '42m',
      delta: '+24%',
      sub: t('home.stats.withoutUnlocking'),
    },
    { label: t('home.stats.pickups'), value: '41', delta: '−18%', sub: t('home.stats.aDay') },
    {
      label: t('home.stats.opensResisted'),
      value: '14',
      delta: '78%',
      sub: t('home.stats.ofTriesClosed'),
    },
  ] satisfies [StatSlot, StatSlot, StatSlot, StatSlot],
});

const at = (h: number, m: number) => new Date(2026, 9, 22, h, m).getTime();

export function homeFixture(kind: Exclude<MockHome, 'live'>): HomeModel {
  const base: HomeModel = {
    state: 'idle',
    dateLabel: formatHomeDate(at(9, 41)),
    streak: 12,
    banner: null,
    trialCard: null,
    clarity: 64,
    isClarityFrozen: false,
    ghost: { mood: 0.64, isAnimated: true },
    action: { kind: 'startFocus' },
    challenges: challenges(1),
    blocked: {
      mode: 'idle',
      title: t('home.blocked.title', { count: 6 }),
      subtitle: t('home.blocked.rulesUntil', { count: 2, time: formatClock(at(23, 0)) }),
      apps: APPS,
    },
    stats: stats(),
  };
  switch (kind) {
    case 'idle':
      return base;
    case 'focus':
      return {
        ...base,
        state: 'focus',
        ghost: { mood: 0.64, isAnimated: false },
        action: {
          kind: 'focus',
          startedAt: Date.now() - 12 * 60_000,
          endsAt: Date.now() + 38 * 60_000 + 12_000,
          endsAtLabel: formatClock(Date.now() + 38 * 60_000),
          passesLeft: 2,
        },
        blocked: {
          mode: 'focus',
          title: t('home.blocked.lockedTitle', { count: 14 }),
          subtitle: t('home.blocked.focusUntil', { time: formatClock(Date.now() + 38 * 60_000) }),
          apps: APPS,
        },
      };
    case 'evening':
      return {
        ...base,
        state: 'evening',
        clarity: 86,
        ghost: { mood: 0.86, isAnimated: false },
        action: { kind: 'lightsOut' },
        challenges: challenges(3),
        blocked: {
          mode: 'evening',
          title: t('home.blocked.bedtimeAt', { time: formatClock(at(23, 0)) }),
          subtitle: t('home.blocked.startsIn', { duration: '1h 20m', count: 6 }),
          apps: APPS,
        },
      };
    case 'day1':
      return {
        ...base,
        state: 'day1',
        streak: 1,
        clarity: 41,
        ghost: { mood: 0.41, isAnimated: false },
        challenges: challenges(0),
        stats: { mode: 'baseline', day: 1 },
      };
    case 'off':
      return {
        ...base,
        state: 'off',
        clarity: 58,
        isClarityFrozen: true,
        ghost: { mood: 0.58, isAnimated: false },
        banner: {
          kind: 'blockingOff',
          title: t('home.banner.blockingOff.title'),
          sub: t('home.banner.blockingOff.sub'),
          actionLabel: t('home.banner.fix'),
        },
        blocked: {
          mode: 'off',
          title: t('home.blocked.offTitle'),
          subtitle: t('home.blocked.offSub', { count: 6 }),
          apps: APPS,
        },
      };
    case 'grace':
      return {
        ...base,
        ghost: { mood: 0.64, isAnimated: false },
        banner: {
          kind: 'grace',
          title: t('home.banner.grace.title'),
          sub: t('home.banner.grace.sub'),
          actionLabel: t('home.banner.fix'),
        },
      };
    case 'trial':
      return {
        ...base,
        ghost: { mood: 0.64, isAnimated: false },
        trialCard: {
          overline: t('paywall.trialCard.overline', { day: 1, total: 7 }),
          title: t('paywall.trialCard.title'),
          body: t('paywall.trialCard.body'),
        },
      };
  }
}
