import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { color, pill, size } from '../../tokens';

export type ProgressTone = 'accent' | 'onAccent';

export type ProgressBarProps = {
  /** 0..1, either a number or a UI-thread value (focus clocks). */
  progress: number | SharedValue<number>;
  tone?: ProgressTone;
  /** Track colour: the canvas track, the raised-card track or the one drawn on yellow. */
  track?: 'canvas' | 'raised' | 'onAccent';
  thickness?: 'thin' | 'thick';
  testID?: string;
};

/** Track + fill. The fill scales on X (transform only, never width — CODE_STANDARDS). */
export function ProgressBar({
  progress,
  tone = 'accent',
  track = 'raised',
  thickness = 'thin',
  testID,
}: ProgressBarProps) {
  const fill = useAnimatedStyle(() => {
    const p = typeof progress === 'number' ? progress : progress.value;
    return { transform: [{ scaleX: Math.min(1, Math.max(0, p)) }] };
  });
  const h = thickness === 'thick' ? size.progressThick : size.progress;
  const value = typeof progress === 'number' ? progress : undefined;
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={value === undefined ? undefined : { min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, trackStyles[track], { height: h, ...pill(h) }]}>
      <Animated.View style={[styles.fill, fillStyles[tone], fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, transformOrigin: 'left' },
});

const trackStyles = StyleSheet.create({
  canvas: { backgroundColor: color.track.focus },
  raised: { backgroundColor: color.bg.raisedHigh },
  onAccent: { backgroundColor: color.onAccent.track },
});

const fillStyles = StyleSheet.create({
  accent: { backgroundColor: color.accent.primary },
  onAccent: { backgroundColor: color.text.onAccent },
});
