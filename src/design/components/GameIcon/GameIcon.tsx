import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { IconName } from '../../icons';
import { color as colors, iconRadius, size as sizes } from '../../tokens';
import { Icon } from '../Icon';

export type GameIconProps = {
  /** The game's colour (from the catalog). */
  color: string;
  /** Glyph on the badge; the real per-game badge art replaces this in Batch 3. */
  glyph?: IconName;
  size?: number;
  testID?: string;
};

const LIP = 0.08;

/**
 * Toy-style badge tile (prototype `.tb`): light-to-colour gradient, a darker bottom lip and a
 * white glyph. PLACEHOLDER art until the game badges are exported.
 */
export function GameIcon({ color, glyph, size = sizes.appIcon.lg, testID }: GameIconProps) {
  const r = iconRadius(size);
  const lip = Math.round(size * LIP);
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size + lip }}>
      <Svg width={size} height={size + lip} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="face" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.text.primary} stopOpacity={0.35} />
            <Stop offset="0.55" stopColor={colors.text.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect y={lip} width={size} height={size} rx={r} fill={color} />
        <Rect y={lip} width={size} height={size} rx={r} fill={colors.bg.app} fillOpacity={0.35} />
        <Rect width={size} height={size} rx={r} fill={color} />
        <Rect width={size} height={size} rx={r} fill="url(#face)" />
      </Svg>
      {glyph ? (
        <View style={[styles.glyph, { width: size, height: size }]}>
          <Icon name={glyph} size={size * 0.46} color={colors.text.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { position: 'absolute', top: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
