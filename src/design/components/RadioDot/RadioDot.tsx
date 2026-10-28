import { StyleSheet, View } from 'react-native';

import { color, pill, size } from '../../tokens';
import { Icon } from '../Icon';

/** 22 pt radio: grey ring when off, accent fill + check when on. */
export function RadioDot({ isSelected }: { isSelected: boolean }) {
  return (
    <View style={[styles.dot, isSelected ? styles.on : styles.off]}>
      {isSelected ? (
        <Icon name="check" size={size.icon.xs - 4} color={color.text.onAccent} strokeWidth={3} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: size.radio,
    height: size.radio,
    ...pill(size.radio),
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: color.accent.primary },
  off: { borderWidth: size.selectedRing, borderColor: color.border.strong },
});
