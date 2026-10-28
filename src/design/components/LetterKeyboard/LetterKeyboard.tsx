import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, rounded, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type LetterState = 'unused' | 'hit' | 'miss';

export type LetterKeyboardProps = {
  states: Readonly<Record<string, LetterState>>;
  /** The letter picked but not yet guessed (raised high, ringed). */
  selected: string | null;
  onLetter: (letter: string) => void;
  /** ✓ guesses the selected letter; ‹ clears it. */
  onSubmit: () => void;
  onClear: () => void;
  disabled?: boolean;
  testID?: string;
};

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const;

/**
 * QWERTY for Letter guess (pack 2 SPEC §2): hit = green, miss = faded, used letters inert.
 * Pick a letter, then ✓ to guess it, so a stray tap never costs a life.
 */
export function LetterKeyboard({ states, selected, onLetter, onSubmit, onClear, disabled = false, testID }: LetterKeyboardProps) {
  const t = useT();
  const key = (letter: string) => {
    const state = states[letter] ?? 'unused';
    const isSelected = selected === letter;
    return (
      <PressableScale
        key={letter}
        testID={testID ? `${testID}.${letter}` : undefined}
        accessibilityRole="button"
        accessibilityLabel={letter}
        accessibilityState={{ disabled: disabled || state !== 'unused', selected: isSelected }}
        disabled={disabled || state !== 'unused'}
        onPress={() => onLetter(letter)}
        style={[styles.key, keyStyles[state], isSelected && styles.selected]}>
        <Text variant="body.l.strong" tone={state === 'hit' ? 'onAccent' : state === 'miss' ? 'faint' : 'primary'}>
          {letter}
        </Text>
      </PressableScale>
    );
  };
  return (
    <View style={styles.board} testID={testID}>
      <View style={styles.row}>{[...ROWS[0]].map(key)}</View>
      <View style={styles.row}>{[...ROWS[1]].map(key)}</View>
      <View style={styles.row}>
        <PressableScale
          testID={testID ? `${testID}.submit` : undefined}
          accessibilityRole="button"
          accessibilityLabel={t('reps.letter.guessA11y')}
          disabled={disabled || selected === null}
          onPress={onSubmit}
          style={[styles.key, styles.wide, keyStyles.unused, selected === null && styles.dim]}>
          <Icon name="check" size={size.icon.md} color={color.text.primary} />
        </PressableScale>
        {[...ROWS[2]].map(key)}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('reps.letter.clearA11y')}
          disabled={disabled || selected === null}
          onPress={onClear}
          style={[styles.key, styles.wide, keyStyles.unused, selected === null && styles.dim]}>
          <Icon name="chevronLeft" size={size.icon.md} color={color.text.primary} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.xs },
  key: {
    width: size.letterKey.width,
    height: size.letterKey.height,
    ...rounded(size.appTile.xl.radius + 2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  wide: { width: size.wideLetterKey },
  selected: { backgroundColor: color.bg.raisedHigh, borderWidth: size.selectedRing, borderColor: color.text.primary },
  dim: { opacity: 0.5 },
});

const keyStyles = StyleSheet.create({
  unused: { backgroundColor: color.bg.raised },
  hit: { backgroundColor: color.mood.green },
  miss: { backgroundColor: color.bg.surface },
});
