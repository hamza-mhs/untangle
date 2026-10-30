import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/design/components';
import { color, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import { URGE_MS, urgeLevel, urgeStage } from './logic';

const WAVE_H = 180;

export default function UrgeSurfingRound({ api }: RoundProps) {
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
  waveBox: { height: WAVE_H + 40, justifyContent: 'flex-end', overflow: 'hidden' },
  wave: { backgroundColor: color.game.sky, opacity: 0.55 },
  crest: { position: 'absolute', top: -12 },
});
