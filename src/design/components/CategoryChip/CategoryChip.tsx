import { StyleSheet, View } from 'react-native';

import { focusGroupColor, radius, space, type FocusGroup } from '../../tokens';
import { Text } from '../Text';

export type CategoryChipProps = { group: FocusGroup; label: string; testID?: string };

/** Small chip naming a game's focus group, in that group's colour. */
export function CategoryChip({ group, label, testID }: CategoryChipProps) {
  return (
    <View testID={testID} style={[styles.chip, { backgroundColor: focusGroupColor[group] }]}>
      <Text variant="caption" tone="onLight">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    height: space['2xl'],
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
});

