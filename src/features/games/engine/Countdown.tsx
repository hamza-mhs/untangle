import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, motion, radius } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

/** One beat (§A.2.3): 620 ms per digit with a 20 ms gap. */
export const BEAT_MS = motion.duration.countdownBeat;
const GAP_MS = motion.duration.countdownGap;
const PULSE = 170;
const GO_PULSE = 260;

function Beat({ label, accent, go }: { label: string; accent: string; go: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withSequence(
        withTiming(1, { duration: BEAT_MS * 0.3, easing: Easing.bezier(...motion.easing.pop) }),
        withTiming(2, { duration: BEAT_MS * 0.45 }),
        withTiming(3, { duration: BEAT_MS * 0.25 }),
      ),
    );
  }, [p]);
  const digit = useAnimatedStyle(() => {
    const v = p.get();
    const scale = v < 1 ? 1.8 - 0.8 * v : v < 2 ? 1 - 0.08 * (v - 1) : 0.92 - 0.12 * (v - 2);
    const opacity = v < 1 ? v : v < 2 ? 1 : 3 - v;
    return { opacity, transform: [{ scale }] };
  });
  const ring = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - p.get() / 1.6),
    transform: [{ scale: 0.4 + 0.6 * Math.min(1, p.get()) }],
  }));
  const size = go ? GO_PULSE : PULSE;
  return (
    <View style={styles.center}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderColor: go ? accent : color.text.primary },
          ring,
        ]}
      />
      <Animated.View style={digit}>
        <Text
          variant="statXl"
          style={go ? { color: accent } : null}
          accessibilityLiveRegion="assertive">
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * 3, 2, 1, Go (or 3, 2, 1 when resuming). Dim overlay over the board; calls `onDone` after the
 * last beat. With Reduce motion it still counts, without the scaling.
 */
export function Countdown({
  accent,
  withGo,
  onDone,
}: {
  accent: string;
  withGo: boolean;
  onDone: () => void;
}) {
  const t = useT();
  const beats = withGo ? ['3', '2', '1', t('games.go')] : ['3', '2', '1'];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= beats.length) {
      onDone();
      return undefined;
    }
    if (i === 3) haptics.success();
    else haptics.tap();
    const id = setTimeout(() => setI((n) => n + 1), BEAT_MS + GAP_MS);
    return () => clearTimeout(id);
  }, [beats.length, i, onDone]);
  if (i >= beats.length) return null;
  return (
    <View style={styles.overlay} testID="game.countdown">
      <Beat key={i} label={beats[i]!} accent={accent} go={i === 3} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.overlay.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: radius.pill, borderWidth: 3 },
});
