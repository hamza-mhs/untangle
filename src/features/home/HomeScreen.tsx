import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  Banner,
  Button,
  Card,
  GameIcon,
  Icon,
  PressableScale,
  ProgressDots,
  Screen,
  Sheet,
  Text,
} from '@/design/components';
import { color, layout, radius, size, space } from '@/design/tokens';
import { gameMeta, useTrainingStore, type GameId } from '@/features/games';
import {
  isOverLimit,
  LockChip,
  openNewLock,
  targetKey,
  targetName,
  useLocksStore,
} from '@/features/locks';
import { usePro } from '@/features/paywall';
import { useSettingsStore } from '@/features/settings';
import { useT } from '@/i18n';
import { formatDuration } from '@/lib/format';
import { dayKey } from '@/lib/time';
import { useEntitlementStore } from '@/services/purchases';
import { blocker } from '@/native';

import { useToday } from './data';
import { aboutMinutes, dayMeetsGoal, weekDays } from './streak';

const CARD_W = 248;
const BLOCKED_SHOWN = 4;
const BATTERY_SNOOZE_MS = 24 * 60 * 60_000;

/** The C1 blue sky (asset placeholder drawn in code): fades to black, scrolls with content. */
function Sky({ height }: { height: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.sky, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color.game.sky} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={color.game.cobalt} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color.bg.app} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sky)" />
        <Ellipse cx="20" cy="30" rx="30" ry="7" fill={color.text.primary} opacity={0.08} />
        <Ellipse cx="75" cy="44" rx="34" ry="8" fill={color.text.primary} opacity={0.06} />
      </Svg>
    </View>
  );
}

let batterySnoozedAt = 0;

/** Today (Home, option C1) — 20-phase2-core-app §2. */
export function HomeScreen() {
  const t = useT();
  const { height, width } = useWindowDimensions();
  const data = useToday();
  const goal = useSettingsStore((s) => s.dailyGoal);
  const locks = useLocksStore((s) => s.locks);
  const { isPro } = usePro();
  const endedAt = useEntitlementStore((s) => s.entitlement.endedAt);
  const training = useTrainingStore((s) => s.ids);
  useFocusEffect(
    useCallback(() => {
      useTrainingStore.getState().today();
    }, []),
  );
  const [streakOpen, setStreakOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [batteryHidden, setBatteryHidden] = useState(
    () => Date.now() - batterySnoozedAt < BATTERY_SNOOZE_MS,
  );

  const playedCount = training.filter((id) => data.played.has(id)).length;
  const metas = training.map((id) => gameMeta(id)!).filter(Boolean);
  const screenMs = data.usage?.screenTimeMs ?? data.blockedMs;
  const otherMs = Math.max(0, screenMs - data.blockedMs);
  const delta =
    data.usualScreenMs !== null && data.usage ? data.usage.screenTimeMs - data.usualScreenMs : null;

  const overCount = locks.filter((l) => {
    const c = data.counters[targetKey(l.target)];
    return l.enabled && c && isOverLimit(l, c);
  }).length;
  const firstWithMinutes = locks.find((l) => l.enabled && l.dailyMinutes);
  const blockedLine = (() => {
    if (overCount > 1) return t('home.blocked.over', { count: overCount });
    if (overCount === 1) {
      const l = locks.find(
        (x) =>
          x.enabled &&
          isOverLimit(
            x,
            data.counters[targetKey(x.target)] ?? { usedMs: 0, opens: 0, unlocksUsed: 0 },
          ),
      );
      return l ? t('home.blocked.overOne', { name: targetName(l.target) }) : '';
    }
    if (firstWithMinutes?.dailyMinutes) {
      const used = Math.floor(
        (data.counters[targetKey(firstWithMinutes.target)]?.usedMs ?? 0) / 60_000,
      );
      return t('home.blocked.left', {
        name: targetName(firstWithMinutes.target),
        left: Math.max(0, firstWithMinutes.dailyMinutes - used),
        total: firstWithMinutes.dailyMinutes,
      });
    }
    return t('home.blocked.allOn', { count: locks.filter((l) => l.enabled).length });
  })();

  const onCarousel = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + space.md)));

  const week = weekDays(dayKey());

  return (
    <Screen testID="tab.today" gutter="none" edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Sky height={height * 0.4} />
        <View style={styles.pad}>
          <View style={styles.topRow}>
            <PressableScale
              testID="home.streak"
              accessibilityRole="button"
              accessibilityLabel={t('home.streak.pill', { count: data.streak })}
              onPress={() => setStreakOpen(true)}
              style={styles.glassPill}>
              <Icon name="flame" size={size.icon.sm} color={color.game.orange} />
              <Text variant="bodyStrong">{t('home.streak.pill', { count: data.streak })}</Text>
            </PressableScale>
            <PressableScale
              testID="home.settings"
              accessibilityRole="button"
              accessibilityLabel={t('home.settings')}
              onPress={() => router.push('/settings')}
              style={styles.glassRound}>
              <Icon name="settings" size={size.icon.md} color={color.text.primary} />
            </PressableScale>
          </View>

          {data.loaded && data.blockingOff ? (
            <Banner
              testID="home.blockingOff"
              tone="danger"
              title={t('home.banner.off')}
              actionLabel={t('home.banner.turnOn')}
              onPress={() => void blocker.openAccessibilitySettings().then(data.refresh)}
            />
          ) : null}
          {data.loaded && !data.blockingOff && data.batteryRestricted && !batteryHidden ? (
            <Banner
              testID="home.battery"
              title={t('home.banner.battery')}
              actionLabel={t('home.banner.fix')}
              onPress={() => {
                batterySnoozedAt = Date.now();
                setBatteryHidden(true);
                void blocker.openBatteryOptimizationSettings();
              }}
            />
          ) : null}

          <Card
            testID="home.screenTime"
            style={styles.glassCard}
            onPress={() => router.push('/screen-time')}
            accessibilityLabel={t('home.screen.a11y', { time: formatDuration(screenMs / 60_000) })}>
            <Text variant="body" tone="secondary">
              {t('home.screen.title')}
            </Text>
            <View style={styles.bigRow}>
              <Text variant="statLg">{formatDuration(screenMs / 60_000)}</Text>
              {delta !== null && Math.abs(delta) >= 60_000 ? (
                <View style={[styles.deltaPill, delta < 0 ? styles.deltaGood : null]}>
                  <Text variant="caption" tone={delta < 0 ? 'success' : 'secondary'}>
                    {delta < 0
                      ? t('home.screen.less', { time: formatDuration(-delta / 60_000) })
                      : t('home.screen.more', { time: formatDuration(delta / 60_000) })}
                  </Text>
                </View>
              ) : null}
            </View>
            {data.usualScreenMs === null && data.hasUsage ? (
              <Text variant="caption" tone="tertiary">
                {t('home.screen.firstDays')}
              </Text>
            ) : null}
            <View style={styles.bar}>
              <View style={[styles.barBlocked, { flex: Math.max(0.001, data.blockedMs) }]} />
              <View style={[styles.barOther, { flex: Math.max(0.001, otherMs) }]} />
            </View>
            <View style={styles.legend}>
              <View style={[styles.dot, styles.dotRed]} />
              <Text variant="caption" tone="secondary">
                {t('home.screen.blocked', { time: formatDuration(data.blockedMs / 60_000) })}
              </Text>
              <View style={styles.dot} />
              <Text variant="caption" tone="secondary">
                {t('home.screen.other')}
              </Text>
            </View>
            {!data.hasUsage && data.loaded ? (
              <PressableScale
                testID="home.usageAccess"
                accessibilityRole="button"
                accessibilityLabel={t('home.screen.allowUsage')}
                onPress={() => void blocker.openUsageAccessSettings().then(data.refresh)}
                style={styles.usageRow}>
                <Text variant="bodyStrong" tone="violet">
                  {t('home.screen.allowUsage')}
                </Text>
              </PressableScale>
            ) : null}
          </Card>

          <View style={styles.sectionHead}>
            <Text variant="heading">{t('home.training.title')}</Text>
            <Text variant="caption" tone="secondary">
              {playedCount >= training.length
                ? t('home.training.done', { count: training.length })
                : t('home.training.meta', {
                    played: playedCount,
                    total: training.length,
                    minutes: aboutMinutes(metas.map((m) => m.seconds)),
                  })}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + space.md}
          decelerationRate="fast"
          onMomentumScrollEnd={onCarousel}
          contentContainerStyle={styles.carousel}>
          {metas.map((m) => {
            const done = data.played.has(m.id);
            return (
              <View
                key={m.id}
                style={[styles.trainCard, { width: Math.min(CARD_W, width - space['3xl'] * 2) }]}
                testID={`home.training.${m.id}`}>
                <View style={styles.trainTop}>
                  <GameIcon color={color.game[m.accent]} size={size.appIcon.lg} />
                  <View style={styles.flex}>
                    <Text variant="heading" numberOfLines={1}>
                      {t(`games.list.${m.id}.name`)}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {done
                        ? t('home.training.doneCard')
                        : t('games.meta', {
                            group: t(`games.groups.${m.group}`),
                            length: t(`games.list.${m.id}.length`),
                          })}
                    </Text>
                  </View>
                </View>
                <Button
                  testID={`home.training.${m.id}.play`}
                  icon="play"
                  variant={done ? 'secondary' : 'primary'}
                  label={t(done ? 'home.training.again' : 'home.training.play')}
                  onPress={() =>
                    router.push({
                      pathname: '/game/[gameId]',
                      params: { gameId: m.id as GameId, source: 'training' },
                    })
                  }
                />
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.dots}>
          <ProgressDots count={metas.length} index={Math.min(page, metas.length - 1)} />
        </View>

        <View style={styles.pad}>
          {!isPro && endedAt ? (
            <Card onPress={() => router.push('/paywall')} testID="home.trialEnded">
              <Text variant="bodyStrong">{t('home.trialEnded.title')}</Text>
              <Text variant="caption" tone="violet">
                {t('home.trialEnded.cta')}
              </Text>
            </Card>
          ) : null}
          <Card testID="home.blocked" style={styles.blockedCard}>
            <View style={styles.cardHead}>
              <Text variant="heading" style={styles.flex}>
                {t('home.blocked.title')}
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('home.blocked.edit')}
                onPress={() => router.push('/block')}
                style={styles.edit}>
                <Text variant="bodyStrong" tone="secondary">
                  {t('home.blocked.edit')}
                </Text>
              </PressableScale>
            </View>
            {locks.length === 0 ? (
              <PressableScale
                testID="home.blocked.empty"
                accessibilityRole="button"
                accessibilityLabel={`${t('locks.tab.emptyTitle')}, ${t('locks.tab.emptyAction')}`}
                onPress={() => router.push('/lock/new?kind=app')}
                style={styles.emptyRow}>
                <Text variant="body" tone="secondary" style={styles.flex}>
                  {t('locks.tab.emptyTitle')}
                </Text>
                <Text variant="bodyStrong" tone="violet">
                  {t('locks.tab.emptyAction')}
                </Text>
              </PressableScale>
            ) : (
              <>
                <Text variant="caption" tone={overCount ? 'danger' : 'secondary'}>
                  {blockedLine}
                </Text>
                <View style={styles.chips}>
                  {locks.slice(0, BLOCKED_SHOWN).map((l) => {
                    const c = data.counters[targetKey(l.target)];
                    return (
                      <LockChip
                        key={l.id}
                        lock={l}
                        counters={c}
                        blocked={l.enabled && !!c && isOverLimit(l, c)}
                      />
                    );
                  })}
                  <PressableScale
                    testID="home.blocked.add"
                    accessibilityRole="button"
                    accessibilityLabel={t('home.blocked.add')}
                    onPress={() => openNewLock(isPro, locks.length)}
                    style={styles.addTile}>
                    <Icon name="plus" size={size.icon.md} color={color.text.primary} />
                    <Text variant="caption" tone="secondary">
                      {t('home.blocked.add')}
                    </Text>
                  </PressableScale>
                </View>
              </>
            )}
          </Card>
          <View style={styles.clearance} />
        </View>
      </ScrollView>

      <Sheet
        visible={streakOpen}
        onClose={() => setStreakOpen(false)}
        testID="home.streakSheet"
        title={t('home.streak.title', { count: data.streak })}
        body={t('home.streak.body', { goal })}
        actions={
          <Button
            label={t('home.streak.cta')}
            onPress={() => {
              setStreakOpen(false);
              const next = training.find((id) => !data.played.has(id)) ?? training[0];
              if (next)
                router.push({
                  pathname: '/game/[gameId]',
                  params: { gameId: next, source: 'training' },
                });
            }}
          />
        }>
        <View style={styles.week}>
          {week.map((d) => {
            const met = dayMeetsGoal(data.activity[d], goal);
            return (
              <View key={d} style={styles.weekDay}>
                <Text variant="caption" tone="secondary">
                  {new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
                <View style={[styles.weekDot, met ? styles.weekDotOn : null]}>
                  {met ? (
                    <Icon name="check" size={size.icon.xs} color={color.text.onLight} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}

const DOT = 8;
const WEEK_DOT = 30;
const ADD_TILE = 48;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: space.lg },
  sky: { position: 'absolute', top: 0, left: 0, right: 0 },
  pad: { paddingHorizontal: layout.gutterTab, gap: space.lg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    marginBottom: space['2xl'],
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: size.touch - space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
  },
  glassRound: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: { gap: space.sm },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  deltaPill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    backgroundColor: color.surface.control,
  },
  deltaGood: { backgroundColor: color.signal.successSoft },
  bar: { flexDirection: 'row', height: DOT, gap: 3, marginTop: space.sm },
  barBlocked: { borderRadius: radius.pill, backgroundColor: color.signal.danger },
  barOther: { borderRadius: radius.pill, backgroundColor: color.surface.controlStrong },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
    marginLeft: space.sm,
  },
  dotRed: { backgroundColor: color.signal.danger, marginLeft: 0 },
  usageRow: { minHeight: size.touch, justifyContent: 'center' },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: space.md,
  },
  carousel: { paddingHorizontal: layout.gutterTab, gap: space.md, paddingVertical: space.md },
  trainCard: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: size.hairline,
    borderColor: color.surface.line,
  },
  trainTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dots: { marginBottom: space.lg },
  blockedCard: { gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  edit: { minHeight: size.touch, justifyContent: 'center', paddingHorizontal: space.xs },
  emptyRow: { flexDirection: 'row', alignItems: 'center', minHeight: size.touch, gap: space.md },
  chips: { flexDirection: 'row', gap: space.md, marginTop: space.sm, flexWrap: 'wrap' },
  addTile: {
    width: ADD_TILE,
    height: ADD_TILE + space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  clearance: { height: layout.tabBarClearance },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  weekDay: { alignItems: 'center', gap: space.xs },
  weekDot: {
    width: WEEK_DOT,
    height: WEEK_DOT,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.surface.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotOn: { backgroundColor: color.signal.success, borderColor: color.signal.success },
});
