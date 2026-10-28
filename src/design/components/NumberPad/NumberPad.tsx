import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, pill, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type NumberPadProps = {
  onDigit: (d: number) => void;
  onBack: () => void;
  onSubmit?: () => void;
  submitEnabled?: boolean;
  /** Greyed digits (e.g. not allowed). */
  disabledDigits?: readonly number[];
  testID?: string;
};

const ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
] as const;

/**
 * 3×4 game keypad (pack 2 SPEC §2): 52 pt keys on raisedHigh, back on the left of 0, a green
 * submit on the right. Never the system keyboard in games. No haptic per keystroke.
 */
export function NumberPad({ onDigit, onBack, onSubmit, submitEnabled = true, disabledDigits = [], testID }: NumberPadProps) {
  const t = useT();
  const key = (d: number) => (
    <PressableScale
      key={d}
      testID={testID ? `${testID}.${d}` : undefined}
      accessibilityRole="button"
      accessibilityLabel={String(d)}
      disabled={disabledDigits.includes(d)}
      onPress={() => onDigit(d)}
      style={[styles.key, styles.digit, disabledDigits.includes(d) && styles.disabled]}>
      <Text variant="headline">{d}</Text>
    </PressableScale>
  );
  return (
    <View style={styles.grid} testID={testID}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(key)}
        </View>
      ))}
      <View style={styles.row}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('reps.pad.back')}
          onPress={onBack}
          style={styles.key}>
          <Icon name="backspace" size={size.icon.lg} color={color.text.primary} />
        </PressableScale>
        {key(0)}
        {onSubmit ? (
          <PressableScale
            testID={testID ? `${testID}.submit` : undefined}
            accessibilityRole="button"
            accessibilityLabel={t('reps.pad.submit')}
            accessibilityState={{ disabled: !submitEnabled }}
            disabled={!submitEnabled}
            onPress={() => {
              haptics.tap();
              onSubmit();
            }}
            style={[styles.key, styles.submit, !submitEnabled && styles.disabled]}>
            <Icon name="check" size={size.icon.lg} color={color.text.onAccent} />
          </PressableScale>
        ) : (
          <View style={styles.key} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  key: {
    flex: 1,
    height: size.gameKey,
    ...pill(size.gameKey),
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { backgroundColor: color.bg.raised },
  submit: { backgroundColor: color.status.success },
  disabled: { opacity: 0.35 },
});
