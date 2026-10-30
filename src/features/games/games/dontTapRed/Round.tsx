import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import { popSchedule, redStars, TAP_COLS, TAP_ROWS, type Pop } from './logic';

const POLL_MS = 40;

const SAFE = [color.game.sky, color.game.mint, color.game.sun, color.game.violet, color.game.pink];

export default function DontTapRedRound({ api, seed }: RoundProps) {
  const t = useT();
  const [live, setLive] = useState<(Pop & { key: number })[]>([]);
  const tapped = useRef(new Set<number>());
  const stats = useRef({ hits: 0, slips: 0 });
  const cellW = api.board.width / TAP_COLS;
  const cellH = Math.min(cellW, (api.board.height - space.lg) / TAP_ROWS);

  useRoundLoop(api, async () => {
    const pops = popSchedule(seed);
    const timer = api.timer(30);
    api.combo(0);
    while (!timer.done()) {
      const now = api.clock.now();
      setLive(
        pops
          .map((p, key) => ({ ...p, key }))
          .filter((p) => p.at <= now && now < p.at + p.ttl && !tapped.current.has(p.key)),
      );
      await api.wait(POLL_MS);
    }
    setLive([]);
    api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(700);
    const { hits, slips } = stats.current;
    api.finish({
      title: t('games.dontTapRed.title'),
      stars: redStars(hits, slips),
      score: hits * 10,
      stats: [
        t('games.dontTapRed.statHits', { count: hits }),
        t('games.common.slips', { count: slips }),
      ],
      best: { value: hits, label: t('games.dontTapRed.statHits', { count: hits }) },
    });
  });

  const tap = (p: Pop & { key: number }) => {
    tapped.current.add(p.key);
    setLive((xs) => xs.filter((x) => x.key !== p.key));
    const x = (p.cell % TAP_COLS) * cellW + cellW / 2;
    const y = Math.floor(p.cell / TAP_COLS) * cellH + cellH / 2;
    if (p.red) {
      stats.current.slips++;
      api.combo(0);
      api.fx.oops();
      api.hint(t('games.dontTapRed.slip'), 'bad');
    } else {
      stats.current.hits++;
      api.addScore(10);
      api.combo(stats.current.hits);
      api.fx.hit(x, y, SAFE[p.key % SAFE.length]!, 10);
      api.hint(t('games.dontTapRed.hit'), 'good');
    }
  };

  return (
    <View style={styles.fill}>
      {live.map((p) => {
        const tint = p.red ? color.game.coral : SAFE[p.key % SAFE.length]!;
        const d = Math.min(cellW, cellH) * 0.72;
        return (
          <PressableScale
            key={p.key}
            testID={p.red ? 'game.dontTapRed.red' : 'game.dontTapRed.safe'}
            accessibilityRole="button"
            accessibilityLabel={t(p.red ? 'games.dontTapRed.redShape' : 'games.dontTapRed.shape')}
            onPress={() => tap(p)}
            style={[
              styles.pop,
              {
                width: d,
                height: d,
                left: (p.cell % TAP_COLS) * cellW + (cellW - d) / 2,
                top: Math.floor(p.cell / TAP_COLS) * cellH + (cellH - d) / 2,
                backgroundColor: tint,
                borderRadius: p.key % 3 === 0 ? radius.lg : radius.pill,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pop: { position: 'absolute' },
});
