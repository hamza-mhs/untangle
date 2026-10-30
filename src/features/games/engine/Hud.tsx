import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon, PressableScale, Ring, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import { timerState, type TimerState } from './clock';
import type { HintTone } from './types';

const TIMER = 52;
const TINT: Record<TimerState, string> = {
  normal: color.text.primary,
  warning: color.signal.warning,
  last: color.signal.danger,
  up: color.signal.danger,
};

/** Score that rolls up toward its target (§A.2.4). */
function RollingScore({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const target = useRef(value);
  target.current = value;
  useEffect(() => {
    if (shown === value) return undefined;
    const id = setInterval(() => {
      setShown((s) => {
        const gap = target.current - s;
        if (Math.abs(gap) <= 1) return target.current;
        return s + Math.ceil(gap * 0.2);
      });
    }, 16);
    return () => clearInterval(id);
  }, [shown, value]);
  return <Text variant="statLg">{shown}</Text>;
}

function ComboPill({ n }: { n: number }) {
  const t = useT();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (n > 0)
      pop.set(withSequence(withTiming(1.15, { duration: 90 }), withTiming(1, { duration: 140 })));
  }, [n, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const hot = n >= 3;
  return (
    <Animated.View style={[styles.pill, hot ? styles.pillHot : null, style]} testID="game.combo">
      <Text variant="bodyStrong" tone={hot ? 'onLight' : 'primary'}>
        {t('games.hud.streak', { n })}
      </Text>
    </Animated.View>
  );
}

export type HudState = {
  title: string;
  round: string;
  score: number;
  combo: number | null;
  lives: { total: number; left: number } | null;
  hint: { text: string; tone: HintTone } | null;
  timer: { leftMs: number; totalMs: number } | null;
};

export function Hud({
  state,
  calm,
  onPause,
}: {
  state: HudState;
  calm: boolean;
  onPause: () => void;
}) {
  const t = useT();
  const tm = state.timer;
  const ts = tm ? timerState(tm.leftMs, tm.totalMs) : 'normal';
  const secs = tm ? Math.ceil(tm.leftMs / 1000) : 0;
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <PressableScale
          testID="game.pause"
          accessibilityRole="button"
          accessibilityLabel={t('games.hud.pause')}
          hitSlop={(size.touch - size.navChip) / 2}
          onPress={onPause}
          style={styles.close}>
          <Icon name="close" size={size.icon.sm} color={color.text.primary} />
        </PressableScale>
        <View style={styles.titleBox}>
          <Text variant="bodyStrong" align="center" numberOfLines={1}>
            {state.title}
          </Text>
          {state.round ? (
            <Text variant="micro" tone="secondary" align="center">
              {state.round}
            </Text>
          ) : null}
        </View>
        {tm && !calm ? (
          <Ring
            progress={tm.leftMs / tm.totalMs}
            size={TIMER}
            stroke={4}
            color={TINT[ts]}
            trackColor={color.surface.track}
            accessibilityLabel={t('games.hud.secondsLeft', { count: secs })}>
            <Text variant="heading" style={{ color: TINT[ts] }}>
              {secs}
            </Text>
          </Ring>
        ) : (
          <View style={styles.timerSpace} />
        )}
      </View>
      {tm && !calm ? (
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.max(0, Math.min(1, tm.leftMs / tm.totalMs)) * 100}%`,
                backgroundColor: TINT[ts],
              },
            ]}
          />
        </View>
      ) : null}
      {!calm ? (
        <View style={styles.scoreRow}>
          <View style={styles.score}>
            <RollingScore value={state.score} />
            <Text variant="caption" tone="secondary">
              {t('games.hud.pts')}
            </Text>
          </View>
          {state.lives ? (
            <View
              style={styles.hearts}
              accessible
              accessibilityLabel={t('games.hud.lives', {
                left: state.lives.left,
                total: state.lives.total,
              })}>
              {Array.from({ length: state.lives.total }, (_, i) => (
                <Text
                  key={i}
                  variant="heading"
                  tone="danger"
                  style={i < state.lives!.left ? null : styles.heartLost}>
                  ♥
                </Text>
              ))}
            </View>
          ) : state.combo !== null ? (
            <ComboPill n={state.combo} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function HintLine({ hint }: { hint: HudState['hint'] }) {
  if (!hint) return <View style={styles.hint} />;
  const dot =
    hint.tone === 'good'
      ? color.signal.success
      : hint.tone === 'bad'
        ? color.signal.danger
        : color.text.tertiary;
  return (
    <View style={styles.hint} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text
        variant="bodyStrong"
        tone={hint.tone === 'good' ? 'success' : hint.tone === 'bad' ? 'danger' : 'secondary'}>
        {hint.text}
      </Text>
    </View>
  );
}

const DOT = 8;
const styles = StyleSheet.create({
  root: { gap: space.md, paddingTop: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  close: {
    width: size.navChip + space.sm,
    height: size.navChip + space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: { flex: 1 },
  timerSpace: { width: TIMER },
  bar: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: color.surface.track,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.pill },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  score: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  pill: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
  },
  pillHot: { backgroundColor: color.game.sun },
  hearts: { flexDirection: 'row', gap: space.xs },
  heartLost: { opacity: 0.25 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: size.touch,
  },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
});
