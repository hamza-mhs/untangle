import { StyleSheet } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, pill, size } from '@/design/tokens';
import { haptics } from '@/lib/haptics';

/** OB12 no-sensor fallback: press and hold instead of turning the phone face-down. */
export function HoldButton({
  label,
  onHoldStart,
  onHoldEnd,
  testID,
}: {
  label: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  testID?: string;
}) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        haptics.tap();
        onHoldStart();
      }}
      onPressOut={onHoldEnd}
      style={styles.button}>
      <Text variant="body.l" tone="onAccent">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: size.button,
    ...pill(size.button),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.light.surface,
  },
});
