import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DayGhostStrip,
  type GhostDay,
  IconButton,
  PressableScale,
  StatCard,
  Text,
  VaultItem,
} from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { trialDaysLeft } from '@/features/paywall/trial';
import { useTrialStore } from '@/features/paywall/trialStore';
import { usePro } from '@/features/paywall/usePro';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import { addDays, dayKey } from '@/lib/time';
import { ledgerSince, ledgerTotals } from '@/storage/ledgerRepo';

import { nextGoal, useVaultStore } from '../vault';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const GOOD_DAY_POINTS = 50;

/**
 * FRewards · points and verified share, app time and streak freezes, the user's own vault, and
 * this week as ghosts. The plan pill opens P09; the gear opens Settings (DECIDED: Settings lives
 * on the "you" tab, Home stays free of menu icons).
 */
export function RewardsScreen() {
  const t = useT();
  const points = useScoringStore((s) => s.points);
  const minutes = useScoringStore((s) => s.minutes);
  const freezes = useScoringStore((s) => s.freezes);
  const items = useVaultStore((s) => s.items);
  const pro = usePro();
  const trialStartedAt = useTrialStore((s) => s.startedAt);
  const trialStartDay = useTrialStore((s) => s.startDay);
  const [now] = useState(() => Date.now());
  const [verified, setVerified] = useState<number | null>(null);
  const [week, setWeek] = useState<GhostDay[]>([]);

  useFocusEffect(
    useCallback(() => {
      useVaultStore.getState().load();
      setVerified(ledgerTotals().verifiedPercent);
      setWeek(weekGhosts(t, Date.now()));
    }, [t]),
  );

  const goal = nextGoal(items, points);
  const planLabel = pro.hasPurchased
    ? t('rewards.plan.pro')
    : pro.trial === 'active' || pro.trial === 'ending'
      ? t('rewards.plan.trial', {
          count: trialDaysLeft(
            {
              startedAt: trialStartedAt,
              startDay: trialStartDay ?? null,
              expiryPaywallSeen: false,
            },
            now,
          ),
        })
      : null;

  const confirmArchive = (id: string, name: string) =>
    Alert.alert(t('rewards.vault.removeTitle', { name }), t('rewards.vault.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('rewards.vault.remove'),
        style: 'destructive',
        onPress: () => useVaultStore.getState().archive(id),
      },
    ]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="title.l" accessibilityRole="header" style={styles.flex}>
            {t('rewards.title')}
          </Text>
          {planLabel ? (
            <PressableScale
              testID="rewards.plan"
              accessibilityRole="button"
              onPress={() => router.push('/settings/billing')}
              style={styles.plan}>
              <Text variant="body.strong" tone="accent">
                {planLabel}
              </Text>
            </PressableScale>
          ) : null}
          <IconButton
            testID="rewards.settings"
            icon="settings"
            accessibilityLabel={t('settings.title')}
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={styles.pointsCard} accessible>
          <Text variant="body.l" tone="muted">
            {t('rewards.points.label')}
          </Text>
          <View style={styles.pointsRow}>
            <Text variant="display.points">{points.toLocaleString()}</Text>
            {verified !== null ? (
              <Text variant="body.xl.regular" tone="green">
                {t('rewards.points.verified', { percent: verified })}
              </Text>
            ) : null}
          </View>
          <Text variant="body.l" tone="muted">
            {goal
              ? t('rewards.points.toGo', { toGo: goal.toGo.toLocaleString(), name: goal.item.name })
              : t('rewards.points.keepGoing')}
          </Text>
        </View>

        <View style={styles.stats}>
          <StatCard
            layout="stacked"
            label={t('rewards.stats.appTime')}
            value={t('rewards.stats.minutes', { count: minutes })}
            sub={t('rewards.stats.appTimeSub')}
            subTone="accent"
          />
          <StatCard
            layout="stacked"
            label={t('rewards.stats.freezes')}
            value={String(freezes)}
            sub={t('rewards.stats.freezesSub')}
            subTone="muted"
          />
        </View>

        <View style={styles.sectionHead}>
          <Text variant="body.l" tone="muted">
            {t('rewards.vault.title')}
          </Text>
          <PressableScale
            testID="rewards.add"
            accessibilityRole="button"
            accessibilityLabel={t('rewards.vault.addA11y')}
            onPress={() => router.push('/rewards/add')}>
            <Text variant="body.l" tone="muted">
              {t('rewards.vault.add')}
            </Text>
          </PressableScale>
        </View>
        {items.length === 0 ? (
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push('/rewards/add')}
            style={styles.empty}>
            <Text variant="body.l" tone="muted" align="center">
              {t('rewards.vault.empty')}
            </Text>
          </PressableScale>
        ) : (
          <View style={styles.vault}>
            {items.map((item) => (
              <VaultItem
                key={item.id}
                testID={`rewards.item.${item.id}`}
                name={item.name}
                sizeLabel={t(`rewards.size.${item.size}`).toUpperCase()}
                cost={item.cost}
                points={points}
                onRedeem={() => {
                  if (useVaultStore.getState().redeem(item)) {
                    router.push({ pathname: '/rewards/redeem/[id]', params: { id: item.id } });
                  }
                }}
                onLongPress={() => confirmArchive(item.id, item.name)}
              />
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text variant="body.l" tone="muted" style={styles.flex}>
            {t('rewards.week')}
          </Text>
        </View>
        <DayGhostStrip days={week} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Monday → Sunday of this week; each day's ghost mood from that day's points. */
function weekGhosts(t: ReturnType<typeof useT>, now: number): GhostDay[] {
  const today = dayKey(now);
  const weekday = (new Date(now).getDay() + 6) % 7;
  const monday = addDays(today, -weekday);
  const byDay = new Map<string, number>();
  for (const e of ledgerSince(now - 8 * 24 * 60 * 60 * 1000)) {
    if (e.points > 0) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.points);
  }
  return WEEKDAY_KEYS.map((k, i) => {
    const day = addDays(monday, i);
    const earned = byDay.get(day) ?? 0;
    const ahead = i > weekday;
    const mood = ahead ? null : earned >= GOOD_DAY_POINTS ? 1 : earned > 0 ? 0.6 : 0.2;
    return {
      label: t(`rewards.days.${k}`),
      mood,
      isToday: i === weekday,
      a11y: ahead
        ? t(`rewards.days.${k}Long`)
        : t('rewards.days.a11y', { day: t(`rewards.days.${k}Long`), points: earned }),
    };
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: layout.gutter, paddingBottom: space.huge, gap: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: layout.screen.top,
    paddingLeft: space.xs,
  },
  flex: { flex: 1 },
  plan: {
    height: size.button - space.lg,
    ...pill(size.button - space.lg),
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    backgroundColor: color.bg.raised,
  },
  pointsCard: {
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    padding: space.xl,
    gap: space.xs,
  },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  stats: { flexDirection: 'row', gap: space.sm },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingHorizontal: layout.screen.labelX - layout.gutter,
  },
  vault: { gap: space.sm },
  empty: {
    ...rounded(radius.l),
    borderWidth: size.backButtonRing,
    borderStyle: 'dashed',
    borderColor: color.border.strong,
    padding: space.xxl,
  },
});
