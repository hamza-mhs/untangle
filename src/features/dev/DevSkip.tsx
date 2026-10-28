import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale, Text } from '@/design/components';
import { color, pill, size, space } from '@/design/tokens';

/**
 * DEV ONLY: a small "Skip" pill pinned to the top of screens that wait on a sensor, a timer, a
 * permission or a store, so every flow can be walked on an emulator. Renders nothing in release
 * builds. (Developer tooling: the label is not product copy, so it isn't in i18n.)
 */
export function DevSkip({ onSkip, label = 'DEV · Skip' }: { onSkip: () => void; label?: string }) {
  const insets = useSafeAreaInsets();
  if (!__DEV__) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.xs }]}>
      <PressableScale
        testID="dev.skip"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onSkip}
        style={styles.pill}>
        <Text variant="caption.strong" tone="onAccent">
          {label}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  pill: {
    height: size.startPill,
    ...pill(size.startPill),
    paddingHorizontal: space.md,
    justifyContent: 'center',
    backgroundColor: color.mood.orange,
  },
});
