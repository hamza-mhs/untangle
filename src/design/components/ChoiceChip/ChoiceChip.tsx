import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { color, pill, size, space, type MoodColor } from '../../tokens';
import { useSelection } from '../ChoiceRow';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: MoodColor;
  testID?: string;
};

/** Selection chip for 2-column grids (onboarding 03): 50 pt, check 18 pt when selected. */
export function ChoiceChip({ label, selected, onPress, accent, testID }: ChoiceChipProps) {
  const { bg, fg, check } = useSelection(selected, accent);
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.cell}>
      <Animated.View style={[styles.chip, bg]}>
        <Text
          variant="label.chip"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={[styles.label, fg]}>
          {label}
        </Text>
        <Animated.View style={check}>
          <Icon name="check" size={size.icon.sm} color={color.text.onAccent} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cell: { flexBasis: '48%', flexGrow: 1 },
  chip: {
    height: size.chip,
    ...pill(size.chip),
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  label: { flex: 1 },
});
