import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export type GlowProps = {
  /** Glow colour (a token). */
  tint: string;
  /** Centre of the glow, as fractions of the screen. Default: top third, centred. */
  cx?: number;
  cy?: number;
  /** Radius as a fraction of the screen width. */
  r?: number;
  /** Strength at the centre, 0–1. */
  strength?: number;
};

/**
 * Soft radial colour wash behind a screen (the prototypes' per-screen `glow`). Decorative:
 * hidden from TalkBack, never takes touches.
 */
export function Glow({ tint, cx = 0.5, cy = 0.3, r = 0.75, strength = 0.22 }: GlowProps) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx={`${cx * 100}%`} cy={`${cy * 100}%`} rx={`${r * 100}%`} ry={`${r * 70}%`}>
            <Stop offset="0" stopColor={tint} stopOpacity={strength} />
            <Stop offset="1" stopColor={tint} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}
