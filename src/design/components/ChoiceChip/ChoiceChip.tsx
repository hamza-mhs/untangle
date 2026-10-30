import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, radius, size } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** Text chip for presets and filters (prototype `.chips`); selected = white. */
export function ChoiceChip({ label, selected, onPress, testID }: ChoiceChipProps) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      hitSlop={(size.touch - size.chip) / 2}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[styles.chip, selected ? styles.on : null]}>
      <Text variant="caption" tone={selected ? 'onLight' : 'primary'} style={styles.label}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: size.chip,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: color.surface.control,
    justifyContent: 'center',
  },
  on: { backgroundColor: color.text.primary },
  label: { fontSize: 13 },
});
