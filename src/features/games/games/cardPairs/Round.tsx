import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { Shape, useRoundLoop } from '../../kit';
import { dealPairs, pairsStars, PAIRS, type Face } from './logic';

const POLL_MS = 40;

const FACE_TINT: Record<Face, string> = {
  sun: color.game.sun,
  moon: color.game.cobalt,
  star: color.game.orange,
  heart: color.game.coral,
  leaf: color.game.mint,
  drop: color.game.sky,
  bolt: color.game.violet,
  flower: color.game.pink,
};
const MEMORISE_MS = 3000;
const MISMATCH_MS = 700;

export default function CardPairsRound({ api, seed }: RoundProps) {
  const t = useT();
  const [deck] = useState(() => dealPairs(seed));
  const [up, setUp] = useState<Set<number>>(() => new Set(deck.map((_, i) => i)));
  const [found, setFound] = useState<Set<number>>(new Set());
  const open = useRef<number[]>([]);
  const state = useRef({ moves: 0, found: 0, locked: true });
  const cols = 3;
  const gap = space.sm;
  const cw = (api.board.width - gap * (cols - 1)) / cols;
  const ch = Math.min(cw * 1.25, (api.board.height - gap * 3) / 4);

  useRoundLoop(api, async () => {
    api.quiet(true);
    api.hint(t('games.cardPairs.memorise'));
    api.setRound(t('games.cardPairs.round'));
    await api.wait(MEMORISE_MS);
    api.quiet(false);
    setUp(new Set());
    state.current.locked = false;
    api.hint(t('games.cardPairs.find'));
    const timer = api.timer(40);
    while (!timer.done() && state.current.found < PAIRS) await api.wait(POLL_MS);
    state.current.locked = true;
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(600);
    const { moves, found: f } = state.current;
    const secs = Math.round((40_000 - timer.left()) / 1000);
    api.finish({
      title: f === PAIRS ? t('games.cardPairs.titleAll') : t('games.cardPairs.titleGood'),
      stars: pairsStars(f, moves),
      score: f * 20 + Math.max(0, 40 - moves) * 2,
      stats: [
        t('games.cardPairs.statMoves', { count: moves }),
        t('games.cardPairs.statSecs', { s: secs }),
      ],
      ...(f === PAIRS
        ? { best: { value: moves, label: t('games.cardPairs.statMoves', { count: moves }) } }
        : {}),
    });
  });

  const flip = async (i: number) => {
    const s = state.current;
    if (s.locked || up.has(i) || found.has(i) || open.current.length >= 2) return;
    api.haptic('tap');
    api.sound('tap');
    open.current = [...open.current, i];
    setUp((u) => new Set(u).add(i));
    if (open.current.length < 2) return;
    s.moves++;
    const [a, b] = open.current as [number, number];
    const x = (b % cols) * (cw + gap) + cw / 2;
    const y = Math.floor(b / cols) * (ch + gap) + ch / 2;
    if (deck[a] === deck[b]) {
      s.found++;
      setFound((f) => new Set(f).add(a).add(b));
      api.addScore(20);
      api.combo(s.found);
      api.fx.hit(x, y, FACE_TINT[deck[a]!], 20);
      api.hint(t('games.cardPairs.pair'), 'good');
      open.current = [];
    } else {
      api.hint(t('games.cardPairs.noPair'), 'bad');
      try {
        await api.wait(MISMATCH_MS);
      } catch {
        return;
      }
      setUp((u) => {
        const n = new Set(u);
        n.delete(a);
        n.delete(b);
        return n;
      });
      open.current = [];
    }
  };

  return (
    <View style={[styles.fill, styles.cards]}>
      {deck.map((f, i) => {
        const faceUp = up.has(i) || found.has(i);
        return (
          <PressableScale
            key={i}
            testID={`game.cardPairs.${i}`}
            accessibilityRole="button"
            accessibilityLabel={
              faceUp ? t(`games.cardPairs.faces.${f}`) : t('games.cardPairs.faceDown')
            }
            accessibilityState={{ selected: found.has(i) }}
            onPress={() => void flip(i)}
            style={[
              styles.card,
              {
                width: cw,
                height: ch,
                backgroundColor: faceUp ? color.surface.raised : color.game.pink,
              },
              found.has(i) ? styles.cardFound : null,
            ]}>
            {faceUp ? (
              <Shape name={f} size={Math.min(cw, ch) * 0.5} fill={FACE_TINT[f]} />
            ) : (
              <Shape name="diamond" size={Math.min(cw, ch) * 0.3} />
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignContent: 'center' },
  card: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardFound: { borderWidth: 2, borderColor: color.signal.success },
});
