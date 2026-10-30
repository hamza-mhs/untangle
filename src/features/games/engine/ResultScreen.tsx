import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';

import { Glow, Icon, Screen, Text } from '@/design/components';
import { color, radius, resultGlow, size, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';

import type { RoundResult } from './types';

const STAR_DELAYS = [250, 500, 750];
const STAR = 70;
const STAR_BIG = 92;
const CHECK = 72;

function Star({ on, big, delay }: { on: boolean; big: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) p.set(withDelay(delay, withSpring(1, { damping: 10, stiffness: 180 })));
  }, [delay, p, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.get() * 2),
    transform: [{ scale: 0.4 + 0.6 * p.get() }],
  }));
  const s = big ? STAR_BIG : STAR;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 ? 22 : 46;
    return `${50 + r * Math.cos(a)},${52 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <Animated.View style={style}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Polygon
          points={pts}
          fill={on ? color.game.sun : color.surface.lineStrong}
          stroke={on ? color.game.orange : color.surface.ring}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        {on ? (
          <Path
            d="M34 36 q6 -8 14 -8"
            stroke={color.text.primary}
            strokeOpacity={0.6}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </Animated.View>
  );
}

/** Score rolling up from 0 (§A.2.8). */
function RollUp({ to }: { to: number }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 700);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [reduced, to]);
  return (
    <Text variant="statXl" align="center">
      {reduced ? to : n}
    </Text>
  );
}

/** Result (§A.2.8; calm `119:5507`). */
export function ResultScreen({
  name,
  accent,
  result,
  isNewBest,
  calm,
  actions,
}: {
  name: string;
  accent: string;
  result: RoundResult;
  isNewBest: boolean;
  calm: boolean;
  actions: ReactNode;
}) {
  const t = useT();
  return (
    <Screen
      testID="game.result"
      variant="game"
      background={<Glow {...resultGlow(accent)} />}
      footer={actions}>
      <View style={styles.body}>
        <Text variant="micro" tone="secondary" align="center">
          {name}
        </Text>
        {calm ? (
          <View
            style={styles.check}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <Icon name="check" size={size.icon.lg} color={color.text.onLight} />
          </View>
        ) : null}
        <Text variant="titleLg" align="center" accessibilityRole="header">
          {result.title}
        </Text>
        {!calm && result.stars !== undefined ? (
          <View
            style={styles.stars}
            accessible
            accessibilityLabel={t('games.result.stars', { count: result.stars })}>
            {[1, 2, 3].map((s, i) => (
              <Star key={s} on={result.stars! >= s} big={i === 1} delay={STAR_DELAYS[i]!} />
            ))}
          </View>
        ) : null}
        {!calm && result.score !== undefined ? <RollUp to={result.score} /> : null}
        {result.line ? (
          <Text variant="body" tone="body" align="center">
            {result.line}
          </Text>
        ) : null}
        <View style={styles.stats}>
          {isNewBest ? (
            <View style={[styles.stat, styles.newBest]}>
              <Text variant="bodyStrong" tone="onLight">
                {t('games.result.newBest')}
              </Text>
            </View>
          ) : null}
          {result.stats.slice(0, 3).map((s) => (
            <View key={s} style={styles.stat}>
              <Text variant="bodyStrong">{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: space.md },
  check: {
    alignSelf: 'center',
    width: CHECK,
    height: CHECK,
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  stat: {
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: color.surface.raised,
  },
  newBest: { backgroundColor: color.signal.success },
});
