import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, motion, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import { keyWidthFor, LetterKeys } from '../../kit/WordTiles';
import pack from './content.json';
import {
  columns,
  crossStars,
  isRightLetter,
  keysFor,
  rowFull,
  targetCell,
  ACROSS_NUMS,
  CELL_NUMS,
  CROSS_LETTER_POINTS,
  CROSS_ROW_POINTS,
  CROSS_SECONDS,
  CROSS_SIZE,
  CROSS_SOLVED_POINTS,
  DOWN_NUMS,
  type Crossword,
} from './logic';

const POLL_MS = 40;
const BAD_MS = 600;
const PER_ROW = 5;
const PACK = pack as ContentPack<Crossword>;
/** Keys are the catalog accent (the prototype's near-white keys can't carry LetterKeys' white letters). */
const TINT = color.game.sky;
/** Height kept for the clue card, the down clues, the keys and the gaps (dp, estimated). */
const RESERVED = 300;

export default function MiniCrosswordRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const [grid] = useState<Crossword | undefined>(
    () => pickRoundItems('miniCrossword', PACK, seed, 1)[0],
  );
  const [keys] = useState(() => (grid ? keysFor(grid.rows, seed) : []));
  const [cells, setCells] = useState<string[]>(() => Array<string>(9).fill(''));
  /** Active row; -1 before the round and once solved. */
  const [row, setRow] = useState(-1);
  const [cursor, setCursor] = useState<number | null>(null);
  const [bad, setBad] = useState<number | null>(null);
  /** Top-row squares whose column has a letter below them (prototype `.x`). */
  const [glow, setGlow] = useState([false, false, false]);
  const [solved, setSolved] = useState(false);

  const cellsRef = useRef(cells);
  const rowRef = useRef(-1);
  const cursorRef = useRef<number | null>(null);
  const badRef = useRef<number | null>(null);
  const open = useRef(false);
  const typed = useRef(0);
  const wrong = useRef(0);
  const area = useRef({ x: 0, y: 0 });
  const box = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const lift = useSharedValue(0);
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -space.sm * lift.get() }, { scale: 1 + 0.04 * lift.get() }],
  }));

  const gap = space.xs;
  const cell = Math.max(
    size.touch,
    Math.min(Math.floor(W * 0.22), Math.floor((api.board.height - RESERVED) / 3.4)),
  );
  const keyW = keyWidthFor(W, PER_ROW);
  const keyH = Math.max(size.touch, Math.round(keyW * 0.8));

  const put = (next: string[]) => {
    cellsRef.current = next;
    setCells(next);
  };
  const moveCursor = (i: number | null) => {
    cursorRef.current = i;
    setCursor(i);
  };
  /** Centre of square `i` (or the whole grid) in board coordinates. */
  const centre = (i?: number) => {
    const ox = area.current.x + box.current.x;
    const oy = area.current.y + box.current.y;
    if (i === undefined) return { x: ox + box.current.w / 2, y: oy + box.current.h / 2 };
    return {
      x: ox + gap + (i % CROSS_SIZE) * (cell + gap) + cell / 2,
      y: oy + gap + Math.floor(i / CROSS_SIZE) * (cell + gap) + cell / 2,
    };
  };

  useRoundLoop(api, async () => {
    if (!grid) {
      // Nothing servable in this build (the pack is still unreviewed): a calm, empty result.
      api.finish({
        title: t('games.miniCrossword.titleEmpty'),
        stats: [],
        line: t('games.miniCrossword.lineEmpty'),
      });
      return;
    }
    const timer = api.timer(CROSS_SECONDS);
    api.setRound(t('games.miniCrossword.size'));
    let done = false;
    for (let r = 0; r < CROSS_SIZE && !timer.done(); r++) {
      rowRef.current = r;
      setRow(r);
      moveCursor(null);
      api.hint(t('games.miniCrossword.hint'));
      open.current = true;
      while (!timer.done() && !rowFull(cellsRef.current, r)) {
        await api.wait(POLL_MS);
        const b = badRef.current;
        if (b === null) continue;
        // A wrong letter stays red for a moment, then clears.
        await api.wait(BAD_MS);
        const next = [...cellsRef.current];
        next[b] = '';
        put(next);
        badRef.current = null;
        setBad(null);
        if (!timer.done()) api.hint(t('games.miniCrossword.hint'));
      }
      open.current = false;
      if (!rowFull(cellsRef.current, r)) break;
      api.addScore(CROSS_ROW_POINTS);
      const c = centre(r * CROSS_SIZE + 1);
      api.fx.hit(c.x, c.y, color.signal.success, CROSS_ROW_POINTS);
      api.hint(t('games.miniCrossword.rowDone'), 'good');
      await api.wait(500);
      if (r === CROSS_SIZE - 1) done = true;
    }
    rowRef.current = -1;
    setRow(-1);
    moveCursor(null);
    if (done) {
      setSolved(true);
      if (!api.reducedMotion) {
        lift.set(
          withTiming(1, {
            duration: motion.duration.slow,
            easing: Easing.bezier(...motion.easing.pop),
          }),
        );
      }
      const g = centre();
      api.fx.ring(g.x, g.y, color.text.primary, 180);
      api.fx.toast(t('games.miniCrossword.toast'), color.text.primary);
      api.addScore(CROSS_SOLVED_POINTS);
      await api.wait(1300);
    } else if (timer.done()) {
      api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
      await api.wait(700);
    }
    const w = wrong.current;
    const wrongLabel = t('games.miniCrossword.statWrong', { count: w });
    api.finish({
      title: t(done ? 'games.miniCrossword.title' : 'games.miniCrossword.titleNone'),
      stars: crossStars(w, done),
      stats: [t('games.miniCrossword.statLetters', { count: typed.current }), wrongLabel],
      // Lower is better: only a finished grid can set a record.
      ...(done ? { best: { value: w, label: wrongLabel } } : {}),
      items: [grid.id],
    });
  });

  /** A letter key: fills the cursor square (or the next empty one) of the active row. */
  const press = (k: number) => {
    api.haptic('tap');
    api.sound('tap');
    const r = rowRef.current;
    if (!grid || !open.current || badRef.current !== null || r < 0) return;
    const at = targetCell(cellsRef.current, r, cursorRef.current);
    if (at < 0) return;
    const letter = keys[k]!;
    const next = [...cellsRef.current];
    next[at] = letter;
    put(next);
    moveCursor(null);
    if (isRightLetter(grid, at, letter)) {
      typed.current++;
      api.addScore(CROSS_LETTER_POINTS);
      if (r > 0) setGlow((g) => g.map((on, c) => on || c === at % CROSS_SIZE));
    } else {
      wrong.current++;
      badRef.current = at;
      setBad(at);
      api.fx.oops();
      api.hint(t('games.miniCrossword.noFit', { n: DOWN_NUMS[at % CROSS_SIZE] }), 'bad');
    }
  };

  /** Tapping an empty square of the active row moves the cursor there. */
  const tapCell = (i: number) => {
    if (!open.current || badRef.current !== null) return;
    if (Math.floor(i / CROSS_SIZE) !== rowRef.current || cellsRef.current[i]) return;
    api.haptic('tap');
    moveCursor(i);
  };

  if (!grid) return <View style={styles.fill} />;

  const next = row >= 0 ? targetCell(cells, row, cursor) : -1;
  const downWords = columns(grid.rows).map((w) => w.toUpperCase());

  return (
    <View style={styles.fill}>
      <Well style={styles.clue}>
        <View
          testID="game.miniCrossword.clue"
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={
            solved
              ? `${t('games.miniCrossword.solved')}. ${t('games.miniCrossword.solvedLine', { words: downWords.join(', ') })}`
              : row >= 0
                ? t('games.miniCrossword.a11yClue', { n: ACROSS_NUMS[row], clue: grid.across[row] })
                : ''
          }>
          <Text variant="micro" tone="violet">
            {solved
              ? t('games.miniCrossword.solved')
              : row >= 0
                ? t('games.miniCrossword.across', { n: ACROSS_NUMS[row] })
                : ' '}
          </Text>
          <Text variant="body" numberOfLines={2}>
            {solved
              ? t('games.miniCrossword.solvedLine', { words: downWords.join(', ') })
              : row >= 0
                ? grid.across[row]
                : ' '}
          </Text>
        </View>
      </Well>

      <View
        style={styles.area}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          area.current = { x, y };
        }}>
        <Animated.View
          accessibilityLabel={t('games.miniCrossword.a11yGrid')}
          style={[styles.grid, { padding: gap, gap }, liftStyle]}
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            box.current = { x, y, w: width, h: height };
          }}>
          {[0, 1, 2].map((r) => (
            <View key={r} style={[styles.gridRow, { gap }]}>
              {[0, 1, 2].map((c) => {
                const i = r * CROSS_SIZE + c;
                const ch = cells[i]!;
                const face =
                  bad === i
                    ? color.signal.dangerText
                    : r === row
                      ? color.signal.warningText
                      : color.text.primary;
                return (
                  <Pressable
                    key={c}
                    testID={`game.miniCrossword.cell${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={t('games.miniCrossword.a11yCell', {
                      r: r + 1,
                      c: c + 1,
                      what: ch ? ch.toUpperCase() : t('games.miniCrossword.a11yEmpty'),
                    })}
                    onPress={() => tapCell(i)}
                    style={[
                      styles.cell,
                      {
                        width: cell,
                        height: cell,
                        backgroundColor: face,
                        borderColor:
                          i === next
                            ? color.surface.ring
                            : r === 0 && glow[c]
                              ? color.brand.violetLight
                              : 'transparent',
                      },
                    ]}>
                    <View style={styles.lip} />
                    {CELL_NUMS[i] ? (
                      <Text variant="micro" tone="onLight" style={styles.num}>
                        {String(CELL_NUMS[i])}
                      </Text>
                    ) : null}
                    {ch ? (
                      <Animated.View
                        key={`${ch}${i}`}
                        {...(api.reducedMotion
                          ? {}
                          : { entering: ZoomIn.duration(motion.duration.fast) })}>
                        <Text variant={cell >= 64 ? 'statLg' : 'statMd'} tone="onLight">
                          {ch.toUpperCase()}
                        </Text>
                      </Animated.View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Down clues: the crossings that help with each row. */}
        <View style={styles.downs}>
          {grid.down.map((clue, c) => (
            <View
              key={c}
              style={styles.downRow}
              accessible
              accessibilityLabel={t('games.miniCrossword.a11yDown', { n: DOWN_NUMS[c], clue })}>
              <Text variant="micro" tone={solved ? 'success' : 'violet'}>
                {t('games.miniCrossword.down', { n: DOWN_NUMS[c] })}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.downText}>
                {solved ? `${clue} · ${downWords[c]}` : clue}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <LetterKeys
        letters={keys}
        tint={TINT}
        onPress={press}
        perRow={PER_ROW}
        keyWidth={keyW}
        keyHeight={keyH}
        testIDPrefix="game.miniCrossword.key"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  clue: { paddingVertical: space.md, paddingHorizontal: space.lg, gap: space.xs / 2 },
  area: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  grid: { backgroundColor: color.bg.ink, borderRadius: radius.md },
  gridRow: { flexDirection: 'row' },
  cell: {
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '5%',
    backgroundColor: color.overlay.scrim,
    opacity: 0.25,
  },
  num: { position: 'absolute', left: space.xs, top: space.xs / 2, opacity: 0.55 },
  downs: { alignSelf: 'stretch', gap: space.xs },
  downRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  downText: { flex: 1 },
});
