import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design/components';
import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { Shape, ToyKey, useRoundLoop } from '../../kit';
import { echoIsMatch, echoSequence, echoStars, type EchoShape } from './logic';

const POLL_MS = 40;

const ECHO_TINT: Record<EchoShape, string> = {
  circle: color.game.sky,
  square: color.game.pink,
  triangle: color.game.sun,
  diamond: color.game.mint,
  star: color.game.orange,
  hex: color.game.violet,
};
const ECHO_SHOW_MS = 1700;

export default function EchoRound({ api, seed }: RoundProps) {
  const t = useT();
  const [shape, setShape] = useState<{ s: EchoShape; i: number } | null>(null);
  const pressed = useRef(false);

  useRoundLoop(api, async () => {
    const seq = echoSequence(seed);
    const timer = api.timer(45);
    let right = 0;
    let i = 0;
    api.combo(0);
    let streak = 0;
    for (; i < seq.length && !timer.done(); i++) {
      api.setRound(t('games.hud.of', { n: i + 1, total: seq.length }));
      pressed.current = false;
      setShape({ s: seq[i]!, i });
      api.sound('tick');
      const until = api.clock.now() + ECHO_SHOW_MS;
      while (api.clock.now() < until && !pressed.current && !timer.done()) await api.wait(POLL_MS);
      const match = echoIsMatch(seq, i);
      const ok = pressed.current === match;
      if (ok) {
        right++;
        streak++;
        api.combo(streak);
        if (match) {
          api.addScore(15);
          api.fx.hit(api.board.width / 2, api.board.height * 0.38, ECHO_TINT[seq[i]!], 15);
          api.hint(t('games.echo.match'), 'good');
        } else {
          api.addScore(5);
          api.hint(t('games.echo.pass'), 'neutral');
        }
      } else {
        streak = 0;
        api.combo(0);
        api.fx.oops();
        api.hint(match ? t('games.echo.missed') : t('games.echo.notMatch'), 'bad');
      }
      // Let the rest of the slot run so the rhythm stays even.
      const rest = until - api.clock.now();
      setShape(null);
      if (rest > 0) await api.wait(Math.min(rest, 400));
      await api.wait(150);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(500);
    api.finish({
      title: t('games.echo.title'),
      stars: echoStars(right),
      score: right * 10,
      stats: [t('games.echo.statRight', { right, n: Math.max(i, 1) }), t('games.echo.twoBack')],
      best: { value: right, label: t('games.echo.statRight', { right, n: Math.max(i, 1) }) },
    });
  });

  const SHAPE = Math.min(api.board.width * 0.42, 180);
  return (
    <View style={styles.fill}>
      <View style={styles.wordBox}>
        {shape ? (
          <View key={shape.i} accessible accessibilityLabel={t(`games.echo.shapes.${shape.s}`)}>
            <Shape name={shape.s} size={SHAPE} fill={ECHO_TINT[shape.s]} />
          </View>
        ) : null}
      </View>
      <ToyKey
        testID="game.echo.match"
        tint={color.game.pink}
        accessibilityLabel={t('games.echo.matchButton')}
        onPress={() => {
          api.haptic('tap');
          api.sound('tap');
          pressed.current = true;
        }}
        style={styles.matchKey}>
        <Text variant="title">{t('games.echo.matchButton')}</Text>
      </ToyKey>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wordBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  matchKey: { height: size.touch * 2, marginBottom: space.md },
});
