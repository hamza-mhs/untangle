import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, pill, size } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
};

/** Pill track with one selected segment (SPEC §3). */
export function Segmented<T extends string>({ options, value, onChange, testID }: SegmentedProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist" testID={testID}>
      {options.map((o) => {
        const isSelected = o.value === value;
        return (
          <PressableScale
            key={o.value}
            testID={testID ? `${testID}.${o.value}` : undefined}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (isSelected) return;
              haptics.select();
              onChange(o.value);
            }}
            style={[styles.segment, isSelected && styles.selected]}>
            <Text variant="label.strong" tone={isSelected ? 'primary' : 'muted'}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const inner = size.segmented - size.segmentedInset * 2;

const styles = StyleSheet.create({
  track: {
    height: size.segmented,
    ...pill(size.segmented),
    backgroundColor: color.bg.raised,
    flexDirection: 'row',
    padding: size.segmentedInset,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', ...pill(inner) },
  selected: { backgroundColor: color.border.control },
});
