import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, radius, size } from '../../tokens';
import { Text } from '../Text';

export type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
};

/** Two or three way switch (prototype `.seg`, e.g. Week / Month on Progress). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testID,
}: SegmentedProps<T>) {
  return (
    <View testID={testID} style={styles.track} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={testID ? `${testID}.${o.value}` : undefined}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) {
                haptics.select();
                onChange(o.value);
              }
            }}
            style={[styles.seg, on ? styles.on : null]}>
            <Text variant="caption" tone={on ? 'primary' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: color.surface.option,
    borderRadius: radius.lg,
    padding: size.segmented.inset,
    minHeight: size.touch,
  },
  seg: { flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: color.surface.controlStrong },
});
