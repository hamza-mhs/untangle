import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import type { ContentPack } from '../../kit/content';
import { useRoundLoop, Well } from '../../kit';
import { pickRoundItems } from '../../kit/roundContent';
import { useGridDrag } from '../../kit/useDrag';
import pack from './content.json';
import {
  brokenFlows,
  flowInit,
  flowStars,
  flowStep,
  flowTap,
  isJoined,
  isSolved,
  jewelOf,
  ownerOf,
  FLOW_BOARDS,
  FLOW_BOARD_POINTS,
  FLOW_JOIN_POINTS,
  FLOW_SECONDS,
  type FlowBoard,
  type FlowState,
} from './logic';

const POLL_MS = 40;
// JSON tuples widen to number[]; the pack test checks the shape.
const PACK = pack as unknown as ContentPack<FlowBoard>;
/** Jewel colours in pack order (prototype FCOL: pink, sky, sun, mint, violet, + orange). */
const JEWELS = ['pink', 'sky', 'sun', 'mint', 'violet', 'orange'] as const;
const tint = (f: number) => color.game[JEWELS[f % JEWELS.length]!];

/** One 5×5 board, then one 6×6 (falls back to whatever the pack has). */
function pickBoards(seed: number): FlowBoard[] {
  const out: FlowBoard[] = [];
  for (const n of [5, 6]) {
    const sized = { ...PACK, items: PACK.items.filter((b) => b.size === n) };
    out.push(...pickRoundItems('flowLines', sized, seed + n, 1));
  }
  if (out.length < FLOW_BOARDS) {
    const rest = PACK.items.filter((b) => !out.includes(b));
    out.push(
      ...pickRoundItems('flowLines', { ...PACK, items: rest }, seed, FLOW_BOARDS - out.length),
    );
  }
  return out;
}

export default function FlowLinesRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const [boards] = useState(() => pickBoards(seed));
  const [bi, setBi] = useState(0);
  const [s, setS] = useState<FlowState>(() => flowInit(boards[0]!));
  const [lit, setLit] = useState(false);
  const st = useRef(s);
  /** Colour being drawn (kept after lift so taps can continue it). */
  const active = useRef(-1);
  /** Which colours were joined when the finger last lifted (redraw detection). */
  const settled = useRef<boolean[]>([]);
  /** Colours already paid for on this board. */
  const paid = useRef<boolean[]>([]);
  const redraws = useRef(0);
  const boardRedraws = useRef(0);
  const open = useRef(false);

  const n = s.size;
  const pad = space.sm;
  const side = Math.min(W, api.board.height * 0.8);
  const cell = Math.floor((side - pad * 2) / n);
  const gridW = cell * n;
  const left = (W - gridW) / 2;
  const top = (api.board.height - gridW) / 2;
  const ctr = (i: number) => ({
    x: left + (i % n) * cell + cell / 2,
    y: top + Math.floor(i / n) * cell + cell / 2,
  });

  const load = (b: FlowBoard) => {
    const fresh = flowInit(b);
    st.current = fresh;
    setS(fresh);
    active.current = -1;
    settled.current = b.flows.map(() => false);
    paid.current = b.flows.map(() => false);
    boardRedraws.current = 0;
    setLit(false);
  };

  useRoundLoop(api, async () => {
    const timer = api.timer(FLOW_SECONDS);
    let done = 0;
    let streak = 0;
    api.combo(0);
    for (let k = 0; k < boards.length && !timer.done(); k++) {
      api.setRound(t('games.flowLines.boardOf', { n: k + 1, total: boards.length }));
      setBi(k);
      load(boards[k]!);
      api.hint(t('games.flowLines.hint'));
      open.current = true;
      while (!timer.done() && !isSolved(st.current)) await api.wait(POLL_MS);
      open.current = false;
      if (!isSolved(st.current)) break;
      done++;
      // Combo: boards in a row finished without a redraw.
      streak = boardRedraws.current ? 0 : streak + 1;
      api.combo(streak);
      setLit(true);
      api.addScore(FLOW_BOARD_POINTS);
      api.haptic('good');
      st.current.ends.forEach((e, f) => {
        const c = ctr(e[0]);
        api.fx.burst(c.x, c.y, tint(f), 6);
      });
      api.fx.toast(t('games.flowLines.lit'), color.signal.successText);
      await api.wait(1400);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const r = redraws.current;
    const boardsLabel = t('games.flowLines.statBoards', { n: done, total: boards.length });
    api.finish({
      title: t(done >= boards.length ? 'games.flowLines.title' : 'games.flowLines.titlePartial'),
      stars: flowStars(r, done),
      stats: [boardsLabel, t('games.flowLines.statRedraws', { count: r })],
      best: { value: done, label: boardsLabel },
      items: boards.map((b) => b.id),
    });
  });

  /** Applies a move: redraw count, "Connected" FX for newly joined colours, hints. */
  const apply = (next: FlowState, blocked: boolean) => {
    const prev = st.current;
    if (blocked) {
      api.fx.oops();
      api.hint(t('games.flowLines.blocked'), 'bad');
      return;
    }
    if (next === prev) return;
    st.current = next;
    setS(next);
    api.haptic('tap');
    for (const f of brokenFlows(next, settled.current)) {
      settled.current[f] = false;
      redraws.current++;
      boardRedraws.current++;
    }
    next.ends.forEach((e, f) => {
      if (isJoined(prev, f) || !isJoined(next, f)) return;
      const end = next.tubes[f]!.at(-1) ?? e[1];
      const c = ctr(end);
      if (!paid.current[f]) {
        paid.current[f] = true;
        api.addScore(FLOW_JOIN_POINTS);
        api.fx.hit(c.x, c.y, tint(f), FLOW_JOIN_POINTS);
      } else api.fx.ring(c.x, c.y, tint(f), cell);
      api.hint(t('games.flowLines.connected'), 'good');
    });
    if (!isSolved(next) && next.ends.every((_, f) => isJoined(next, f)))
      api.hint(t('games.flowLines.fillAll'));
  };

  const onStart = (i: number) => {
    if (!open.current) return;
    const r = flowTap(st.current, active.current, i);
    active.current = r.active;
    if (r.active >= 0) api.sound('tap');
    apply(r.state, r.blocked);
  };
  const onEnter = (i: number) => {
    if (!open.current || active.current < 0) return;
    const r = flowStep(st.current, active.current, i);
    apply(r.state, r.blocked);
  };
  const onEnd = () => {
    const cur = st.current;
    settled.current = cur.ends.map((_, f) => isJoined(cur, f));
  };

  const pan = useGridDrag({ x: 0, y: 0, cell, cols: n, rows: n }, { onStart, onEnter, onEnd });

  const colourName = (f: number) => t(`games.flowLines.colours.${JEWELS[f % JEWELS.length]!}`);
  const cellLabel = (i: number) => {
    const j = jewelOf(s, i);
    const o = ownerOf(s, i);
    const what =
      j >= 0
        ? t('games.flowLines.a11yJewel', { colour: colourName(j) })
        : o >= 0
          ? t('games.flowLines.a11yTube', { colour: colourName(o) })
          : t('games.flowLines.a11yEmpty');
    return t('games.flowLines.a11yCell', { r: Math.floor(i / n) + 1, c: (i % n) + 1, what });
  };
  const tap = (i: number) => {
    onStart(i);
    onEnd();
  };

  const pts = (tube: number[]) =>
    tube
      .map((i) => `${(i % n) * cell + cell / 2},${Math.floor(i / n) * cell + cell / 2}`)
      .join(' ');
  const tubeW = cell * 0.42;
  const jewel = cell * 0.62;
  const cells = Array.from({ length: n * n }, (_, i) => i);

  return (
    <View style={styles.fill}>
      <Well style={[styles.well, { left: left - pad, top: top - pad, padding: pad }]}>
        <GestureDetector gesture={pan}>
          <View key={boards[bi]?.id} style={{ width: gridW, height: gridW }}>
            {cells.map((i) => {
              const o = ownerOf(s, i);
              return (
                <View
                  key={i}
                  testID={`game.flowLines.cell${i}`}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={cellLabel(i)}
                  accessibilityActions={[{ name: 'activate' }]}
                  onAccessibilityAction={() => tap(i)}
                  style={[
                    styles.cell,
                    {
                      left: (i % n) * cell,
                      top: Math.floor(i / n) * cell,
                      width: cell,
                      height: cell,
                    },
                  ]}>
                  {o >= 0 ? <View style={[styles.wash, { backgroundColor: tint(o) }]} /> : null}
                </View>
              );
            })}
            <Svg width={gridW} height={gridW} style={StyleSheet.absoluteFill} pointerEvents="none">
              {s.tubes.map((tube, f) =>
                tube.length > 1 ? (
                  <Polyline
                    key={`t${f}`}
                    points={pts(tube)}
                    fill="none"
                    stroke={tint(f)}
                    strokeWidth={tubeW}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.92}
                  />
                ) : null,
              )}
              {s.tubes.map((tube, f) =>
                tube.length > 1 ? (
                  <Polyline
                    key={`h${f}`}
                    points={pts(tube)}
                    fill="none"
                    stroke={color.text.primary}
                    strokeOpacity={0.45}
                    strokeWidth={tubeW * 0.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`translate(${-tubeW * 0.15},${-tubeW * 0.2})`}
                  />
                ) : null,
              )}
            </Svg>
            {lit ? (
              // The finished board lights up like a circuit: a soft halo along every tube.
              <Animated.View
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                {...(api.reducedMotion ? {} : { entering: FadeIn.duration(350) })}>
                <Svg width={gridW} height={gridW}>
                  {s.tubes.map((tube, f) => (
                    <Polyline
                      key={f}
                      points={pts(tube)}
                      fill="none"
                      stroke={tint(f)}
                      strokeOpacity={0.35}
                      strokeWidth={tubeW * 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </Svg>
              </Animated.View>
            ) : null}
            {s.ends.map((e, f) =>
              e.map((i) => (
                <View
                  key={`${f}-${i}`}
                  pointerEvents="none"
                  style={[
                    styles.jewel,
                    {
                      left: (i % n) * cell + (cell - jewel) / 2,
                      top: Math.floor(i / n) * cell + (cell - jewel) / 2,
                      width: jewel,
                      height: jewel,
                      backgroundColor: tint(f),
                    },
                  ]}>
                  <View style={styles.shine} />
                </View>
              )),
            )}
          </View>
        </GestureDetector>
      </Well>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  well: { position: 'absolute' },
  cell: {
    position: 'absolute',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: color.surface.card,
    backgroundColor: color.bg.ink,
    overflow: 'hidden',
  },
  wash: { ...StyleSheet.absoluteFill, opacity: 0.14 },
  jewel: { position: 'absolute', borderRadius: radius.pill, overflow: 'hidden' },
  shine: {
    position: 'absolute',
    left: '18%',
    top: '12%',
    width: '40%',
    height: '28%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.35,
  },
});
