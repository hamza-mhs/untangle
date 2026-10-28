import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/design/components';
import { color, pill, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import { PAIR_SHAPES } from './PairsGame';

/** The still pictures on each GameIntro card (decorative; hidden from screen readers). */

export function MathsPreview() {
  const t = useT();
  return (
    <View style={styles.center}>
      <Text variant="display.op" tone="accent">
        × 2
      </Text>
      <Text variant="title.s">{t('reps.maths.op.double')}</Text>
    </View>
  );
}

export function LetterPreview() {
  const letters = ['', 'U', 'I', 'E', ''];
  return (
    <View style={styles.center}>
      <View style={styles.row}>
        {letters.map((l, i) => (
          <View key={i} style={[styles.slot, l !== '' && styles.slotWord]}>
            <Text variant="title.s" tone="ink">
              {l}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.row, styles.gapTop]}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.dot, i < 4 && styles.dotWord]} />
        ))}
      </View>
    </View>
  );
}

export function TargetPreview() {
  return (
    <View style={styles.center}>
      <View style={styles.target}>
        <Text variant="title.l" tone="ink">
          24
        </Text>
      </View>
      <View style={[styles.row, styles.gapTop]}>
        {[6, 4, 2, 3].map((n) => (
          <View key={n} style={styles.chip}>
            <Text variant="body.l.strong" tone="ink">
              {n}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PairsPreview() {
  const open = new Set([1, 6]);
  return (
    <View style={[styles.center, styles.grid]}>
      {[0, 1].map((r) => (
        <View key={r} style={styles.row}>
          {[0, 1, 2, 3].map((c) => {
            const i = r * 4 + c;
            return (
              <View key={c} style={[styles.card, open.has(i) && styles.cardOpen]}>
                <Icon
                  name={open.has(i) ? PAIR_SHAPES[2]! : 'shapeSquare'}
                  size={size.icon.lg}
                  color={open.has(i) ? color.ink : color.border.subtle}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function SpanPreview() {
  return (
    <View style={styles.center}>
      <View style={styles.spanTile}>
        <Text variant="display.xl" tone="ink">
          8
        </Text>
      </View>
      <View style={[styles.row, styles.gapTop]}>
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i < 3 && styles.dotDone, i === 3 && styles.dotMemory]}
          />
        ))}
      </View>
    </View>
  );
}

const SMALL = size.lifeDot / 2;

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: space.sm + 2 },
  gapTop: { marginTop: space.xl },
  grid: { gap: space.sm },
  slot: {
    width: size.letterSlot.width * 0.75,
    height: size.letterSlot.height * 0.67,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotWord: { backgroundColor: color.game.word },
  dot: { width: SMALL, height: SMALL, ...pill(SMALL), backgroundColor: color.bg.raisedHigh },
  dotWord: { backgroundColor: color.game.word },
  dotDone: { backgroundColor: color.text.primary },
  dotMemory: { backgroundColor: color.game.memory },
  target: {
    width: size.targetCircle * 0.6,
    height: size.targetCircle * 0.6,
    ...pill(size.targetCircle * 0.6),
    backgroundColor: color.game.number,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    width: size.numberChip * 0.5,
    height: size.numberChip * 0.5,
    ...pill(size.numberChip * 0.5),
    backgroundColor: color.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: size.pairCard.width * 0.55,
    height: size.pairCard.height * 0.55,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOpen: { backgroundColor: color.game.memory },
  spanTile: {
    width: size.watchTile * 0.45,
    height: size.watchTile * 0.5,
    ...rounded(radius.l),
    backgroundColor: color.game.memory,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
