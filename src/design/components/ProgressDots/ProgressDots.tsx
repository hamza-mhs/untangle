import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, radius, size } from '../../tokens';

export type ProgressDotsProps = { count: number; index: number; testID?: string };

/** Carousel dots: the active one stretches to a pill (prototype `.cdots`). */
export function ProgressDots({ count, index, testID }: ProgressDotsProps) {
  const t = useT();
  return (
    <View
      testID={testID}
      style={styles.row}
      accessible
      accessibilityLabel={t('common.pageOf', { page: index + 1, total: count })}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === index ? styles.on : null]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: size.dot.size, height: size.dot.size, borderRadius: radius.pill, backgroundColor: color.surface.track },
  on: { width: size.dot.active, backgroundColor: color.text.primary },
});
