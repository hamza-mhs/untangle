import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';

import { ToyKey } from './index';

/**
 * Shared word-game parts (BATCH-3.3c): letter wells (the word being built / guessed) and an
 * in-game letter keyboard (the system keyboard is slow and covers the board).
 */

export type WellState = 'empty' | 'filled' | 'active' | 'ok' | 'bad' | 'fixed';

const WELL_EDGE: Record<WellState, string> = {
  empty: color.surface.line,
  filled: color.surface.ring,
  active: color.text.primary,
  ok: color.signal.success,
  bad: color.signal.danger,
  fixed: color.signal.success,
};

/** A row of letter wells. `letters[i]` is '' for an empty well. */
export function LetterWells({
  letters,
  states,
  size,
  style,
  accessibilityLabel,
  testID,
}: {
  letters: readonly string[];
  /** Per well; defaults to 'filled' when a letter is set, else 'empty'. */
  states?: readonly WellState[];
  /** Edge length of one well (dp). */
  size: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={[styles.wells, style]}
      accessible={!!accessibilityLabel}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      {letters.map((ch, i) => {
        const st = states?.[i] ?? (ch ? 'filled' : 'empty');
        return (
          <View
            key={i}
            style={[
              styles.well,
              {
                width: size,
                height: size,
                borderColor: WELL_EDGE[st],
                backgroundColor:
                  st === 'ok' || st === 'fixed'
                    ? color.signal.successSoft
                    : st === 'bad'
                      ? color.signal.dangerSoft
                      : color.surface.card,
              },
            ]}>
            <Text variant={size >= 44 ? 'statMd' : 'bodyStrong'}>{ch.toUpperCase()}</Text>
          </View>
        );
      })}
    </View>
  );
}

export type KeyState = 'idle' | 'used' | 'hit' | 'miss';

/**
 * Letter keys (Toy plastic, in the game colour). `used` / `miss` keys go dark and are
 * disabled so a letter is never pressed twice by mistake; `hit` keys light up.
 */
export function LetterKeys({
  letters,
  tint,
  states,
  onPress,
  perRow,
  keyWidth,
  keyHeight,
  testIDPrefix,
  style,
}: {
  letters: readonly string[];
  tint: string;
  states?: readonly KeyState[];
  onPress: (i: number) => void;
  /** Keys per row (rows wrap and centre). */
  perRow: number;
  keyWidth: number;
  keyHeight: number;
  testIDPrefix?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const rows: number[][] = [];
  letters.forEach((_, i) => {
    if (i % perRow === 0) rows.push([]);
    rows.at(-1)!.push(i);
  });
  return (
    <View style={[styles.keys, style]}>
      {rows.map((row, r) => (
        <View key={r} style={styles.keyRow}>
          {row.map((i) => {
            const st = states?.[i] ?? 'idle';
            const dark = st === 'used' || st === 'miss';
            return (
              <ToyKey
                key={i}
                {...(testIDPrefix ? { testID: `${testIDPrefix}${i}` } : {})}
                tint={
                  st === 'hit' ? color.signal.success : dark ? color.surface.controlStrong : tint
                }
                accessibilityLabel={letters[i]!.toUpperCase()}
                disabled={dark}
                onPress={() => onPress(i)}
                style={[{ width: keyWidth, height: keyHeight }, dark ? styles.dark : null]}>
                <Text variant="statMd" tone={dark ? 'tertiary' : 'onLight'}>
                  {letters[i]!.toUpperCase()}
                </Text>
              </ToyKey>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Key width for `perRow` keys across `width` with the standard gap. */
export function keyWidthFor(width: number, perRow: number): number {
  return Math.floor((width - space.sm * (perRow - 1)) / perRow);
}

const styles = StyleSheet.create({
  wells: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  well: {
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keys: { gap: space.sm, alignItems: 'center' },
  keyRow: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  dark: { opacity: 0.6 },
});
