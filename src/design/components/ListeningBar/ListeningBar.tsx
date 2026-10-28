import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useT } from '@/i18n';

import { color, pill, size, space } from '../../tokens';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Text } from '../Text';

export type ListeningBarProps = {
  /** "Listening" / "18s left". */
  title: string;
  /** "40 of 56 words" / "Listening". */
  sub: string;
  /** Mic input 0–1 (drives the bars); omit for a still bar. */
  level?: SharedValue<number>;
  active: boolean;
  /** Tap the mic to pause / resume listening. */
  onMicPress?: () => void;
  testID?: string;
};

/** Bar heights as a share of the tallest, from the render (OvReading / OxSummary). */
const BARS = [0.3, 0.45, 0.6, 0.85, 1, 0.75, 0.3, 0.5, 0.7, 0.9, 1, 0.8] as const;
const BAR_MAX = size.micButton * 0.8;
const QUIET = 0.35;

/** Pack 2 SPEC §2 ListeningBar: orange mic, live bars, a status on the right. */
export function ListeningBar({ title, sub, level, active, onMicPress, testID }: ListeningBarProps) {
  const t = useT();
  return (
    <View style={styles.bar} testID={testID}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t(active ? 'reading.listening.pauseA11y' : 'reading.listening.resumeA11y')}
        disabled={!onMicPress}
        onPress={onMicPress}
        style={[styles.mic, !active && styles.micOff]}>
        <Icon name={active ? 'mic' : 'micOff'} size={size.icon.lg} color={color.text.onAccent} />
      </PressableScale>
      <View style={styles.waves} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((h, i) => (
          <Wave key={i} share={h} level={level} active={active} />
        ))}
      </View>
      <View style={styles.status} accessible accessibilityLiveRegion="polite">
        <Text variant="body.l.strong" align="right">
          {title}
        </Text>
        <Text variant="body" tone="muted" align="right">
          {sub}
        </Text>
      </View>
    </View>
  );
}

function Wave({ share, level, active }: { share: number; level: SharedValue<number> | undefined; active: boolean }) {
  const style = useAnimatedStyle(() => {
    const l = active ? (level ? level.get() : 1) : 0;
    return { height: withTiming(BAR_MAX * share * (QUIET + (1 - QUIET) * l), { duration: 120 }) };
  });
  return <Animated.View style={[styles.wave, !active && styles.waveOff, style]} />;
}

const styles = StyleSheet.create({
  bar: {
    height: size.listeningBar,
    ...pill(size.listeningBar),
    backgroundColor: color.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  mic: {
    width: size.micButton,
    height: size.micButton,
    ...pill(size.micButton),
    backgroundColor: color.read,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micOff: { backgroundColor: color.bg.raisedHigh },
  waves: { flexDirection: 'row', alignItems: 'center', gap: size.waveBar, height: BAR_MAX },
  wave: { width: size.waveBar, ...pill(size.waveBar), backgroundColor: color.read },
  waveOff: { backgroundColor: color.bg.raisedHigh },
  status: { flex: 1, alignItems: 'flex-end' },
});
