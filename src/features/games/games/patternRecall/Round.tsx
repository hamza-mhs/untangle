import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop } from '../../kit';
import {
  PADS,
  patternStars,
  patternStream,
  PATTERN_GAP_MS,
  PATTERN_LIVES,
  PATTERN_ON_MS,
  PATTERN_PAD_POINTS,
  PATTERN_PERFECT_POINTS,
  PATTERN_ROUNDS,
  PATTERN_SECONDS,
} from './logic';

const POLL_MS = 40;
const COLS = 3;
/** Each pad plays its own tone while lit, so the pattern can be heard as well as seen. */
const TONES = ['tone-low', 'tone-mid', 'tone-high'] as const;

export default function PatternRecallRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const gap = space.md;
  const pad = Math.min((W - gap * (COLS - 1)) / COLS, (api.board.height * 0.75) / COLS);
  const gridW = pad * COLS + gap * (COLS - 1);
  const gridTop = (api.board.height - gridW) / 2;
  const [lit, setLit] = useState<number | null>(null);
  const [bad, setBad] = useState<number | null>(null);
  const tapped = useRef<number | null>(null);
  const open = useRef(false);

  const centre = (i: number) => ({
    x: (W - gridW) / 2 + (i % COLS) * (pad + gap) + pad / 2,
    y: gridTop + Math.floor(i / COLS) * (pad + gap) + pad / 2,
  });
  const flash = (i: number) => {
    setLit(i);
    api.sound(TONES[i % TONES.length]!);
  };

  useRoundLoop(api, async () => {
    const next = patternStream(seed);
    const timer = api.timer(PATTERN_SECONDS);
    const lives = api.lives(PATTERN_LIVES);
    let left = PATTERN_LIVES;
    let round = 1;
    while (!timer.done() && round <= PATTERN_ROUNDS && left > 0) {
      api.setRound(t('games.common.roundOf', { n: round, total: PATTERN_ROUNDS }));
      api.fx.toast(t('games.patternRecall.round', { n: round }));
      await api.wait(1000);
      const seq = next(round);
      api.hint(t('games.patternRecall.watch'));
      api.quiet(true);
      await api.wait(400);
      for (const i of seq) {
        if (timer.done()) break;
        flash(i);
        await api.wait(PATTERN_ON_MS);
        setLit(null);
        await api.wait(PATTERN_GAP_MS);
      }
      api.quiet(false);
      api.hint(t('games.patternRecall.yourTurn'));
      let ok = true;
      open.current = true;
      for (let k = 0; k < seq.length && !timer.done(); k++) {
        tapped.current = null;
        while (tapped.current === null && !timer.done()) await api.wait(POLL_MS);
        const i = tapped.current;
        if (i === null) break;
        const c = centre(i);
        if (i === seq[k]) {
          flash(i);
          api.addScore(PATTERN_PAD_POINTS);
          api.fx.hit(c.x, c.y, color.game[PADS[i]!], PATTERN_PAD_POINTS);
          await api.wait(160);
          setLit(null);
        } else {
          open.current = false;
          setBad(i);
          api.fx.oops();
          left = lives.lose();
          api.hint(t('games.patternRecall.notThat'), 'bad');
          ok = false;
          await api.wait(900);
          setBad(null);
          break;
        }
      }
      open.current = false;
      if (ok && !timer.done()) {
        api.addScore(PATTERN_PERFECT_POINTS);
        api.hint(t('games.patternRecall.perfect', { n: PATTERN_PERFECT_POINTS }), 'good');
        round++;
        await api.wait(700);
      }
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const cleared = round - 1;
    api.finish({
      title: t(
        cleared >= PATTERN_ROUNDS
          ? 'games.patternRecall.titleComplete'
          : 'games.patternRecall.titleNice',
      ),
      stars: patternStars(cleared),
      stats: [
        t('games.patternRecall.statRounds', { count: cleared }),
        t('games.common.livesLeft', { left, total: PATTERN_LIVES }),
      ],
      best: { value: cleared, label: t('games.patternRecall.statRounds', { count: cleared }) },
    });
  });

  const onPad = (i: number) => {
    if (!open.current || tapped.current !== null) return;
    api.haptic('tap');
    tapped.current = i;
  };

  return (
    <View style={styles.fill}>
      <View style={[styles.grid, { width: gridW, top: gridTop, gap }]}>
        {PADS.map((p, i) => (
          <View
            key={i}
            style={[
              { width: pad, height: pad },
              lit === i || bad === i ? null : styles.dim,
              bad === i ? styles.bad : null,
            ]}>
            <ToyKey
              testID={`game.patternRecall.pad${i}`}
              tint={color.game[p]}
              accessibilityLabel={t('games.patternRecall.pad', { n: i + 1 })}
              onPress={() => onPad(i)}
              style={styles.pad}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grid: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' },
  pad: { flex: 1 },
  dim: { opacity: 0.45 },
  bad: { borderRadius: radius['3xl'], borderWidth: 3, borderColor: color.signal.danger },
});
