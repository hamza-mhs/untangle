import { router, useFocusEffect } from 'expo-router';
import { gte } from 'drizzle-orm';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BarChart,
  Button,
  Card,
  EmptyState,
  Icon,
  ListGroup,
  ListRow,
  Screen,
  Segmented,
  StatTile,
  Text,
} from '@/design/components';
import { color, layout, radius, size, space } from '@/design/tokens';
import { allBests, gamesPlayedBetween, gameMeta, type BestRow } from '@/features/games';
import { syncDailySummaries, useToday } from '@/features/home';
import { useOnboardingStore } from '@/features/onboarding';
import { usePro } from '@/features/paywall';
import { useSettingsStore } from '@/features/settings';
import { useT } from '@/i18n';
import { formatDuration } from '@/lib/format';
import { addDays, dayKey, dayStart } from '@/lib/time';
import { blocker } from '@/native';
import { db } from '@/storage/db/client';
import { dailySummary } from '@/storage/db/schema';

import {
  avgPickups,
  avgScreen,
  bars,
  daysWithData,
  percentChange,
  periodDays,
  sumDetours,
  timeBackMs,
  type Period,
  type SummaryRow,
} from './stats';

const HISTORY_DAYS = 90;

function loadRows(): SummaryRow[] {
  return db
    .select()
    .from(dailySummary)
    .where(gte(dailySummary.date, addDays(dayKey(), -HISTORY_DAYS)))
    .all();
}

/** Progress (20-phase2-core-app §5). */
export function ProgressScreen() {
  const t = useT();
  const { isPro } = usePro();
  const today = useToday();
  const goal = useSettingsStore((s) => s.dailyGoal);
  const pickupsAnswer = useOnboardingStore((s) => s.answers.pickupsAnswer);
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [bests, setBests] = useState<BestRow[]>([]);
  const [games, setGames] = useState({ total: 0, distinct: 0 });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void syncDailySummaries(goal)
        .catch(() => {})
        .then(() => {
          if (!alive) return;
          try {
            setRows(loadRows());
            setBests(allBests());
          } catch {
            // Database not ready.
          }
        });
      return () => {
        alive = false;
      };
    }, [goal]),
  );

  const now = dayKey();
  const days = periodDays(now, period);
  const prevDays = periodDays(addDays(now, -days.length), period);
  const locked = period === 'month' && !isPro;

  useFocusEffect(
    useCallback(() => {
      try {
        setGames(gamesPlayedBetween(dayStart(days[0]!), dayStart(addDays(now, 1))));
      } catch {
        // No history.
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, rows]),
  );

  const avg = avgScreen(rows, days);
  const prevAvg = avgScreen(rows, prevDays);
  const change = percentChange(avg, prevAvg);
  const pick = avgPickups(rows, days);
  const prevPick = avgPickups(rows, prevDays);
  const firstDays = daysWithData(rows) < 2;
  const chart = bars(rows, days).map((b) => ({
    label: new Date(`${b.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' }),
    blocked: b.blocked,
    other: b.other,
    a11y: formatDuration(b.blocked + b.other),
  }));

  return (
    <Screen testID="tab.progress" gutter="tab" scroll edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="titleLg" accessibilityRole="header">
          {t('progress.title')}
        </Text>
        <View style={styles.streak}>
          <Icon name="flame" size={size.icon.sm} color={color.game.orange} />
          <Text variant="bodyStrong">{t('home.streak.pill', { count: today.streak })}</Text>
        </View>
      </View>
      <Segmented
        testID="progress.period"
        options={[
          { value: 'week', label: t('progress.week') },
          { value: 'month', label: t('progress.month') },
        ]}
        value={period}
        onChange={setPeriod}
      />
      {firstDays ? (
        <Text variant="caption" tone="secondary" style={styles.note}>
          {t('progress.firstWeek')}
        </Text>
      ) : null}
      {locked ? (
        <Card
          testID="progress.proLock"
          onPress={() => router.push('/paywall')}
          style={styles.cardGap}>
          <View style={styles.lockRow}>
            <Icon name="lock" size={size.icon.md} color={color.brand.violetLight} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{t('progress.proTitle')}</Text>
              <Text variant="caption" tone="secondary">
                {t('progress.proBody')}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        <View style={styles.cards}>
          {today.loaded && !today.hasUsage ? (
            <Card testID="progress.noUsage">
              <EmptyState
                icon="chart"
                title={t('home.detail.noAccessTitle')}
                body={t('home.detail.noAccessBody')}
                actionLabel={t('home.detail.noAccessCta')}
                onAction={() => void blocker.openUsageAccessSettings().then(today.refresh)}
              />
            </Card>
          ) : (
            <Card testID="progress.screen">
              <Text variant="body" tone="secondary">
                {t('progress.avgScreen')}
              </Text>
              <Text variant="statLg">{avg === null ? '—' : formatDuration(avg / 60_000)}</Text>
              {change !== null && change !== 0 ? (
                <Text variant="caption" tone={change < 0 ? 'success' : 'secondary'}>
                  {t(change < 0 ? 'progress.less' : 'progress.more', {
                    pct: Math.abs(change),
                    period: t(`progress.last.${period}`),
                  })}
                </Text>
              ) : null}
              <BarChart
                data={chart}
                legend={{ blocked: t('progress.legendBlocked'), other: t('progress.legendOther') }}
              />
            </Card>
          )}
          <View style={styles.tiles}>
            <View style={styles.flex}>
              <StatTile
                label={t('progress.timeBack')}
                value={formatDuration(timeBackMs(rows, days) / 60_000)}
                delta={{ text: t('progress.timeBackSub'), tone: 'neutral' }}
              />
            </View>
            <View style={styles.flex}>
              <StatTile
                label={t('progress.detours')}
                value={String(sumDetours(rows, days))}
                delta={{ text: t('progress.detoursSub'), tone: 'neutral' }}
              />
            </View>
          </View>
          <View style={styles.tiles}>
            <View style={styles.flex}>
              <StatTile
                label={t('progress.games')}
                value={String(games.total)}
                delta={{ text: t('progress.gamesSub', { count: games.distinct }), tone: 'neutral' }}
              />
            </View>
            {today.hasUsage ? (
              <View style={styles.flex}>
                <StatTile
                  label={t('progress.pickups')}
                  value={pick === null ? '—' : String(Math.round(pick))}
                  {...(pick !== null && prevPick !== null && Math.round(prevPick - pick) !== 0
                    ? {
                        delta: {
                          text: t(
                            pick < prevPick ? 'progress.pickupsFewer' : 'progress.pickupsMore',
                            { count: Math.abs(Math.round(prevPick - pick)) },
                          ),
                          tone: pick < prevPick ? ('good' as const) : ('neutral' as const),
                        },
                      }
                    : {})}
                />
                {pickupsAnswer ? (
                  <Text variant="caption" tone="tertiary" style={styles.guess}>
                    {t('progress.guessed', {
                      answer: t(`onboarding.pickups.options.${pickupsAnswer}`),
                    })}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <ListGroup label={t('progress.bests')}>
            {bests.length === 0 ? (
              <ListRow title={t('progress.noBests')} subtitle={t('progress.bestsSub')} />
            ) : (
              bests.map((b) => (
                <ListRow
                  key={b.gameId}
                  title={gameMeta(b.gameId) ? t(`games.list.${b.gameId}.name`) : b.gameId}
                  subtitle={t('progress.bestsSub')}
                  value={b.label}
                />
              ))
            )}
          </ListGroup>
          {!isPro ? (
            <Button
              variant="ghost"
              size="md"
              label={t('progress.seePlans')}
              onPress={() => router.push('/paywall')}
            />
          ) : null}
        </View>
      )}
      <View style={styles.clearance} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.headerTop + space.lg,
    marginBottom: space.lg,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.surface.control,
  },
  note: { marginTop: space.md },
  cards: { gap: space.md, marginTop: space.lg },
  cardGap: { marginTop: space.lg },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tiles: { flexDirection: 'row', gap: space.md },
  guess: { marginTop: space.xs, marginLeft: space.xs },
  clearance: { height: layout.tabBarClearance },
});
