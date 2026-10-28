import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { color, pill, size, space, type MoodColor } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';
import { useSelection } from './useSelection';

export type ChoiceRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: MoodColor;
  /** `single` → radio semantics; `multi` → checkbox. */
  mode: 'single' | 'multi';
  /** Optional second line, shown only when selected (onboarding 05). */
  sub?: string;
  testID?: string;
};

/** Full-width pill option. 52 pt, or 56 pt when the sub-line is showing. */
export function ChoiceRow({ label, selected, onPress, accent, mode, sub, testID }: ChoiceRowProps) {
  const { bg, fg, check } = useSelection(selected, accent);
  const isSubShown = !!sub && selected;
  return (
    <PressableScale
      testID={testID}
      accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={isSubShown ? `${label}, ${sub}` : label}
      onPress={onPress}>
      <Animated.View style={[styles.row, isSubShown && styles.rowWithSub, bg]}>
        <View style={styles.texts}>
          <Text variant="body.l" numberOfLines={1} maxFontSizeMultiplier={1.3} style={fg}>
            {label}
          </Text>
          {isSubShown ? (
            <Text
              variant="meta.strong"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={[styles.sub, fg]}>
              {sub}
            </Text>
          ) : null}
        </View>
        <Animated.View style={check}>
          <Icon name="check" size={size.icon.md} color={color.text.onAccent} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.optionRow,
    ...pill(size.optionRow),
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowWithSub: {
    minHeight: size.optionRowWithSub,
    ...pill(size.optionRowWithSub),
    paddingVertical: space.sm,
  },
  texts: { flex: 1 },
  sub: { marginTop: space.xxs, opacity: 0.75 },
});

