import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import { useGridDrag } from '../../kit/useDrag';
import pack from './content.json';
import {
  cornerTip,
  isPainted,
  isTrapped,
  paintHue,
  paintMove,
  paintStars,
  paintTouch,
  restartIsWipe,
  PAINT_BOARDS,
  PAINT_BOARD_POINTS,
  PAINT_CELL_POINTS,
  PAINT_SECONDS,
  type PaintBoard,
} from './logic';

/** The generated boards (rocks and the stored path are [row, col] pairs). */
const PACK: ContentPack<PaintBoard> = { ...pack, items: pack.items as PaintBoard[] };
const POLL_MS = 40;
/** Prototype timings: the trapped stroke stays up, then the board wipes clean. */
const TRAP_SHOW_MS = 800;
const WIPE_MS = 300;
const LIT_MS = 1200;
const PAINT_FADE_MS = 200;

export default function PathPainterRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const [board, setBoard] = useState<PaintBoard | null>(null);
  const [path, setPath] = useState<readonly number[]>([]);
  const [lit, setLit] = useState(false);
  const n = board?.size ?? 5;
  const pad = space.sm;
  const gap = space.xs;
  const boardW = Math.min(W, api.board.height * 0.8);
  const pitch = (boardW - pad * 2) / n;
  const top = Math.max(0, Math.min(space['2xl'], api.board.height - boardW));

  // Input state lives in refs: the drag reports straight into these, the loop polls them.
  const live = useRef<{ board: PaintBoard | null; path: number[]; scored: Set<number> }>({
    board: null,
    path: [],
    scored: new Set(),
  });
  const open = useRef(false);
  /** After a trap mid-drag, ignore the rest of that drag until the next touch. */
  const dead = useRef(false);
  const status = useRef<'trapped' | 'painted' | null>(null);
  const wipes = useRef(0);

  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  const commit = (next: number[]) => {
    const s = live.current;
    const b = s.board!;
    s.path = next;
    setPath(next);
    api.haptic('tap');
    api.sound('tap');
    const head = next[next.length - 1];
    // Points once per square per board, so painting back and forth earns nothing.
    if (head !== undefined && !s.scored.has(head)) {
      s.scored.add(head);
      api.addScore(PAINT_CELL_POINTS);
    }
    if (isPainted(b.size, b.rocks, next)) {
      open.current = false;
      status.current = 'painted';
    } else if (isTrapped(b.size, b.rocks, next)) {
      open.current = false;
      dead.current = true;
      status.current = 'trapped';
    }
  };

  const onTouch = (i: number) => {
    const s = live.current;
    if (!open.current || !s.board) return;
    dead.current = false;
    const p = s.path;
    switch (paintTouch(s.board.size, s.board.rocks, p, i)) {
      case 'continue':
        api.haptic('tap');
        return;
      case 'extend':
        return commit([...p, i]);
      case 'undo':
        return commit(p.slice(0, -1));
      case 'restart':
        if (restartIsWipe(p)) wipes.current++;
        return commit([i]);
      case 'none':
        return;
    }
  };

  const onEnter = (i: number) => {
    const s = live.current;
    if (!open.current || dead.current || !s.board) return;
    const m = paintMove(s.board.size, s.board.rocks, s.path, i);
    if (m === 'extend') commit([...s.path, i]);
    else if (m === 'undo') commit(s.path.slice(0, -1));
  };

  const drag = useGridDrag(
    { x: pad, y: pad, cell: pitch, cols: n, rows: n },
    { onStart: onTouch, onEnter },
  );

  useRoundLoop(api, async () => {
    const boards = pickRoundItems('pathPainter', PACK, seed, PAINT_BOARDS);
    const timer = api.timer(PAINT_SECONDS);
    let done = 0;
    api.combo(0);
    for (const [bi, b] of boards.entries()) {
      if (timer.done()) break;
      api.setRound(t('games.pathPainter.board', { n: bi + 1, total: PAINT_BOARDS }));
      live.current = { board: b, path: [], scored: new Set() };
      status.current = null;
      setBoard(b);
      setPath([]);
      setLit(false);
      api.hint(t('games.pathPainter.hint'));
      open.current = true;
      while (!timer.done()) {
        while (status.current === null && !timer.done()) await api.wait(POLL_MS);
        if (status.current === 'trapped') {
          wipes.current++;
          api.fx.oops();
          api.hint(
            t(cornerTip(b) ? 'games.pathPainter.trappedCorner' : 'games.pathPainter.trapped'),
            'bad',
          );
          await api.wait(TRAP_SHOW_MS);
          live.current.path = [];
          setPath([]);
          await api.wait(WIPE_MS);
          status.current = null;
          open.current = true;
        } else if (status.current === 'painted') {
          done++;
          api.combo(done);
          setLit(true);
          if (!api.reducedMotion)
            pulse.set(
              withSequence(withTiming(1.04, { duration: 300 }), withTiming(1, { duration: 300 })),
            );
          api.fx.ring(W / 2, top + boardW / 2, color.game.sky, boardW * 0.8);
          api.addScore(PAINT_BOARD_POINTS);
          api.haptic('good');
          api.sound('chime');
          api.fx.toast(t('games.pathPainter.allPainted'), color.game.sky);
          await api.wait(LIT_MS);
          break;
        }
      }
    }
    open.current = false;
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const w = wipes.current;
    const boardsLabel = t('games.pathPainter.statBoards', { n: done, total: PAINT_BOARDS });
    api.finish({
      title: done ? t('games.pathPainter.title') : t('games.pathPainter.titleNone'),
      stars: paintStars(w, done),
      stats: [boardsLabel, t('games.pathPainter.statWipes', { count: w })],
      best: { value: done, label: boardsLabel },
      items: boards.map((b) => b.id),
    });
  });

  // Where each painted square sits along the path (for its hue) and which one is the head.
  const step = useMemo(() => {
    const m = new Map<number, number>();
    path.forEach((c, k) => m.set(c, k));
    return m;
  }, [path]);
  const head = path[path.length - 1];
  const rocks = useMemo(() => new Set((board?.rocks ?? []).map(([r, c]) => r * n + c)), [board, n]);

  if (!board) return <View style={styles.fill} />;
  const cellSize = pitch - gap;

  return (
    <View style={styles.fill}>
      <GestureDetector gesture={drag}>
        <Animated.View
          testID="game.pathPainter.board"
          style={[{ width: boardW, height: boardW, marginTop: top }, styles.center, pulseStyle]}>
          <Well
            style={StyleSheet.absoluteFill}
            accessibilityLabel={t('games.pathPainter.boardLabel', {
              painted: path.length,
              total: n * n - rocks.size,
            })}
          />
          {Array.from({ length: n * n }, (_, i) => {
            const r = Math.floor(i / n);
            const c = i % n;
            const rock = rocks.has(i);
            const k = step.get(i);
            const state = rock
              ? 'cellRock'
              : i === head
                ? 'cellHead'
                : k !== undefined
                  ? 'cellPainted'
                  : 'cellFree';
            return (
              <View
                key={i}
                testID={`game.pathPainter.cell${i}`}
                accessible
                accessibilityRole="button"
                accessibilityLabel={t(`games.pathPainter.${state}`, { row: r + 1, col: c + 1 })}
                accessibilityActions={rock ? [] : [{ name: 'activate' }]}
                onAccessibilityAction={() => onTouch(i)}
                style={[
                  styles.cell,
                  rock ? styles.rock : styles.ceramic,
                  {
                    left: pad + c * pitch + gap / 2,
                    top: pad + r * pitch + gap / 2,
                    width: cellSize,
                    height: cellSize,
                  },
                ]}>
                {rock ? <View style={styles.rockShine} /> : null}
                {k !== undefined ? (
                  <Animated.View
                    {...(api.reducedMotion ? {} : { entering: FadeIn.duration(PAINT_FADE_MS) })}
                    style={[styles.enamel, { backgroundColor: color.game[paintHue(k)] }]}>
                    <View style={[styles.shine, lit ? styles.shineLit : null]} />
                    {i === head && !lit ? (
                      <View
                        style={[styles.head, { width: cellSize * 0.28, height: cellSize * 0.28 }]}
                      />
                    ) : null}
                  </Animated.View>
                ) : null}
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignSelf: 'center' },
  cell: { position: 'absolute', overflow: 'hidden' },
  ceramic: {
    borderRadius: radius.md,
    backgroundColor: color.surface.control,
    borderTopWidth: 1,
    borderTopColor: color.surface.line,
  },
  rock: { borderRadius: radius.pill, backgroundColor: color.surface.ring },
  rockShine: {
    position: 'absolute',
    left: '18%',
    top: '14%',
    width: '40%',
    height: '34%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.12,
  },
  enamel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '6%',
    height: '22%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.3,
  },
  shineLit: { opacity: 0.55 },
  /** The path's end: touch here to carry on. */
  head: { borderRadius: radius.pill, backgroundColor: color.text.primary, opacity: 0.85 },
});
