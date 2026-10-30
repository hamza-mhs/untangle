import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import { breathAt, BREATHS } from './logic';

const PEARL = 160;

export default function BreathCountRound({ api }: RoundProps) {
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
    let cue = '';
    for (;;) {
      const b = breathAt(api.clock.now());
      setState(b);
      // A soft low tone as each breath in starts, a higher one for the breath out.
      const at = `${b.index}${b.phase}`;
      if (!b.done && at !== cue) {
        cue = at;
        api.sound(b.phase === 'in' ? 'tone-low' : 'tone-mid');
      }
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  pearl: {
    width: PEARL,
    height: PEARL,
    borderRadius: radius.pill,
    backgroundColor: color.game.cobalt,
    opacity: 0.8,
  },
});
