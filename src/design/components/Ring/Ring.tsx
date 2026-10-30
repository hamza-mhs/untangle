import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color as colors, size as sizes } from '../../tokens';

export type RingProps = {
  /** 0 … 1. */
  progress: number;
  size: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  /** Centred content (timer number, minutes left). */
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
};

/** Progress ring, starting at 12 o'clock (game timer, allowance on lock rows). */
export function Ring({
  progress,
  size,
  stroke = sizes.ring.stroke,
  color = colors.text.primary,
  trackColor = colors.surface.track,
  children,
  accessibilityLabel,
  testID,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <View
      testID={testID}
      style={{ width: size, height: size }}
      accessible={!!accessibilityLabel}
      {...(accessibilityLabel ? { accessibilityLabel, accessibilityRole: 'progressbar' as const } : {})}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
