import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ChoiceChip, Ring, Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import type { RoundProps } from '../engine/types';
import { useFrame, useRoundLoop } from './kit';
import { breathAt, BREATHS, SILENCE_MINUTES, URGE_MS, urgeLevel, urgeStage } from './logic';

const PEARL = 160;

// ───────────────────────── Breath count ─────────────────────────

export function BreathCountRound({ api }: RoundProps) {
  const t = useT();
  const scale = useSharedValue(0.6);
  const [state, setState] = useState(() => breathAt(0));
  const taps = useRef(new Set<number>());
  const [count, setCount] = useState(0);

  useFrame(api, (now) => {
    const b = breathAt(now);
    const s =
      b.phase === 'in'
        ? 0.6 + 0.4 * Math.sin((b.p * Math.PI) / 2)
        : 1 - 0.4 * Math.sin((b.p * Math.PI) / 2);
    scale.set(api.reducedMotion ? 0.8 : s);
  });

  useRoundLoop(api, async () => {
    api.setRound('');
    for (;;) {
      const b = breathAt(api.clock.now());
      setState(b);
      if (b.done) break;
      await api.wait(100);
    }
    await api.wait(400);
    api.finish({
      title: t('games.breathCount.title'),
      line: t('games.breathCount.line'),
      stats: [
        t('games.breathCount.statBreaths', { count: Math.max(taps.current.size, BREATHS) }),
        t('games.breathCount.statLength'),
      ],
    });
  });

  const pearl = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Pressable
      testID="game.breathCount.tap"
      accessibilityRole="button"
      accessibilityLabel={t('games.breathCount.tapA11y')}
      onPress={() => {
        if (state.phase !== 'out' || taps.current.has(state.index)) return;
        taps.current.add(state.index);
        setCount(taps.current.size);
        haptics.select();
      }}
      style={styles.center}>
      <Animated.View style={[styles.pearl, pearl]} />
      <Text variant="title" align="center" accessibilityLiveRegion="polite">
        {t(state.phase === 'in' ? 'games.breathCount.in' : 'games.breathCount.out')}
      </Text>
      <Text variant="body" tone="secondary" align="center">
        {t('games.breathCount.count', { n: Math.min(count, BREATHS), total: BREATHS })}
      </Text>
    </Pressable>
  );
}

// ───────────────────────── Silence ─────────────────────────

export function SilenceRound({ api }: RoundProps) {
  const t = useT();
  const [minutes, setMinutes] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const chosen = useRef<number | null>(null);

  useRoundLoop(api, async () => {
    api.hint(t('games.silence.choose'));
    while (chosen.current === null) await api.wait(100);
    const total = chosen.current * 60_000;
    const start = api.clock.now();
    api.hint(t('games.silence.quiet'));
    api.quiet(true);
    while (api.clock.now() - start < total) {
      setLeft(total - (api.clock.now() - start));
      await api.wait(250);
    }
    api.quiet(false);
    haptics.success();
    await api.wait(600);
    api.finish({
      title: t('games.silence.title', { count: chosen.current }),
      line: t('games.silence.line'),
      stats: [
        t('games.silence.statMinutes', { count: chosen.current }),
        t('games.silence.statCalm'),
      ],
    });
  });

  if (minutes === null) {
    return (
      <View style={styles.center}>
        <Text variant="title" align="center">
          {t('games.silence.howLong')}
        </Text>
        <View style={styles.chips}>
          {SILENCE_MINUTES.map((m) => (
            <ChoiceChip
              key={m}
              testID={`game.silence.${m}`}
              label={t('games.silence.minutes', { count: m })}
              selected={false}
              onPress={() => {
                chosen.current = m;
                setMinutes(m);
              }}
            />
          ))}
        </View>
      </View>
    );
  }
  const total = minutes * 60_000;
  const secs = Math.ceil(left / 1000);
  return (
    <View style={styles.center}>
      <Ring
        progress={left / total}
        size={PEARL * 1.4}
        stroke={3}
        color={color.game.violet}
        accessibilityLabel={t('games.silence.left', { s: secs })}>
        <Text variant="statLg">{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}</Text>
      </Ring>
    </View>
  );
}

// ───────────────────────── Urge surfing ─────────────────────────

const WAVE_H = 180;

export function UrgeSurfingRound({ api }: RoundProps) {
  const t = useT();
  const level = useSharedValue(0);
  const [stage, setStage] = useState<ReturnType<typeof urgeStage>>('notice');

  useFrame(api, (now) => {
    level.set(urgeLevel(now));
  });

  useRoundLoop(api, async () => {
    api.setRound('');
    for (;;) {
      const now = api.clock.now();
      setStage(urgeStage(now));
      if (now >= URGE_MS) break;
      await api.wait(250);
    }
    api.finish({
      title: t('games.urgeSurfing.title'),
      line: t('games.urgeSurfing.line'),
      stats: [t('games.urgeSurfing.statBack'), t('games.urgeSurfing.statResisted')],
    });
  });

  const W = api.board.width;
  const wave = useAnimatedStyle(() => ({ height: 24 + level.get() * WAVE_H }));
  return (
    <View style={styles.center}>
      <Text variant="title" align="center" accessibilityLiveRegion="polite">
        {t(`games.urgeSurfing.${stage}`)}
      </Text>
      <View style={[styles.waveBox, { width: W }]}>
        <Animated.View style={[styles.wave, wave]}>
          <Svg width={W} height={24} viewBox={`0 0 ${W} 24`} style={styles.crest}>
            <Path d={`M0 12 Q ${W / 4} 0 ${W / 2} 12 T ${W} 12 V24 H0 Z`} fill={color.game.sky} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  pearl: {
    width: PEARL,
    height: PEARL,
    borderRadius: radius.pill,
    backgroundColor: color.game.cobalt,
    opacity: 0.8,
  },
  chips: { flexDirection: 'row', gap: space.sm },
  waveBox: { height: WAVE_H + 40, justifyContent: 'flex-end', overflow: 'hidden' },
  wave: { backgroundColor: color.game.sky, opacity: 0.55 },
  crest: { position: 'absolute', top: -12 },
});
