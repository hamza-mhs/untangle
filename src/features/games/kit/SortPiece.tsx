import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';

import type { SortColour, SortPiece as Piece, SortRule, SortShape } from './sortRules';

export const SORT_TINT: Record<SortColour, string> = {
  pink: color.game.pink,
  blue: color.game.sky,
};

/** A sorting piece: a pink or blue circle or square (prototype `.rcard.c` / `.rcard.s`). */
export function SortPiece({ piece, size }: { piece: Piece; size: number }) {
  return (
    <View
      style={[
        styles.piece,
        {
          width: size,
          height: size,
          backgroundColor: SORT_TINT[piece.colour],
          borderRadius: piece.shape === 'circle' ? size / 2 : radius['2xl'],
        },
      ]}
    />
  );
}

/** What a bin shows for a rule: a colour dot or a white shape, plus its name. */
export function binKind(rule: SortRule, side: 0 | 1): SortColour | SortShape {
  if (rule === 'colour') return side === 0 ? 'pink' : 'blue';
  return side === 0 ? 'circle' : 'square';
}

/** Recessed bin you tap to send the piece to that side. */
export function SortBin({
  kind,
  label,
  state,
  onPress,
  testID,
}: {
  kind: SortColour | SortShape;
  label: string;
  state: 'idle' | 'good' | 'bad';
  onPress: () => void;
  testID?: string;
}) {
  const dot =
    kind === 'pink' || kind === 'blue'
      ? { backgroundColor: SORT_TINT[kind], borderRadius: radius.pill }
      : {
          backgroundColor: color.text.primary,
          borderRadius: kind === 'circle' ? radius.pill : radius.sm,
        };
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.bin,
        state === 'good' ? styles.good : null,
        state === 'bad' ? styles.bad : null,
      ]}>
      <View style={[styles.dot, dot]} />
      <Text variant="bodyStrong">{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  piece: { borderWidth: 3, borderColor: color.game.sun },
  bin: {
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
  },
  good: { borderColor: color.signal.success, backgroundColor: color.signal.successSoft },
  bad: { borderColor: color.signal.danger, backgroundColor: color.signal.dangerSoft },
  dot: { width: space['2xl'], height: space['2xl'] },
});
