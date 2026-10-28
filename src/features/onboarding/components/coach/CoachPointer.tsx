import { StyleSheet, View } from 'react-native';

import { Text } from '@/design/components';
import { color, layout, pill } from '@/design/tokens';

const C = layout.coach;

/** Yellow arrow + pill ("Tap this one") pointing up at the control to tap. */
export function CoachPointer({ label }: { label: string }) {
  return (
    <View
      style={styles.root}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden>
      <View style={styles.arrow} />
      <View style={styles.pill}>
        <Text variant="label.bold" tone="onAccent" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: C.pointerGap },
  // CSS border triangle: transparent sides, coloured bottom.
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: C.arrowHalf,
    borderRightWidth: C.arrowHalf,
    borderBottomWidth: C.arrowHeight,
    borderLeftColor: color.bg.transparent,
    borderRightColor: color.bg.transparent,
    borderBottomColor: color.accent.primary,
  },
  pill: {
    height: C.pillHeight,
    ...pill(C.pillHeight),
    paddingHorizontal: C.pillPaddingX,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
});
