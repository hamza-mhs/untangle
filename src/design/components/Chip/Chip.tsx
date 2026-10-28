import { StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, pill, size, space } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `s` 40 pt (reasons), `m` 44 pt (durations, stretched). */
  size?: 's' | 'm';
  /** Stretch to share the row equally. */
  fill?: boolean;
  /** Unselected surface: on a sheet (`raisedHigh`) or on the canvas (`raised`). */
  surface?: 'sheet' | 'canvas';
  /** Radio (one of many) vs checkbox semantics. */
  mode?: 'single' | 'multi';
  testID?: string;
};

/**
 * Selection chip (SPEC §3: selection only — durations, reasons). Selected = accent.
 * For information, use plain text, not chips.
 */
export function Chip({
  label,
  selected,
  onPress,
  size: chipSize = 's',
  fill = false,
  surface = 'sheet',
  mode = 'single',
  testID,
}: ChipProps) {
  const h = chipSize === 'm' ? size.durationChip : size.chipS;
  return (
    <PressableScale
      testID={testID}
      accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[
        styles.chip,
        { height: h, ...pill(h) },
        fill && styles.fill,
        selected ? styles.selected : surface === 'sheet' ? styles.sheet : styles.canvas,
      ]}>
      <Text variant={chipSize === 'm' ? 'body.strong' : 'label.strong'} tone={selected ? 'onAccent' : 'primary'}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: space.lg + 1, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
  selected: { backgroundColor: color.accent.primary },
  sheet: { backgroundColor: color.bg.raisedHigh },
  canvas: { backgroundColor: color.bg.raised },
});
