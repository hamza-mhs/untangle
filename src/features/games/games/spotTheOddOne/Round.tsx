import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { PressableScale } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { Shape, useRoundLoop } from '../../kit';
import {
  mixWhite,
  oddBoards,
  oddPoints,
  oddStars,
  ODD_ROUNDS,
  ODD_SECONDS,
  ODD_TILES,
  type OddBoard,
} from './logic';

const POLL_MS = 40;
const COLS = 4;
/** Tiles pop in one after another (prototype: 18 ms apart). */
const STAGGER_MS = 18;

type TileState = 'idle' | 'win' | 'dim' | 'bad';

export default function SpotTheOddOneRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const gap = space.md;
  const tile = Math.min((W - gap * (COLS - 1)) / COLS, (api.board.height * 0.7) / COLS);
  const gridW = tile * COLS + gap * (COLS - 1);
  const gridTop = (api.board.height - gridW) / 2;
  const [board, setBoard] = useState<{ b: OddBoard; r: number } | null>(null);
  const [states, setStates] = useState<TileState[]>([]);
  const tapped = useRef<number | null>(null);
  const open = useRef(false);

  const centre = (i: number) => ({
    x: (W - gridW) / 2 + (i % COLS) * (tile + gap) + tile / 2,
    y: gridTop + Math.floor(i / COLS) * (tile + gap) + tile / 2,
  });

  useRoundLoop(api, async () => {
    const boards = oddBoards(seed);
    const timer = api.timer(ODD_SECONDS);
    let r = 0;
    let found = 0;
    let misses = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && r < ODD_ROUNDS) {
      const b = boards[r]!;
      r++;
      api.setRound(t('games.common.round', { n: r }));
      setStates(Array.from({ length: ODD_TILES }, () => 'idle'));
      setBoard({ b, r });
      api.hint(t('games.spotTheOddOne.tap'));
      open.current = true;
      let done = false;
      while (!done && !timer.done()) {
        tapped.current = null;
        while (tapped.current === null && !timer.done()) await api.wait(POLL_MS);
        const i = tapped.current;
        if (i === null) break;
        if (i === b.odd) {
          done = true;
          found++;
          streak++;
          api.combo(streak);
          setStates(Array.from({ length: ODD_TILES }, (_, k) => (k === i ? 'win' : 'dim')));
          const pts = oddPoints(r);
          api.addScore(pts);
          const c = centre(i);
          api.fx.hit(c.x, c.y, color.game[b.base], pts);
          api.hint(
            t(
              b.kind === 'flip'
                ? 'games.spotTheOddOne.flipped'
                : b.diff < 16
                  ? 'games.spotTheOddOne.sharp'
                  : 'games.spotTheOddOne.found',
            ),
            'good',
          );
        } else {
          misses++;
          streak = 0;
          api.combo(0);
          setStates((s) => s.map((v, k) => (k === i ? 'bad' : v)));
          api.fx.oops();
          api.hint(t('games.spotTheOddOne.notThat'), 'bad');
        }
      }
      open.current = false;
      if (!done) break;
      await api.wait(700);
      setBoard(null);
      await api.wait(260);
    }
    open.current = false;
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    api.finish({
      title: t('games.spotTheOddOne.title'),
      stars: oddStars(found),
      stats: [
        t('games.spotTheOddOne.statFound', { found }),
        t('games.common.misses', { count: misses }),
      ],
      best: { value: found, label: t('games.spotTheOddOne.statFound', { found }) },
    });
  });

  const onTile = (i: number) => {
    if (!open.current || tapped.current !== null) return;
    if (states[i] === 'bad') return;
    api.haptic('tap');
    api.sound('tap');
    tapped.current = i;
  };

  return (
    <View style={styles.fill}>
      {board ? (
        <View
          key={board.r}
          style={[styles.grid, { width: gridW, top: gridTop, gap }]}
          accessibilityRole="none">
          {Array.from({ length: ODD_TILES }, (_, i) => {
            const base = color.game[board.b.base];
            const odd = i === board.b.odd;
            const fill = odd && board.b.kind === 'shade' ? mixWhite(base, board.b.diff) : base;
            const st = states[i] ?? 'idle';
            return (
              <Animated.View
                key={i}
                {...(api.reducedMotion
                  ? {}
                  : { entering: ZoomIn.delay(i * STAGGER_MS).duration(220) })}
                style={[
                  { width: tile, height: tile },
                  st === 'dim' ? styles.dim : null,
                  st === 'bad' ? styles.bad : null,
                ]}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t('games.spotTheOddOne.tile', { n: i + 1 })}
                  onPress={() => onTile(i)}
                  style={[
                    styles.tile,
                    { backgroundColor: fill },
                    st === 'win' ? styles.win : null,
                  ]}>
                  <View
                    style={odd && board.b.kind === 'flip' ? styles.flipped : null}
                    pointerEvents="none">
                    <Shape name="triangle" size={tile * 0.42} fill={color.text.primary} />
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grid: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  win: { borderWidth: 3, borderColor: color.game.sun },
  dim: { opacity: 0.15 },
  bad: { opacity: 0.4 },
  flipped: { transform: [{ rotate: '180deg' }] },
});
