import { StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { color, maxFontScale, type, type TypeRole } from '../../tokens';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type LiveTextProps = {
  /** Updated on the UI thread (a clock), never through React state. */
  text: SharedValue<string>;
  variant: TypeRole;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Private to Countdown: text that changes every frame without re-rendering React. A read-only
 * TextInput whose `text` is set from a shared value; hidden from screen readers (the parent
 * announces, throttled).
 */
export function LiveText({ text, variant, style, testID }: LiveTextProps) {
  const animatedProps = useAnimatedProps(() => ({ text: text.get() }) as object);
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
      style={[styles.reset, type[variant], style]}
    />
  );
}

const styles = StyleSheet.create({
  reset: { padding: 0, margin: 0, color: color.text.primary },
});
