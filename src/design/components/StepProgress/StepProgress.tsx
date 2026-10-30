import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, radius, size } from '../../tokens';

export type StepProgressProps = {
  /** Number of segments (onboarding: 5 chapters). */
  total: number;
  /** Segments filled (white). */
  done: number;
  testID?: string;
};

/** Onboarding progress bar: one 3 dp segment per chapter (prototype `.seg`). */
export function StepProgress({ total, done, testID }: StepProgressProps) {
  const t = useT();
  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.progress', { done, total })}
      accessibilityValue={{ min: 0, max: total, now: done }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.seg, i < done ? styles.filled : null]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', gap: size.progress.gap },
  seg: { flex: 1, height: size.progress.height, borderRadius: radius.pill, backgroundColor: color.surface.track },
  filled: { backgroundColor: color.text.primary },
});
