import { StyleSheet, Text as RNText, View } from 'react-native';

import { color, radius, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type OptionRowProps = {
  label: string;
  sublabel?: string;
  /** Emoji shown in the leading slot (onboarding questions). */
  emoji?: string;
  selected: boolean;
  /** Checkbox (multi-select) instead of a tick (single-select). */
  multi?: boolean;
  onPress: () => void;
  testID?: string;
};

/**
 * Onboarding answer row (prototype `.row6`): dark row; selected = white with black text and a
 * tick (single) or a filled black checkbox (multi).
 */
export function OptionRow({ label, sublabel, emoji, selected, multi = false, onPress, testID }: OptionRowProps) {
  const fg = selected ? color.text.onLight : color.text.primary;
  return (
    <PressableScale
      testID={testID}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.row, selected ? styles.on : null]}>
      {emoji ? (
        <RNText style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
          {emoji}
        </RNText>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyLg" style={{ color: fg }}>
          {label}
        </Text>
        {sublabel ? (
          <Text variant="caption" tone={selected ? 'onLight' : 'secondary'}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {multi ? (
        <View style={[styles.box, selected ? styles.boxOn : null]}>
          {selected ? <Icon name="check" size={size.icon.xs} color={color.text.primary} /> : null}
        </View>
      ) : (
        <View style={styles.tick}>
          {selected ? <Icon name="check" size={size.icon.sm} color={color.text.onLight} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.optionRow,
    borderRadius: radius.lg,
    backgroundColor: color.surface.option,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  on: { backgroundColor: color.text.primary },
  emoji: { width: space['2xl'], textAlign: 'center', fontSize: 19, lineHeight: 24 },
  text: { flex: 1, minWidth: 0 },
  tick: { width: size.checkbox, height: size.checkbox, alignItems: 'center', justifyContent: 'center' },
  box: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: color.surface.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: color.text.onLight, borderColor: color.text.onLight },
});
