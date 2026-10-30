import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';

export type ArtProps = {
  /** Read by TalkBack; omit for purely decorative art. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Frame for every illustration: an SVG drawn in its own viewBox, scaled to fit the space the
 * screen gives it (it shrinks before text does, 10-phase1-onboarding §2.1).
 */
export function ArtFrame({
  viewBox,
  label,
  style,
  testID,
  children,
}: ArtProps & { viewBox: string; children: ReactNode }) {
  return (
    <View
      testID={testID}
      style={[styles.fill, style]}
      {...(label
        ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label }
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}>
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        {children}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, alignSelf: 'stretch' } });
