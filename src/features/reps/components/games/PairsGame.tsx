import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName, PressableScale, Text } from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { createRng } from '../../rng';
import { useGameDelay } from '../../useGameDelay';
import type { GameProps } from '../gameTypes';

export const PAIR_COUNT = 8;
const MISMATCH_MS = 700;
const COLUMNS = 4;

/** Simple shapes only (image-based games were dropped on purpose). */
export const PAIR_SHAPES: readonly IconName[] = [
  'shapeCircle',
  'shapeTriangle',
  'shapeStar',
  'shapeHeart',
  'shapeDiamond',
  'shapeHexagon',
  'shapeCloud',
  'plus',
];

/** Seconds on the clock at each level (the R6 "Next time" line). */
export function pairsSecondsFor(level: number): number {
  return [180, 150, 120][Math.min(3, Math.max(1, level)) - 1]!;
}

/** GPairs2: a 4×4 grid; flip two at a time, matched pairs go grey and stay put. */
export function PairsGame({ seed, running, onWin, report }: GameProps) {
  const t = useT();
  const [deck] = useState(() =>
    createRng(seed).shuffle([...PAIR_SHAPES.keys(), ...PAIR_SHAPES.keys()]),
  );
  const [open, setOpen] = useState<readonly number[]>([]);
  const [matched, setMatched] = useState<readonly number[]>([]);
  const [flips, setFlips] = useState(0);
  const pairs = matched.length / 2;
  const mismatch = open.length === 2 && deck[open[0]!] !== deck[open[1]!];

  useEffect(() => {
    report({ line: t('reps.pairs.timeUp', { found: pairs, total: PAIR_COUNT }) });
  }, [pairs, report, t]);

  useGameDelay(running, mismatch ? MISMATCH_MS : null, () => setOpen([]), flips);

  const flip = (i: number) => {
    if (!running || open.includes(i) || matched.includes(i) || open.length === 2) return;
    haptics.select();
    const nextFlips = flips + 1;
    setFlips(nextFlips);
    if (open.length === 0) {
      setOpen([i]);
      return;
    }
    const first = open[0]!;
    if (deck[first] === deck[i]) {
      const next = [...matched, first, i];
      setMatched(next);
      setOpen([]);
      if (next.length === deck.length)
        onWin(t('reps.pairs.won', { total: PAIR_COUNT, flips: nextFlips }));
    } else {
      setOpen([first, i]);
    }
  };

  const rows = Array.from({ length: deck.length / COLUMNS }, (_, r) =>
    deck.slice(r * COLUMNS, r * COLUMNS + COLUMNS),
  );
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="body.l" tone="muted">
          {t('reps.pairs.count', { found: pairs, total: PAIR_COUNT })}
        </Text>
        <Text variant="body.l" tone="muted">
          {t('reps.pairs.flips', { count: flips })}
        </Text>
      </View>
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((shape, c) => {
              const i = r * COLUMNS + c;
              const isMatched = matched.includes(i);
              const isOpen = open.includes(i);
              const face = isMatched || isOpen;
              return (
                <PressableScale
                  key={i}
                  testID={`pairs.card.${i}`}
                  accessibilityRole="button"
                  accessibilityLabel={
                    face
                      ? t(`reps.pairs.shape.${PAIR_SHAPES[shape]}`)
                      : t('reps.pairs.faceDownA11y', { n: i + 1 })
                  }
                  accessibilityState={{ disabled: isMatched }}
                  onPress={() => flip(i)}
                  style={[
                    styles.card,
                    isOpen && !isMatched
                      ? styles.cardOpen
                      : isMatched
                        ? styles.cardMatched
                        : styles.cardDown,
                  ]}>
                  <Icon
                    name={face ? PAIR_SHAPES[shape]! : 'shapeSquare'}
                    size={size.challengeCard.icon + space.md}
                    color={
                      isOpen && !isMatched
                        ? color.ink
                        : isMatched
                          ? color.text.faint
                          : color.border.subtle
                    }
                  />
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
      <Text variant="body" tone="muted" align="center" style={styles.foot}>
        {t('reps.pairs.foot')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: layout.onboarding.optionsX - space.sm },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX + space.sm,
  },
  grid: { gap: space.sm, marginTop: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  card: {
    flex: 1,
    aspectRatio: size.pairCard.width / size.pairCard.height,
    ...rounded(radius.l),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDown: { backgroundColor: color.bg.surface },
  cardOpen: { backgroundColor: color.game.memory },
  cardMatched: { backgroundColor: color.bg.raised },
  foot: { marginTop: space.xl },
});
