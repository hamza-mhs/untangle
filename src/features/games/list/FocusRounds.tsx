import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../engine/types';
import { Shape, ToyKey, useRoundLoop } from './kit';
import {
  arrowStars,
  arrowTrials,
  averageMs,
  colourStars,
  colourTrials,
  COLOUR_TRIALS,
  dealPairs,
  echoIsMatch,
  echoSequence,
  echoStars,
  INKS,
  pairsStars,
  PAIRS,
  popSchedule,
  redStars,
  TAP_COLS,
  TAP_ROWS,
  type ArrowTrial,
  type ColourTrial,
  type Dir,
  type EchoShape,
  type Face,
  type Ink,
  type Pop,
} from './logic';

const INK_COLOR: Record<Ink, string> = {
  red: color.game.coral,
  blue: color.game.sky,
  green: color.game.mint,
  yellow: color.game.sun,
};
const POLL_MS = 40;

type Centers = Record<string, { x: number; y: number }>;

/** Keeps the centre of each laid-out element, in board coordinates. */
function useCenters() {
  const ref = useRef<Centers>({});
  const on =
    (key: string, offset = { x: 0, y: 0 }) =>
    (e: LayoutChangeEvent) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      ref.current[key] = { x: offset.x + x + width / 2, y: offset.y + y + height / 2 };
    };
  return { centers: ref, on };
}

// ───────────────────────── Colour word ─────────────────────────

export function ColourWordRound({ api, seed }: RoundProps) {
  const t = useT();
  const [trial, setTrial] = useState<ColourTrial | null>(null);
  const answer = useRef<Ink | null>(null);
  const keysTop = useRef(0);
  const { centers, on } = useCenters();
  const [n, setN] = useState(0);

  useRoundLoop(api, async () => {
    const trials = colourTrials(seed);
    const timer = api.timer(40);
    let right = 0;
    let slips = 0;
    let streak = 0;
    let i = 0;
    api.combo(0);
    for (; i < trials.length && !timer.done(); i++) {
      api.setRound(t('games.hud.of', { n: i + 1, total: COLOUR_TRIALS }));
      answer.current = null;
      setTrial(trials[i]!);
      setN(i);
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      const a = answer.current;
      if (a === null) break;
      const c = centers.current[a] ?? { x: api.board.width / 2, y: api.board.height / 2 };
      if (a === trials[i]!.ink) {
        right++;
        streak++;
        const pts = 10 + Math.min(streak - 1, 5) * 2;
        api.addScore(pts);
        api.combo(streak);
        api.fx.hit(c.x, c.y + keysTop.current, color.text.primary, pts);
        api.hint(t('games.colourWord.right'), 'good');
      } else {
        slips++;
        streak = 0;
        api.combo(0);
        api.fx.oops();
        api.hint(t('games.colourWord.slip'), 'bad');
      }
      await api.wait(260);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    api.finish({
      title: right >= 12 ? t('games.colourWord.titleSharp') : t('games.colourWord.titleNice'),
      stars: colourStars(right),
      score: right * 10,
      stats: [
        t('games.colourWord.statRight', { right, n: Math.max(i, 1) }),
        t('games.common.slips', { count: slips }),
      ],
      best: { value: right, label: t('games.colourWord.statRight', { right, n: Math.max(i, 1) }) },
    });
  });

  return (
    <View style={styles.fill}>
      <View style={styles.wordBox}>
        {trial ? (
          <Text
            key={n}
            variant="statXl"
            align="center"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ color: INK_COLOR[trial.ink] }}
            accessibilityLabel={t('games.colourWord.a11y', {
              word: t(`games.colourWord.inks.${trial.word}`),
              ink: t(`games.colourWord.inks.${trial.ink}`),
            })}>
            {t(`games.colourWord.inks.${trial.word}`).toUpperCase()}
          </Text>
        ) : null}
      </View>
      <View style={styles.grid} onLayout={(e) => (keysTop.current = e.nativeEvent.layout.y)}>
        {INKS.map((ink) => (
          <View key={ink} style={styles.cell2} onLayout={on(ink)}>
            <ToyKey
              testID={`game.colourWord.${ink}`}
              tint={INK_COLOR[ink]}
              accessibilityLabel={t(`games.colourWord.inks.${ink}`)}
              onPress={() => {
                api.haptic('tap');
                if (answer.current === null) answer.current = ink;
              }}
              style={styles.bigKey}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────────────────────── Middle arrow ─────────────────────────

const ARROW = { left: '◀', right: '▶' } as const;

export function MiddleArrowRound({ api, seed }: RoundProps) {
  const t = useT();
  const [trial, setTrial] = useState<ArrowTrial | null>(null);
  const answer = useRef<Dir | null>(null);

  useRoundLoop(api, async () => {
    const trials = arrowTrials(seed);
    const timer = api.timer(40);
    const times: number[] = [];
    let right = 0;
    let streak = 0;
    let i = 0;
    api.combo(0);
    for (; i < trials.length && !timer.done(); i++) {
      api.setRound(t('games.hud.of', { n: i + 1, total: trials.length }));
      setTrial(null);
      await api.wait(250);
      answer.current = null;
      setTrial(trials[i]!);
      const shown = api.clock.now();
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS / 2);
      if (answer.current === null) break;
      const ms = api.clock.now() - shown;
      if (answer.current === trials[i]!.middle) {
        right++;
        streak++;
        times.push(ms);
        const pts = Math.max(5, 30 - Math.round(ms / 50));
        api.addScore(pts);
        api.combo(streak);
        api.fx.float(
          api.board.width / 2,
          api.board.height * 0.3,
          `${Math.round(ms)} ms`,
          color.signal.success,
        );
        api.hint(t('games.middleArrow.right'), 'good');
      } else {
        streak = 0;
        api.combo(0);
        api.fx.oops();
        api.hint(t('games.middleArrow.wrong'), 'bad');
      }
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const avg = averageMs(times);
    api.finish({
      title: t('games.middleArrow.title'),
      stars: arrowStars(right),
      score: right * 10,
      stats: [
        t('games.middleArrow.statRight', { right, n: Math.max(i, 1) }),
        t('games.middleArrow.statAvg', { ms: avg }),
      ],
      ...(right
        ? { best: { value: avg, label: t('games.middleArrow.statAvg', { ms: avg }) } }
        : {}),
    });
  });

  const press = (d: Dir) => {
    api.haptic('tap');
    if (answer.current === null) answer.current = d;
  };
  return (
    <View style={styles.fill}>
      <View style={styles.wordBox}>
        {trial ? (
          <View
            style={styles.arrows}
            accessible
            accessibilityLabel={t('games.middleArrow.a11y', {
              dir: t(`games.middleArrow.${trial.middle}`),
            })}>
            {[0, 1, 2, 3, 4].map((k) => (
              <Text key={k} variant="statLg" style={k === 2 ? styles.middle : styles.flank}>
                {ARROW[k === 2 ? trial.middle : trial.flank]}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        {(['left', 'right'] as const).map((d) => (
          <ToyKey
            key={d}
            testID={`game.middleArrow.${d}`}
            tint={color.game.sky}
            accessibilityLabel={t(`games.middleArrow.${d}`)}
            onPress={() => press(d)}
            style={styles.arrowKey}>
            <Text variant="statLg">{ARROW[d]}</Text>
          </ToyKey>
        ))}
      </View>
    </View>
  );
}

// ───────────────────────── Don't tap red ─────────────────────────

const SAFE = [color.game.sky, color.game.mint, color.game.sun, color.game.violet, color.game.pink];

export function DontTapRedRound({ api, seed }: RoundProps) {
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

// ───────────────────────── Echo ─────────────────────────

const ECHO_TINT: Record<EchoShape, string> = {
  circle: color.game.sky,
  square: color.game.pink,
  triangle: color.game.sun,
  diamond: color.game.mint,
  star: color.game.orange,
  hex: color.game.violet,
};
const ECHO_SHOW_MS = 1700;

export function EchoRound({ api, seed }: RoundProps) {
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
          pressed.current = true;
        }}
        style={styles.matchKey}>
        <Text variant="title">{t('games.echo.matchButton')}</Text>
      </ToyKey>
    </View>
  );
}

// ───────────────────────── Card pairs ─────────────────────────

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

export function CardPairsRound({ api, seed }: RoundProps) {
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
  wordBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingBottom: space.md },
  cell2: { width: '47.5%' },
  bigKey: { height: size.touch * 3 },
  arrows: { flexDirection: 'row', gap: space.sm },
  middle: { color: color.text.primary },
  flank: { color: color.text.secondary },
  row: { flexDirection: 'row', gap: space.md, paddingBottom: space.md },
  arrowKey: { flex: 1, height: size.touch * 2.6 },
  pop: { position: 'absolute' },
  matchKey: { height: size.touch * 2, marginBottom: space.md },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignContent: 'center' },
  card: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardFound: { borderWidth: 2, borderColor: color.signal.success },
});
