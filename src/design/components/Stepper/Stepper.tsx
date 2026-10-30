import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { color, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** What the number is (e.g. the daily goal), for TalkBack. */
  accessibilityLabel: string;
  testID?: string;
};

/** − value + (prototype `.stepper`). TalkBack: one adjustable control. */
export function Stepper({ value, onChange, min, max, accessibilityLabel, testID }: StepperProps) {
  const t = useT();
  const step = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next !== value) {
      haptics.select();
      onChange(next);
    }
  };
  const slop = (size.touch - size.stepperButton) / 2;
  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <PressableScale
        testID={testID ? `${testID}.minus` : undefined}
        accessibilityLabel={t('common.decrease')}
        disabled={value <= min}
        hitSlop={slop}
        onPress={() => step(-1)}
        style={[styles.btn, value <= min ? styles.off : null]}>
        <Icon name="minus" size={size.icon.sm} color={color.text.primary} />
      </PressableScale>
      <Text variant="bodyStrong" style={styles.value}>
        {value}
      </Text>
      <PressableScale
        testID={testID ? `${testID}.plus` : undefined}
        accessibilityLabel={t('common.increase')}
        disabled={value >= max}
        hitSlop={slop}
        onPress={() => step(1)}
        style={[styles.btn, value >= max ? styles.off : null]}>
        <Icon name="plus" size={size.icon.sm} color={color.text.primary} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  btn: {
    width: size.stepperButton,
    height: size.stepperButton,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  value: { minWidth: space.lg, textAlign: 'center' },
});
