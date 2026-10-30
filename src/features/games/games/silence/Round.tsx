import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChoiceChip, Ring, Text } from '@/design/components';
import { color, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import { SILENCE_MINUTES } from './logic';

const PEARL = 160;

export default function SilenceRound({ api }: RoundProps) {
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
    api.sound('chime');
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  chips: { flexDirection: 'row', gap: space.sm },
});
