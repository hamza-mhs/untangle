import { StyleSheet, View } from 'react-native';

import { color, radius, size } from '../../tokens';

/** Radio indicator for plan cards: ring when off, filled violet with a white centre when on. */
export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.ring, selected ? styles.on : null]}>
      {selected ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.surface.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { borderColor: color.brand.violet, backgroundColor: color.brand.violet },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: color.text.primary },
});
