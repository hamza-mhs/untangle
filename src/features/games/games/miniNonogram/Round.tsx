import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { PressableScale, Text } from '@/design/components';
import { color, motion, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { GameId } from '../../catalog';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import pack from './content.json';
import {
  clues,
  colDone,
  grid,
  nonoMark,
  nonoSolved,
  nonoStars,
  nonoTap,
  rowDone,
  NONO_FILL_POINTS,
  NONO_LIVES,
  NONO_SECONDS,
  NONO_SIZE,
  NONO_SOLVE_POINTS,
  type NonoBoard,
  type NonoCell,
} from './logic';

/** Not in the catalog's `GameId` union until the lead wires the batch. */
const GAME_ID: GameId = 'miniNonogram';
const N = NONO_SIZE;
const POLL_MS = 50;
/** Prototype layout in cell pitches: 56 px clue band, 5 px board inset, on a 36 px pitch. */
const CLUE_F = 1.55;
const INSET_F = 0.14;
const UNITS = CLUE_F + N + INSET_F * 2;
/** Prototype `.nnb` lift: 0.6 s, slight overshoot. */
const LIFT_MS = 600;
/** Picture squares light up one after another (prototype: 25 ms per square). */
const PIC_STEP_MS = 25;

export default function MiniNonogramRound({ api, seed }: RoundProps) {
  const t = useT();
  const [board] = useState(
    () => pickRoundItems(GAME_ID, pack as ContentPack<NonoBoard>, seed, 1)[0]!,
  );
  const [target] = useState(() => grid(board));
  const [clue] = useState(() => clues(target));
  const [cells, setCells] = useState<NonoCell[]>(() => new Array<NonoCell>(N * N).fill('empty'));
  /** Squares up to this index show the finished picture (pink). */
  const [picN, setPicN] = useState(0);
  const [lifted, setLifted] = useState(false);
  const cellsRef = useRef(cells);
  const open = useRef(false);
  const solved = useRef(false);
  const left = useRef(NONO_LIVES);
  const mist = useRef(0);
  const filledAny = useRef(false);
  const lives = useRef<{ lose: () => number } | null>(null);
  const lift = useSharedValue(0);

  // Board geometry, laid out by the board's width (prototype pitch 36, cell 34).
  const W = api.board.width;
  const S = Math.min((W * 0.92) / UNITS, (api.board.height * 0.85) / UNITS);
  const clueW = S * CLUE_F;
  const inset = S * INSET_F;
  const boardW = S * N + inset * 2;
  const groupW = clueW + boardW;
  const left0 = (W - groupW) / 2;
  const top0 = (api.board.height - groupW) / 2;
  const boardLeft = left0 + clueW;
  const boardTop = top0 + clueW;
  const clueVariant = S >= 42 ? 'bodyStrong' : 'caption';

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -space.sm * lift.get() }, { scale: 1 + 0.04 * lift.get() }],
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: 0.35 * lift.get() }));

  useRoundLoop(api, async () => {
    const timer = api.timer(NONO_SECONDS);
    lives.current = api.lives(NONO_LIVES);
    api.setRound(t('games.miniNonogram.round'));
    api.hint(t('games.miniNonogram.hint'));
    open.current = true;
    while (!timer.done() && !solved.current && left.current > 0) await api.wait(POLL_MS);
    open.current = false;

    if (solved.current) {
      // Clear the ✕s and marks, then the picture lights up square by square and lifts off.
      const clean = cellsRef.current.map((c) => (c === 'filled' ? c : 'empty'));
      cellsRef.current = clean;
      setCells(clean);
      api.hint(t('games.miniNonogram.solvedHint'), 'good');
      if (api.reducedMotion) setPicN(N * N);
      else
        for (let i = 1; i <= N * N; i++) {
          setPicN(i);
          await api.wait(PIC_STEP_MS);
        }
      await api.wait(api.reducedMotion ? 200 : 100);
      setLifted(true);
      lift.set(
        api.reducedMotion
          ? 1
          : withTiming(1, { duration: LIFT_MS, easing: Easing.bezier(...motion.easing.pop) }),
      );
      const cx = boardLeft + boardW / 2;
      const cy = boardTop + boardW / 2;
      api.fx.ring(cx, cy, color.game.pink, boardW);
      api.fx.burst(cx, cy, color.game.pink, 18);
      api.fx.toast(
        board.name
          ? t('games.miniNonogram.solvedNamed', { name: board.name })
          : t('games.miniNonogram.solved'),
        color.game.pink,
      );
      api.addScore(NONO_SOLVE_POINTS);
      await api.wait(1400);
    } else {
      api.fx.toast(
        timer.done() ? t('games.hud.timeUp') : t('games.miniNonogram.outOfLives'),
        color.signal.danger,
      );
      await api.wait(700);
    }

    const m = mist.current;
    const done = solved.current;
    const filled = cellsRef.current.filter((c) => c === 'filled').length;
    const total = target.flat().filter(Boolean).length;
    const mistakes = t('games.miniNonogram.statMistakes', { count: m });
    api.finish({
      title: t(done ? 'games.miniNonogram.title' : 'games.miniNonogram.titleUnsolved'),
      stars: nonoStars(m, done),
      stats: [
        done
          ? t('games.miniNonogram.statPictures', { count: 1 })
          : t('games.miniNonogram.statSquares', { n: filled, total }),
        mistakes,
      ],
      // Fewer mistakes is better, so only a finished picture can set a record.
      ...(done ? { best: { value: m, label: mistakes } } : {}),
      items: [board.id],
    });
  });

  const commit = (next: NonoCell[]) => {
    cellsRef.current = next;
    setCells(next);
  };

  const onTap = (i: number) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    const res = nonoTap(target, cellsRef.current, i);
    if (res === 'none') return;
    const next = [...cellsRef.current];
    if (res === 'fill') {
      next[i] = 'filled';
      api.addScore(NONO_FILL_POINTS);
      if (!filledAny.current) {
        filledAny.current = true;
        api.hint(t('games.miniNonogram.markHint'));
      }
    } else {
      next[i] = 'miss';
      mist.current++;
      api.fx.oops();
      left.current = lives.current?.lose() ?? 0;
      api.hint(t('games.miniNonogram.miss'), 'bad');
    }
    commit(next);
    if (nonoSolved(target, next)) {
      solved.current = true;
      open.current = false;
    }
  };

  /** Long-press marks a square as empty without risk (and clears the mark again). */
  const onHold = (i: number) => {
    if (!open.current) return;
    const cur = cellsRef.current[i]!;
    const mark = nonoMark(cur);
    if (mark === cur) return;
    api.haptic('tap');
    api.sound('tap');
    const next = [...cellsRef.current];
    next[i] = mark;
    commit(next);
  };

  const cellSize = S - 2;
  return (
    <View style={styles.fill}>
      {clue.cols.map((c, i) => (
        <View
          key={`c${i}`}
          style={[
            styles.colClue,
            { left: boardLeft + inset + i * S, top: top0, width: S, height: clueW - space.xs },
          ]}>
          <Text
            variant={clueVariant}
            align="center"
            accessibilityLabel={t('games.miniNonogram.colClue', { n: i + 1, clue: c.join(' ') })}
            style={colDone(target, cells, i) ? styles.done : styles.clue}>
            {c.join('\n')}
          </Text>
        </View>
      ))}
      {clue.rows.map((r, i) => (
        <View
          key={`r${i}`}
          style={[
            styles.rowClue,
            { left: left0, top: boardTop + inset + i * S, width: clueW - space.sm, height: S },
          ]}>
          <Text
            variant={clueVariant}
            align="right"
            accessibilityLabel={t('games.miniNonogram.rowClue', { n: i + 1, clue: r.join(' ') })}
            style={rowDone(target, cells, i) ? styles.done : styles.clue}>
            {r.join('  ')}
          </Text>
        </View>
      ))}
      <Animated.View
        style={[
          styles.boardBox,
          { left: boardLeft, top: boardTop, width: boardW, height: boardW },
          liftStyle,
        ]}>
        {lifted ? <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} /> : null}
        <Well style={styles.board}>
          {cells.map((cell, i) => {
            const r = Math.floor(i / N);
            const c = i % N;
            const pic = i < picN && cell === 'filled';
            return (
              <PressableScale
                key={i}
                testID={`game.miniNonogram.cell${i}`}
                accessibilityRole="button"
                accessibilityLabel={t('games.miniNonogram.cell', {
                  row: r + 1,
                  col: c + 1,
                  state: t(`games.miniNonogram.state.${cell}`),
                })}
                accessibilityHint={t('games.miniNonogram.cellHint')}
                onPress={() => onTap(i)}
                onLongPress={() => onHold(i)}
                delayLongPress={350}
                style={[
                  styles.cell,
                  {
                    left: inset + c * S + 1,
                    top: inset + r * S + 1,
                    width: cellSize,
                    height: cellSize,
                  },
                ]}>
                {cell === 'filled' ? (
                  <Animated.View
                    {...(api.reducedMotion ? {} : { entering: ZoomIn.duration(200) })}
                    style={[styles.ink, pic ? styles.pic : styles.filled]}>
                    <View style={styles.shine} />
                  </Animated.View>
                ) : null}
                {cell === 'miss' ? (
                  <Text variant="heading" tone="danger" style={styles.cross}>
                    ✕
                  </Text>
                ) : null}
                {cell === 'marked' ? <View style={styles.mark} /> : null}
              </PressableScale>
            );
          })}
        </Well>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  colClue: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  rowClue: { position: 'absolute', alignItems: 'flex-end', justifyContent: 'center' },
  clue: { color: color.text.secondary },
  done: { color: color.signal.successText },
  boardBox: { position: 'absolute' },
  board: { flex: 1, borderRadius: radius.lg },
  halo: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.lg,
    backgroundColor: color.game.pink,
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: space['4xl'], color: color.game.pink }],
  },
  cell: {
    position: 'absolute',
    borderRadius: radius.sm,
    backgroundColor: color.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ink: { ...StyleSheet.absoluteFill, borderRadius: radius.sm, overflow: 'hidden' },
  filled: { backgroundColor: color.surface.ring },
  pic: { backgroundColor: color.game.pink },
  shine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: size.hairline * 2,
    backgroundColor: color.text.primary,
    opacity: 0.25,
  },
  cross: { position: 'absolute' },
  mark: {
    width: size.dot.size,
    height: size.dot.size,
    borderRadius: radius.pill,
    backgroundColor: color.text.quiet,
  },
});
