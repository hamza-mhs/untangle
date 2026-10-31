import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { color, motion, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import {
  keyWidthFor,
  LetterKeys,
  LetterWells,
  type KeyState,
  type WellState,
} from '../../kit/WordTiles';
import pack from './content.json';
import {
  bridgeStars,
  bridgeSteps,
  isBridged,
  judgeStep,
  middleRungs,
  swapLetter,
  BRIDGE_LEN,
  BRIDGE_POINTS,
  BRIDGE_SECONDS,
  STEP_POINTS,
  type Ladder,
} from './logic';

const PACK = pack as unknown as ContentPack<Ladder>;
const DICT: ReadonlySet<string> = new Set(pack.dict);
const POLL_MS = 30;
const PER_ROW = 7;
/** Prototype: a non-word shows for 600 ms before it shakes off; a locked rung settles 500 ms. */
const BAD_MS = 600;
const LOCK_MS = 500;
/** Prototype: the changed letter flips in over 300 ms. */
const FLIP_MS = motion.duration.base;
const BRIDGED_MS = 1100;
/** Wells are at most this share of the board width (prototype: 40 px on a ~300 px stage). */
const WELL_MAX = 0.15;

type RowKind = 'top' | 'ok' | 'active' | 'empty' | 'bottom';
type Row = { kind: RowKind; word: string };

export default function WordBridgeRound({ api, seed }: RoundProps) {
  const t = useT();
  const reduced = api.reducedMotion;
  const W = api.board.width;
  const H = api.board.height;

  const [lad, setLad] = useState<Ladder | null>(null);
  // Every word on the bridge so far, the top word included.
  const [ladder, setLadder] = useState<string[]>([]);
  const [cur, setCur] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const [bad, setBad] = useState(false);
  const [done, setDone] = useState(false);
  const [flipAt, setFlipAt] = useState<{ row: number; pos: number; n: number } | null>(null);
  const ladderRef = useRef<string[]>([]);
  const selRef = useRef<number | null>(null);
  const curRef = useRef('');
  const open = useRef(false);
  const pending = useRef<{ pos: number; ch: string } | null>(null);
  const shake = useSharedValue(0);

  // Layout: the ladder fills the top of the board, the keyboard sits at the bottom.
  const keyW = keyWidthFor(W, PER_ROW);
  const keyH = size.button.lg;
  const ladderH = H - keyH - space.lg;
  const geom = (rows: number) => {
    const fit = Math.floor((ladderH - space.sm - (rows - 1) * space.sm) / rows);
    const s = Math.max(size.icon.lg, Math.min(Math.floor(W * WELL_MAX), fit));
    return { s, y: (row: number) => space.sm + row * (s + space.sm) + s / 2 };
  };

  const select = (i: number | null) => {
    selRef.current = i;
    setSel(i);
  };
  const showRung = (w: string) => {
    curRef.current = w;
    setCur(w);
  };
  const changeHint = (w: string) => {
    api.hint(t('games.wordBridge.hint', { word: w.toUpperCase() }));
  };

  useRoundLoop(api, async () => {
    const [item] = pickRoundItems('wordBridge', PACK, seed, 1);
    if (!item) return;
    const minMid = item.path.length - 2;
    const timer = api.timer(BRIDGE_SECONDS);
    api.setRound(
      t('games.wordBridge.label', { from: item.from.toUpperCase(), to: item.to.toUpperCase() }),
    );
    ladderRef.current = [item.from];
    setLadder([item.from]);
    setLad(item);
    showRung(item.from);
    changeHint(item.from);
    let nonWords = 0;
    let finished = false;
    open.current = true;

    while (!finished && !timer.done()) {
      await api.wait(POLL_MS);
      const p = pending.current;
      if (!p) continue;
      pending.current = null;
      open.current = false;
      const prev = ladderRef.current.at(-1)!;
      const next = swapLetter(prev, p.pos, p.ch);
      select(null);
      const verdict = judgeStep(next, ladderRef.current, DICT);

      if (verdict !== 'word') {
        // Not a word (or back to a word already used): it shows red, shakes and resets.
        showRung(next);
        setBad(true);
        if (verdict === 'notWord') {
          nonWords++;
          api.fx.oops();
          api.hint(t('games.wordBridge.notWord', { word: next.toUpperCase() }), 'bad');
        } else {
          api.haptic('bad');
          api.hint(t('games.wordBridge.repeat', { word: next.toUpperCase() }), 'bad');
        }
        if (!reduced) {
          const d = space.sm;
          const q = motion.duration.instant / 2;
          shake.set(
            withSequence(
              withTiming(-d, { duration: q }),
              withTiming(d, { duration: q }),
              withTiming(-d / 2, { duration: q }),
              withTiming(d / 2, { duration: q }),
              withTiming(0, { duration: q }),
            ),
          );
        }
        await api.wait(BAD_MS);
        setBad(false);
        showRung(prev);
        changeHint(prev);
        open.current = true;
        continue;
      }

      // A real word: the rung locks and its changed letter flips in.
      const words = [...ladderRef.current, next];
      ladderRef.current = words;
      finished = isBridged(next, item.to);
      const lockedMid = words.slice(1).filter((w) => w !== item.to).length;
      const mid = middleRungs(minMid, lockedMid, finished);
      const g = geom(mid + 2);
      const row = next === item.to ? mid + 1 : lockedMid;
      showRung('');
      setLadder(words);
      if (finished) setDone(true);
      setFlipAt({ row, pos: p.pos, n: words.length });
      api.addScore(STEP_POINTS);
      api.fx.hit(W / 2, g.y(row), color.game.mint, STEP_POINTS);
      api.hint(next.toUpperCase(), 'good');
      await api.wait(LOCK_MS);
      if (finished) {
        api.fx.burst(W / 2, g.y(mid + 1), color.game.mint, 16);
        api.fx.toast(t('games.wordBridge.bridged'), color.signal.successText);
        api.addScore(BRIDGE_POINTS);
        await api.wait(BRIDGED_MS);
        break;
      }
      showRung(next);
      changeHint(next);
      open.current = true;
    }
    open.current = false;
    if (!finished) {
      api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
      await api.wait(700);
    }
    const words = ladderRef.current;
    const steps = finished ? bridgeSteps(words, item.to) : words.length - 1;
    const statSteps = t('games.wordBridge.statSteps', { count: steps });
    api.finish({
      title: finished ? t('games.wordBridge.title') : t('games.wordBridge.titleNone'),
      stars: bridgeStars(nonWords, finished),
      stats: [statSteps, t('games.wordBridge.statBad', { count: nonWords })],
      // Fewer is better, so only a finished bridge can set a record.
      ...(finished ? { best: { value: steps, label: statSteps } } : {}),
      items: [item.id],
    });
  });

  const tapWell = (i: number) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    if (selRef.current === i) {
      select(null);
      return changeHint(curRef.current);
    }
    select(i);
    api.hint(t('games.wordBridge.pickKey'));
  };

  const keys = lad ? [...lad.keys] : [];
  const pressKey = (k: number) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    const s = selRef.current;
    const ch = keys[k];
    if (s === null || !ch) return api.hint(t('games.wordBridge.pickWell'));
    if (curRef.current[s] === ch) return;
    pending.current = { pos: s, ch };
  };

  // Rows top to bottom: top word, locked rungs, the rung being built, empty rungs, bottom word.
  const rows: Row[] = [];
  if (lad) {
    const locked = ladder.slice(1).filter((w) => w !== lad.to);
    const mid = middleRungs(lad.path.length - 2, locked.length, done);
    rows.push({ kind: 'top', word: lad.from });
    for (const w of locked) rows.push({ kind: 'ok', word: w });
    if (!done) rows.push({ kind: 'active', word: cur });
    while (rows.length < mid + 1) rows.push({ kind: 'empty', word: '' });
    rows.push({ kind: 'bottom', word: lad.to });
  }
  const { s } = geom(Math.max(rows.length, 2));
  const keyStates: KeyState[] = keys.map((ch) =>
    sel !== null && cur[sel] === ch ? 'used' : 'idle',
  );

  const rowLabel = (r: Row, i: number) => {
    const word = r.word.toUpperCase();
    if (r.kind === 'top') return t('games.wordBridge.a11yTop', { word });
    if (r.kind === 'bottom')
      return done
        ? t('games.wordBridge.a11yBridged', { word })
        : t('games.wordBridge.a11yBottom', { word });
    if (r.kind === 'ok') return t('games.wordBridge.a11yRung', { n: i, word });
    return t('games.wordBridge.a11yEmpty');
  };

  return (
    <View style={styles.fill}>
      <View style={[styles.ladder, { height: ladderH }]}>
        {rows.map((r, i) => {
          if (r.kind === 'active') {
            return (
              <ActiveRung
                key={`r${i}`}
                word={r.word}
                s={s}
                sel={sel}
                bad={bad}
                shake={shake}
                onPress={tapWell}
                label={(k) =>
                  t(sel === k ? 'games.wordBridge.a11yWellSel' : 'games.wordBridge.a11yWell', {
                    n: k + 1,
                    letter: (r.word[k] ?? '').toUpperCase(),
                  })
                }
              />
            );
          }
          const st: WellState =
            r.kind === 'empty'
              ? 'empty'
              : r.kind === 'ok' || (r.kind === 'bottom' && done)
                ? 'ok'
                : 'fixed';
          return (
            <View
              key={`r${i}`}
              testID={`game.wordBridge.rung${i}`}
              accessible
              accessibilityLabel={rowLabel(r, i)}
              style={[styles.rung, r.kind === 'empty' ? styles.dim : null]}>
              {Array.from({ length: BRIDGE_LEN }, (_, k) => {
                const fresh = flipAt?.row === i && flipAt.pos === k;
                return (
                  <Letter
                    key={fresh ? `f${flipAt.n}` : k}
                    ch={r.word[k] ?? ''}
                    st={st}
                    s={s}
                    flipIn={fresh && !reduced}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
      <LetterKeys
        letters={keys}
        tint={color.game.mint}
        states={keyStates}
        onPress={pressKey}
        perRow={PER_ROW}
        keyWidth={keyW}
        keyHeight={keyH}
        testIDPrefix="game.wordBridge.key"
      />
    </View>
  );
}

/** The rung being built: tap a letter to pick it, then a key to change it. */
function ActiveRung({
  word,
  s,
  sel,
  bad,
  shake,
  onPress,
  label,
}: {
  word: string;
  s: number;
  sel: number | null;
  bad: boolean;
  shake: SharedValue<number>;
  onPress: (i: number) => void;
  label: (i: number) => string;
}) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  return (
    <Animated.View style={[styles.rung, style]}>
      {Array.from({ length: BRIDGE_LEN }, (_, k) => (
        <Pressable
          key={k}
          testID={`game.wordBridge.well${k}`}
          accessibilityRole="button"
          accessibilityLabel={label(k)}
          accessibilityState={{ selected: sel === k }}
          disabled={!word}
          onPress={() => onPress(k)}>
          <Letter
            ch={word[k] ?? ''}
            st={bad ? 'bad' : sel === k ? 'active' : word ? 'filled' : 'empty'}
            s={s}
            flipIn={false}
          />
        </Pressable>
      ))}
    </Animated.View>
  );
}

/** One letter well (kit `LetterWells` of one); the letter just changed flips in as it mounts. */
function Letter({ ch, st, s, flipIn }: { ch: string; st: WellState; s: number; flipIn: boolean }) {
  const flip = useSharedValue(flipIn ? 0 : 1);
  useEffect(() => {
    if (flipIn) flip.set(withTiming(1, { duration: FLIP_MS }));
  }, [flipIn, flip]);
  const style = useAnimatedStyle(() => ({
    transform: [{ perspective: s * 8 }, { rotateX: `${(1 - flip.get()) * 90}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <LetterWells letters={[ch]} states={[st]} size={s} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'space-between', paddingBottom: space.xs },
  ladder: { paddingTop: space.sm, gap: space.sm, alignItems: 'center' },
  rung: { flexDirection: 'row', gap: space.sm },
  dim: { opacity: 0.5 },
});
