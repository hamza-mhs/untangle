import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { GameId } from '../../catalog';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import { usePointDrag } from '../../kit/useDrag';
import pack from './content.json';
import {
  chooseDrawings,
  closestPair,
  degrees,
  DRAWING_POINTS,
  edgeKey,
  fitDrawing,
  lineStars,
  LINE_DRAWINGS,
  LINE_POINTS,
  LINE_SECONDS,
  oddNodes,
  traceMove,
  type Drawing,
  type Trace,
} from './logic';

/** Not in the catalog's `GameId` union until the lead wires the game. */
const GAME_ID: GameId = 'oneLineArt';
const PACK = pack as unknown as ContentPack<Drawing>;
const POLL_MS = 40;
const STUCK_MS = 1100;
const CLEAR_MS = 300;
const DONE_MS = 1300;
/** Prototype `olpop`: the finished drawing swells 6 % and settles. */
const POP_SCALE = 1.06;
const POP_UP_MS = 240;
const POP_DOWN_MS = 360;

type Outcome = 'done' | 'stuck' | 'lifted';

export default function OneLineArtRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  // Fresh items first; one named icon in the pair whenever the pack still has one to serve.
  const [drawings] = useState(() =>
    chooseDrawings(pickRoundItems(GAME_ID, PACK, seed, PACK.items.length)),
  );
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<Trace | null>(null);
  const [finished, setFinished] = useState(false);
  const trace = useRef<Trace | null>(null);
  const drawing = useRef<Drawing>(drawings[0]!);
  const open = useRef(false);
  const outcome = useRef<Outcome | null>(null);
  /** The current gesture moved between nodes (a drag, not a tap), so lifting ends the stroke. */
  const dragged = useRef(false);
  /** The current gesture began away from the stroke's tip and is ignored. */
  const ignored = useRef(false);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  const d = drawings[index]!;
  // Board layout: lattice scaled to fit, line and node sizes from the prototype's
  // 40 dp unit (10 dp lines, 9 dp nodes), touch radius kept clear of the nearest node.
  const probe = fitDrawing(d.nodes, W, H, space['2xl']);
  const nodeR = probe.unit * 0.22;
  const { points, unit } = fitDrawing(d.nodes, W, H, space['2xl'] + nodeR);
  const lineW = unit * 0.25;
  const hitR = Math.min(size.touch * 0.6, closestPair(d.nodes) * unit * 0.48);
  const deg = degrees(d.nodes.length, d.edges);

  const clear = () => {
    trace.current = null;
    setView(null);
  };

  const reach = (i: number) => {
    if (!open.current || outcome.current || ignored.current) return;
    const r = traceMove(drawing.current, trace.current, i);
    if (r.move === 'same' || r.move === 'none') return;
    trace.current = r.trace;
    setView(r.trace);
    if (r.move === 'repeat' || r.move === 'deadEnd') {
      outcome.current = 'stuck';
      return;
    }
    api.haptic('tap');
    api.sound('tap');
    if (r.move === 'start') return;
    api.addScore(LINE_POINTS);
    if (r.move === 'done') outcome.current = 'done';
  };

  const onStart = (i: number) => {
    dragged.current = false;
    ignored.current = false;
    const tr = trace.current;
    if (tr && i !== tr.at && traceMove(drawing.current, tr, i).move === 'none') {
      // A new touch away from the tip: before any line it moves the start; after, it's ignored.
      if (tr.used.length) ignored.current = true;
      else trace.current = null;
    }
    reach(i);
  };
  const onEnter = (i: number) => {
    dragged.current = true;
    reach(i);
  };
  const onEnd = () => {
    // One stroke: lifting after dragging part of the drawing starts it over. Taps (TalkBack,
    // node by node) never move between nodes within a touch, so they carry on.
    if (
      !ignored.current &&
      dragged.current &&
      open.current &&
      !outcome.current &&
      trace.current?.used.length
    )
      outcome.current = 'lifted';
    dragged.current = false;
    ignored.current = false;
  };
  const tapNode = (i: number) => {
    onStart(i);
    onEnd();
  };

  const gesture = usePointDrag(points, hitR, { onStart, onEnter, onEnd });

  useRoundLoop(api, async () => {
    const timer = api.timer(LINE_SECONDS);
    let drawn = 0;
    let resets = 0;
    let shown = 0;
    api.combo(0);
    for (let k = 0; k < drawings.length && !timer.done(); k++) {
      const dw = drawings[k]!;
      drawing.current = dw;
      shown = k + 1;
      clear();
      setFinished(false);
      pop.set(1);
      setIndex(k);
      api.setRound(
        dw.name
          ? dw.name.toUpperCase()
          : t('games.oneLineArt.drawingOf', { n: k + 1, total: drawings.length }),
      );
      api.hint(t('games.oneLineArt.hint'));
      const odd = oddNodes(dw.nodes.length, dw.edges).length > 0;
      outcome.current = null;
      open.current = true;
      while (!timer.done()) {
        while (!outcome.current && !timer.done()) await api.wait(POLL_MS);
        const o = outcome.current;
        if (!o) break;
        open.current = false;
        if (o === 'done') {
          drawn++;
          api.combo(drawn);
          setFinished(true);
          if (!api.reducedMotion)
            pop.set(
              withSequence(
                withTiming(POP_SCALE, { duration: POP_UP_MS }),
                withTiming(1, { duration: POP_DOWN_MS }),
              ),
            );
          api.addScore(DRAWING_POINTS);
          api.fx.ring(W / 2, H / 2, color.game.sun, Math.min(W, H) * 0.6);
          api.fx.burst(W / 2, H / 2, color.game.sun, 16);
          api.fx.toast(dw.name ?? t('games.oneLineArt.oneLine'), color.game.sun);
          api.hint(t('games.oneLineArt.oneLine'), 'good');
          await api.wait(DONE_MS);
          break;
        }
        // Stuck (a repeated line or a dead end) or lifted: start over, with the tip.
        resets++;
        api.fx.oops();
        api.hint(
          t(
            o === 'lifted'
              ? odd
                ? 'games.oneLineArt.liftOdd'
                : 'games.oneLineArt.liftAny'
              : odd
                ? 'games.oneLineArt.stuckOdd'
                : 'games.oneLineArt.stuckAny',
          ),
          'bad',
        );
        await api.wait(STUCK_MS);
        clear();
        await api.wait(CLEAR_MS);
        outcome.current = null;
        open.current = true;
      }
      open.current = false;
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const stat = t('games.oneLineArt.statDrawings', { n: drawn, total: LINE_DRAWINGS });
    api.finish({
      title: drawn ? t('games.oneLineArt.title') : t('games.oneLineArt.titleNone'),
      stars: lineStars(resets, drawn),
      stats: [stat, t('games.oneLineArt.statResets', { count: resets })],
      best: { value: drawn, label: stat },
      items: drawings.slice(0, shown).map((x) => x.id),
    });
  });

  const used = new Set(view?.used ?? []);
  const lit = new Set<number>();
  if (view) lit.add(view.at);
  for (const [a, b] of d.edges)
    if (used.has(edgeKey(a, b))) {
      lit.add(a);
      lit.add(b);
    }

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.fill} testID="game.oneLineArt.board">
        <Animated.View
          key={d.id}
          style={[StyleSheet.absoluteFill, popStyle]}
          pointerEvents="none"
          {...(api.reducedMotion ? {} : { entering: FadeIn.duration(260) })}>
          <Svg width={W} height={H}>
            {/* Gold halo under drawn lines (the prototype's drop-shadow glow). */}
            {d.edges.map(([a, b]) =>
              used.has(edgeKey(a, b)) ? (
                <Line
                  key={`h${edgeKey(a, b)}`}
                  x1={points[a]!.x}
                  y1={points[a]!.y}
                  x2={points[b]!.x}
                  y2={points[b]!.y}
                  stroke={color.game.sun}
                  strokeOpacity={finished ? 0.45 : 0.25}
                  strokeWidth={lineW * 2}
                  strokeLinecap="round"
                />
              ) : null,
            )}
            {d.edges.map(([a, b]) => (
              <Line
                key={edgeKey(a, b)}
                x1={points[a]!.x}
                y1={points[a]!.y}
                x2={points[b]!.x}
                y2={points[b]!.y}
                stroke={used.has(edgeKey(a, b)) ? color.game.sun : color.surface.controlStrong}
                strokeWidth={lineW}
                strokeLinecap="round"
              />
            ))}
            {view && !finished ? (
              <Circle
                cx={points[view.at]!.x}
                cy={points[view.at]!.y}
                r={nodeR * 1.9}
                fill="none"
                stroke={color.game.sun}
                strokeOpacity={0.5}
                strokeWidth={lineW * 0.4}
              />
            ) : null}
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill={lit.has(i) ? color.game.sun : color.surface.ring}
                stroke={color.bg.ink}
                strokeWidth={nodeR / 3}
              />
            ))}
          </Svg>
        </Animated.View>
        {/* Touch and TalkBack targets: the drag reads coordinates; these give each node a
            label and an activate action (tap a start, then neighbouring nodes one by one). */}
        {points.map((p, i) => (
          <View
            key={`${d.id}-${i}`}
            testID={`game.oneLineArt.node${i}`}
            pointerEvents="none"
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('games.oneLineArt.point', {
              n: i + 1,
              total: points.length,
              count: deg[i],
            })}
            accessibilityState={{ selected: lit.has(i) }}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={() => tapNode(i)}
            style={[
              styles.target,
              { left: p.x - hitR, top: p.y - hitR, width: hitR * 2, height: hitR * 2 },
            ]}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  target: { position: 'absolute' },
});
