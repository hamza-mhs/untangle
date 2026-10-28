import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChallengeCard, Chip, PrimaryButton, Text } from '@/design/components';
import { color, layout, radius, rounded, space } from '@/design/tokens';
import {
  ALL_THREE_BONUS,
  BOSS_POINTS,
  bossForWeek,
  isFullyFlipped,
  POINTS,
} from '@/features/challenges/rules';
import { challengeById } from '@/features/challenges/library';
import {
  CHECK_OF,
  challengeDetail,
  challengeTitle,
  DIFFICULTY_OF,
} from '@/features/challenges/present';
import { useChallengesStore } from '@/features/challenges/store';
import { useT } from '@/i18n';
import { formatClock } from '@/lib/format';
import { haptics } from '@/lib/haptics';

const S = layout.screen;
const FLIP_STAGGER_MS = 120;
const SLOTS = [0, 1, 2] as const;

/**
 * FDraw → FDrawReveal (`challenges/draw`). Tap a card to flip it, or flip all three 120 ms apart.
 * After the flip: pick a card, redraw one (once a day), see the boss, start with the selected one.
 */
export default function Draw() {
  const t = useT();
  const [now] = useState(() => Date.now());
  // Create today's draw once (idempotent), then follow the store.
  const [initial] = useState(() => useChallengesStore.getState().ensureToday(now));
  const draw = useChallengesStore((s) => s.draw) ?? initial;
  const flipCard = useChallengesStore((s) => s.flipCard);
  const redraw = useChallengesStore((s) => s.redraw);
  const [selected, setSelected] = useState<0 | 1 | 2>(0);
  const [isPickingRedraw, setIsPickingRedraw] = useState(false);
  const revealed = isFullyFlipped(draw);
  const boss = bossForWeek(now);

  const flipAll = () => {
    SLOTS.forEach((slot, i) => setTimeout(() => flipCard(slot), i * FLIP_STAGGER_MS));
  };

  const handleCard = (slot: 0 | 1 | 2) => {
    if (!draw.flipped[slot]) {
      flipCard(slot);
      return;
    }
    if (isPickingRedraw) {
      haptics.select();
      redraw(slot);
      setIsPickingRedraw(false);
      return;
    }
    haptics.select();
    setSelected(slot);
  };

  const first = challengeById(draw.cards[selected]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title.page" accessibilityRole="header">
          {t(revealed ? 'challenges.draw.revealTitle' : 'challenges.draw.title')}
        </Text>
        <Text variant="label" tone="muted" style={styles.sub}>
          {revealed
            ? t('challenges.draw.revealSub', {
                time: formatClock(draw.drawnAt ?? now),
                points: ALL_THREE_BONUS,
              })
            : t('challenges.draw.sub')}
        </Text>
        <View style={styles.cards}>
          {SLOTS.map((slot) => {
            const def = challengeById(draw.cards[slot]);
            if (!def) return null;
            const isDone = draw.done.includes(def.id);
            return (
              <ChallengeCard
                key={`${slot}-${def.id}`}
                testID={`draw.card.${slot}`}
                difficulty={DIFFICULTY_OF[def.difficulty]}
                icon={def.icon}
                title={challengeTitle(def)}
                meta={challengeDetail(def)}
                check={CHECK_OF[def.verification]}
                points={POINTS[def.difficulty]}
                state={
                  !draw.flipped[slot]
                    ? 'faceDown'
                    : isDone
                      ? 'done'
                      : revealed && slot === selected && !isPickingRedraw
                        ? 'selected'
                        : 'faceUp'
                }
                onPress={() => handleCard(slot)}
              />
            );
          })}
        </View>
        {revealed ? (
          <>
            <View style={styles.chips}>
              <Chip
                testID="draw.redraw"
                label={
                  draw.redrawsLeft > 0
                    ? isPickingRedraw
                      ? t('challenges.draw.pickToRedraw')
                      : t('challenges.draw.redraw', { count: draw.redrawsLeft })
                    : t('challenges.draw.noRedraws')
                }
                surface="canvas"
                fill
                selected={isPickingRedraw}
                onPress={() => draw.redrawsLeft > 0 && setIsPickingRedraw((p) => !p)}
              />
              <Chip
                testID="draw.howPoints"
                label={t('challenges.draw.howPoints')}
                surface="canvas"
                fill
                selected={false}
                onPress={() => router.push('/challenges/points')}
              />
            </View>
            <Text variant="label" tone="muted" style={styles.label}>
              {t('challenges.draw.bossLabel')}
            </Text>
            <View style={styles.boss} accessible>
              <Text variant="micro" tone="onAccent">
                {t('challenges.draw.bossOverline', {
                  day: t(`rules.weekday.${boss.weekday}`),
                })}
              </Text>
              <Text variant="headline" tone="onAccent">
                {t(`challenges.bosses.${boss.id}.title`)}
              </Text>
              <Text variant="meta" tone="onAccent">
                {t(`challenges.bosses.${boss.id}.sub`, { points: BOSS_POINTS })}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text variant="body" tone="secondary" align="center" style={styles.hint}>
              {t('challenges.draw.tapHint')}
            </Text>
            <View style={styles.legend}>
              <Text variant="body.s" tone="muted">
                {t('challenges.draw.legendLead')}
                <Text variant="body.s" tone="success">
                  {t('challenges.check.verifiedShort')}
                </Text>
                {t('challenges.draw.legendVerified')}
                <Text variant="body.s" tone="accent">
                  {t('challenges.check.timedShort')}
                </Text>
                {t('challenges.draw.legendTimed')}
                <Text variant="body.s" tone="sky">
                  {t('challenges.check.yourWordShort')}
                </Text>
                {t('challenges.draw.legendWord')}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {revealed ? (
          <PrimaryButton
            testID="draw.start"
            label={t('challenges.draw.startWith', {
              title: first ? challengeTitle(first).toLowerCase() : '',
            })}
            compact
            onPress={() =>
              first && router.replace({ pathname: '/challenge/[id]', params: { id: first.id } })
            }
          />
        ) : (
          <>
            <PrimaryButton
              testID="draw.flipAll"
              label={t('challenges.draw.flipAll')}
              compact
              onPress={flipAll}
            />
            <Text variant="meta" tone="muted" align="center">
              {t('challenges.draw.freeRedraw', { count: draw.redrawsLeft })}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: S.x, paddingTop: S.top, paddingBottom: space.xl },
  sub: { marginTop: space.sm },
  cards: { flexDirection: 'row', gap: space.md + 2, marginTop: space.xxl + 6 },
  hint: { marginTop: space.xxl },
  legend: {
    marginTop: space.xxl,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
  },
  chips: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  label: { marginTop: space.xxl + 6, marginBottom: space.sm, paddingHorizontal: S.labelX - S.x },
  boss: {
    ...rounded(radius.l),
    backgroundColor: color.accent.primary,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg + 2,
    gap: space.xxs,
  },
  footer: {
    gap: space.sm,
    paddingHorizontal: S.x,
    paddingBottom: layout.onboarding.footerBottom,
  },
});
