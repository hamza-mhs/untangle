import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, PressableScale, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { REP_IDS, type RepId, REPS } from '@/features/reps/catalog';
import { gameBg } from '@/features/reps/gameColors';
import { useRepsStore } from '@/features/reps/repsStore';
import type { RoundRecord } from '@/features/reps/rules';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import { dayKey, isoWeekKey } from '@/lib/time';
import { ledgerTotals } from '@/storage/ledgerRepo';

import { challengeById, LIBRARY } from '../library';
import { challengeMeta, challengeTitle } from '../present';
import { isFullyFlipped, POINTS } from '../rules';
import { useChallengesStore } from '../store';

const S = layout.screen;
const NO_ROUNDS: Partial<Record<RepId, RoundRecord>> = {};

/**
 * FChallenges (`(tabs)/challenges`): Today's three (or "Draw today's three"), the six attention
 * reps, and the Library of longer challenges (✓ done this week, • not yet).
 */
export function ChallengesScreen() {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());
  const [verified, setVerified] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      const at = Date.now();
      setNow(at);
      useChallengesStore.getState().ensureToday(at);
      setVerified(ledgerTotals().verifiedPercent);
    }, []),
  );
  const draw = useChallengesStore((s) => s.draw);
  const libraryDone = useChallengesStore((s) => s.libraryDone);
  const points = useScoringStore((s) => s.points);
  const repsDay = useRepsStore((s) => s.day);
  const repsAll = useRepsStore((s) => s.today);
  // Yesterday's rounds don't count once the day has rolled over.
  const repsToday = repsDay === dayKey(now) ? repsAll : NO_ROUNDS;
  const week = isoWeekKey(now);
  const isDrawn = draw ? isFullyFlipped(draw) : false;
  const doneCount = draw?.done.length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="title.page" accessibilityRole="header">
            {t('challenges.tab.title')}
          </Text>
          <View style={styles.pill} accessible>
            <Text variant="caption.strong">
              {verified === null
                ? t('challenges.tab.points', { points })
                : t('challenges.tab.pointsVerified', { points, percent: verified })}
            </Text>
          </View>
        </View>

        <View style={styles.label}>
          <Text variant="label" tone="muted">
            {t('challenges.tab.today')}
          </Text>
          {isDrawn ? (
            <Text variant="label" tone="muted">
              {doneCount === 3
                ? t('challenges.tab.allDone', { bonus: 50 })
                : t('home.challenges.count', { done: doneCount, total: 3 })}
            </Text>
          ) : null}
        </View>
        <View style={styles.group}>
          {!isDrawn || !draw ? (
            <PressableScale
              testID="challenges.drawRow"
              accessibilityRole="button"
              accessibilityLabel={t('challenges.tab.drawRow')}
              onPress={() => router.push('/challenges/draw')}
              style={styles.row}>
              <View style={[styles.tile, styles.tileAccent]}>
                <Icon name="redraw" size={size.icon.xs} color={color.text.onAccent} />
              </View>
              <Text variant="body" style={styles.flex}>
                {t('challenges.tab.drawRow')}
              </Text>
              <Icon name="chevronRight" size={size.icon.sm} color={color.text.muted} />
            </PressableScale>
          ) : (
            draw.cards.map((id, i) => {
              const def = challengeById(id);
              if (!def) return null;
              const isDone = draw.done.includes(id);
              return (
                <PressableScale
                  key={id}
                  testID={`challenges.today.${id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${challengeTitle(def)}, ${challengeMeta(def)}${isDone ? `, ${t('challenges.tab.doneA11y')}` : ''}`}
                  disabled={isDone}
                  onPress={() => router.push({ pathname: '/challenge/[id]', params: { id } })}
                  style={[styles.row, i > 0 && styles.separator]}>
                  <View style={[styles.tile, isDone ? styles.tileDone : styles.tileAccent]}>
                    <Icon
                      name={isDone ? 'check' : def.icon}
                      size={size.icon.xs}
                      color={isDone ? color.text.muted : color.text.onAccent}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text
                      variant="body"
                      tone={isDone ? 'muted' : 'primary'}
                      style={isDone && styles.struck}>
                      {challengeTitle(def)}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {challengeMeta(def)}
                    </Text>
                  </View>
                  <Text variant="label.strong" tone={isDone ? 'muted' : 'accent'}>
                    {isDone ? '✓' : `+${POINTS[def.difficulty]}`}
                  </Text>
                </PressableScale>
              );
            })
          )}
        </View>

        <View style={styles.label}>
          <Text variant="label" tone="muted">
            {t('challenges.tab.reps')}
          </Text>
        </View>
        <View style={styles.grid}>
          {REP_IDS.map((id) => {
            const rep = REPS[id];
            const isDone = repsToday[id]?.won === true;
            return (
              <PressableScale
                key={id}
                testID={`challenges.rep.${id}`}
                accessibilityRole="button"
                accessibilityLabel={`${t(`reps.${id}.name`)}, ${t('challenges.tab.repDuration', {
                  duration: durationLabel(t, rep.durationSec),
                })}${isDone ? `, ${t('challenges.tab.doneA11y')}` : ''}`}
                onPress={() =>
                  router.push(
                    id === 'read' ? '/reading' : { pathname: '/reps/[game]', params: { game: id } },
                  )
                }
                style={styles.rep}>
                <View style={[styles.repIcon, gameBg[rep.color]]}>
                  <Icon name={rep.icon} size={size.icon.sm} color={color.text.onAccent} />
                </View>
                <View style={styles.flex}>
                  <Text variant="label.strong" numberOfLines={1}>
                    {t(`reps.${id}.name`)}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {isDone ? t('challenges.tab.repDone') : durationLabel(t, rep.durationSec)}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.label}>
          <Text variant="label" tone="muted">
            {t('challenges.tab.library')}
          </Text>
        </View>
        <View style={styles.chips}>
          {LIBRARY.map((def) => {
            const isDone = libraryDone.some((l) => l.id === def.id && l.week === week);
            return (
              <PressableScale
                key={def.id}
                testID={`challenges.library.${def.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${challengeTitle(def)}, ${t(isDone ? 'challenges.tab.doneThisWeek' : 'challenges.tab.notYet')}`}
                onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: def.id } })}
                style={styles.libChip}>
                <Text variant="label.strong">{challengeTitle(def)}</Text>
                <Text variant="caption" tone={isDone ? 'success' : 'muted'}>
                  {isDone ? '✓' : '•'}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function durationLabel(t: ReturnType<typeof useT>, seconds: number): string {
  return seconds < 120
    ? t('challenges.tab.seconds', { s: seconds })
    : t('challenges.tab.minutes', { m: Math.round(seconds / 60) });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: S.x, paddingTop: S.top, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    height: size.startPill,
    ...pill(size.startPill),
    paddingHorizontal: space.md + 1,
    justifyContent: 'center',
    backgroundColor: color.bg.raised,
  },
  label: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.sm,
    paddingHorizontal: S.labelX - S.x,
  },
  group: { ...rounded(radius.m), backgroundColor: color.bg.raised, overflow: 'hidden' },
  row: {
    height: size.suggestionRow,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  separator: { borderTopWidth: size.hairline, borderTopColor: color.border.hairline },
  tile: {
    width: size.iconTile,
    height: size.iconTile,
    ...rounded(size.appTile.m.radius),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileAccent: { backgroundColor: color.accent.primary },
  tileDone: { backgroundColor: color.border.control },
  flex: { flex: 1 },
  struck: { textDecorationLine: 'line-through' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  rep: {
    flexBasis: '48%',
    flexGrow: 1,
    height: size.repTile,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  repIcon: {
    width: size.repIcon,
    height: size.repIcon,
    ...rounded(size.appTile.xl.radius),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  libChip: {
    height: size.chipS - 4,
    ...pill(size.chipS - 4),
    paddingHorizontal: space.lg - 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.bg.raised,
  },
});
