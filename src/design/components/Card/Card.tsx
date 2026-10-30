import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, layout, radius } from '../../tokens';
import { PressableScale } from '../PressableScale';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Remove the inner padding (lists inside cards). */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** surface.card, radius 20, 16 padding, hairline border. Pressable when `onPress` is set. */
export function Card({ children, onPress, accessibilityLabel, flush = false, style, testID }: CardProps) {
  const s = [styles.card, flush ? null : styles.pad, style];
  if (!onPress) {
    return (
      <View testID={testID} style={s}>
        {children}
      </View>
    );
  }
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      onPress={onPress}
      style={s}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    overflow: 'hidden',
  },
  pad: { padding: layout.cardPadding },
});
