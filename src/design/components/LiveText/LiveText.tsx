import { StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { color, maxFontScale, tabularNumbers, typeScale, type TypeVariant } from '../../tokens';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export type LiveTextProps = {
  /** Updated on the UI thread (a clock), never through React state. */
  text: SharedValue<string>;
  variant: TypeVariant;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Text that changes every frame without re-rendering React (SPEC §3 Countdown: one Reanimated
 * clock, never setInterval into React state). A read-only TextInput whose `text` is set from a
 * shared value. Hidden from screen readers: the parent announces, throttled.
 */
export function LiveText({ text, variant, style, testID }: LiveTextProps) {
  const animatedProps = useAnimatedProps(() => ({ text: text.value }) as object);
  return (
    <AnimatedTextInput
      testID={testID}
      editable={false}
      caretHidden
      underlineColorAndroid="transparent"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
      maxFontSizeMultiplier={maxFontScale(variant)}
      defaultValue={text.get()}
      animatedProps={animatedProps}
      style={[typeScale[variant], tabularNumbers, styles.reset, style]}
    />
  );
}

const styles = StyleSheet.create({
  // TextInput defaults to the platform text colour (black on Android): default to primary.
  reset: { padding: 0, margin: 0, includeFontPadding: false, color: color.text.primary },
});
