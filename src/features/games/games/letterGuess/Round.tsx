import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design/components';
import { color, size, space } from '@/design/tokens';
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
  guess,
  isSolved,
  lgStars,
  rackFor,
  wellLetters,
  LG_HIT_POINTS,
  LG_MISSES,
  LG_SECONDS,
  LG_SOLVE_POINTS,
  LG_WORDS,
  type LgItem,
} from './logic';

const PACK = pack as ContentPack<LgItem>;
const POLL_MS = 40;
/** Rack: two rows of five (prototype `.lgk`). */
const PER_ROW = 5;
/** Prototype: the solved word / revealed answer stays up for 1.3 s before the next word. */
const NEXT_MS = 1300;

type WordState = 'playing' | 'solved' | 'revealed';

export default function LetterGuessRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const [item, setItem] = useState<LgItem | null>(null);
  const [rack, setRack] = useState<string[]>([]);
  const [tried, setTried] = useState<ReadonlySet<string>>(new Set());
  const [wordMisses, setWordMisses] = useState(0);
  const [state, setState] = useState<WordState>('playing');
  const itemRef = useRef<LgItem | null>(null);
  const rackRef = useRef<string[]>([]);
  const triedRef = useRef<Set<string>>(new Set());
  const open = useRef(false);
  const solvedWord = useRef(false);
  const wm = useRef(0);
  const misses = useRef(0);
  const lives = useRef<{ lose: () => number } | null>(null);
  /** Centre of the wells within the clue/wells group; `topY` is that group's top on the board. */
  const wellsAt = useRef({ x: W / 2, y: 0 });
  const topY = useRef(0);
  const keysTop = useRef(0);

  const len = item?.word.length ?? 5;
  // Wells as wide as the word allows, never wider than a large touch target.
  const well = Math.min(keyWidthFor(W, Math.max(len, PER_ROW)), size.touch + space.md);
  const keyW = keyWidthFor(W, PER_ROW);
  const keyH = Math.min(keyW, size.touch + space.sm);

  useRoundLoop(api, async () => {
    const words = pickRoundItems('letterGuess', PACK, seed, LG_WORDS);
    if (!words.length) {
      // Nothing servable in this build (the pack is still unreviewed): end calmly.
      api.finish({
        title: t('games.letterGuess.titleNone'),
        stars: 1,
        stats: [t('games.letterGuess.statEmpty')],
        items: [],
      });
      return;
    }
    const timer = api.timer(LG_SECONDS);
    let w = 0;
    let solved = 0;
    while (!timer.done() && w < words.length) {
      const it = words[w]!;
      w++;
      api.setRound(t('games.letterGuess.round', { n: w, total: LG_WORDS }));
      // Five misses per word: the engine's `lives` can be called again and resets the hearts.
      lives.current = api.lives(LG_MISSES);
      const r = rackFor(it.word, seed * 31 + w);
      itemRef.current = it;
      rackRef.current = r;
      triedRef.current = new Set();
      solvedWord.current = false;
      wm.current = 0;
      setItem(it);
      setRack(r);
      setTried(new Set());
      setWordMisses(0);
      setState('playing');
      api.hint(t('games.letterGuess.hint'));
      open.current = true;
      while (!timer.done() && !solvedWord.current && wm.current < LG_MISSES)
        await api.wait(POLL_MS);
      open.current = false;
      if (solvedWord.current) {
        solved++;
        setState('solved');
        api.fx.toast(it.word.toUpperCase(), color.signal.successText);
        api.addScore(LG_SOLVE_POINTS);
        const x = wellsAt.current.x;
        const y = topY.current + wellsAt.current.y;
        api.fx.burst(x, y, color.game.mint, 16);
        api.fx.ring(x, y, color.game.mint, 160);
      } else {
        // Out of misses or out of time: show the answer before moving on.
        setState('revealed');
        api.hint(t('games.letterGuess.itWas', { word: it.word.toUpperCase() }), 'bad');
      }
      if (timer.done()) break;
      await api.wait(NEXT_MS);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const m = misses.current;
    const statMisses = t('games.common.misses', { count: m });
    api.finish({
      title: solved ? t('games.letterGuess.title') : t('games.letterGuess.titleNone'),
      stars: lgStars(solved, m),
      stats: [t('games.letterGuess.statWords', { n: solved, count: w }), statMisses],
      // Fewer misses is better, so only a round that found both words can set a record.
      ...(solved === LG_WORDS ? { best: { value: m, label: statMisses } } : {}),
      items: words.map((x) => x.id),
    });
  });

  /** Centre of key i in board coordinates (rows of five, each row centred). */
  const keyCentre = (i: number) => {
    const n = rackRef.current.length;
    const row = Math.floor(i / PER_ROW);
    const inRow = Math.min(PER_ROW, n - row * PER_ROW);
    const rowW = inRow * keyW + (inRow - 1) * space.sm;
    const x = (W - rowW) / 2 + (i % PER_ROW) * (keyW + space.sm) + keyW / 2;
    const y = keysTop.current + row * (keyH + space.sm) + keyH / 2;
    return { x, y };
  };

  const press = (i: number) => {
    api.haptic('tap');
    api.sound('tap');
    const it = itemRef.current;
    const c = rackRef.current[i];
    if (!open.current || !it || !c) return;
    const res = guess(it.word, triedRef.current, c);
    if (res === 'none') return;
    const next = new Set(triedRef.current).add(c);
    triedRef.current = next;
    setTried(next);
    if (res === 'hit') {
      api.addScore(LG_HIT_POINTS);
      const { x, y } = keyCentre(i);
      api.fx.hit(x, y, color.game.mint, LG_HIT_POINTS);
      api.hint(t('games.letterGuess.inWord'), 'good');
      if (isSolved(it.word, next)) {
        solvedWord.current = true;
        open.current = false;
      }
    } else {
      wm.current++;
      misses.current++;
      setWordMisses(wm.current);
      lives.current?.lose();
      api.fx.oops();
      api.hint(t('games.letterGuess.notIn'), 'bad');
      if (wm.current >= LG_MISSES) open.current = false;
    }
  };

  const word = item?.word ?? '';
  const found = wellLetters(word, tried);
  const letters = state === 'revealed' ? [...word] : found;
  const wellStates: WellState[] = [...word].map((_, k) =>
    state === 'solved' ? 'ok' : found[k] ? 'filled' : state === 'revealed' ? 'bad' : 'empty',
  );
  const keyStates: KeyState[] = rack.map((c) =>
    tried.has(c) ? (word.includes(c) ? 'hit' : 'miss') : 'idle',
  );
  const a11yWord = t('games.letterGuess.a11yWord', {
    count: word.length,
    letters: letters
      .map((c) => (c ? c.toUpperCase() : t('games.letterGuess.a11yBlank')))
      .join(', '),
  });

  return (
    <View style={styles.fill}>
      <View style={styles.top} onLayout={(e) => (topY.current = e.nativeEvent.layout.y)}>
        <Text
          testID="game.letterGuess.clue"
          variant="micro"
          tone="tertiary"
          align="center"
          accessibilityLabel={item ? t('games.letterGuess.a11yClue', { clue: item.clue }) : ''}>
          {item?.clue ?? ''}
        </Text>
        <View
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            wellsAt.current = { x: x + width / 2, y: y + height / 2 };
          }}>
          <LetterWells
            testID="game.letterGuess.wells"
            letters={letters}
            states={wellStates}
            size={well}
            accessibilityLabel={item ? a11yWord : ''}
          />
        </View>
        <View
          style={styles.marks}
          accessible
          accessibilityLabel={t('games.letterGuess.a11yMisses', {
            n: wordMisses,
            total: LG_MISSES,
          })}>
          {Array.from({ length: LG_MISSES }, (_, k) => (
            <View key={k} style={[styles.mark, k < wordMisses ? styles.markUsed : null]} />
          ))}
        </View>
      </View>
      <View onLayout={(e) => (keysTop.current = e.nativeEvent.layout.y)}>
        <LetterKeys
          letters={rack}
          tint={color.game.mint}
          states={keyStates}
          onPress={press}
          perRow={PER_ROW}
          keyWidth={keyW}
          keyHeight={keyH}
          testIDPrefix="game.letterGuess.key"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'space-between', paddingTop: space.md, paddingBottom: space.sm },
  top: { gap: space.lg, alignItems: 'center' },
  marks: { flexDirection: 'row', gap: space.xs, justifyContent: 'center' },
  mark: {
    width: space.md,
    height: space.md,
    borderRadius: space.xs,
    backgroundColor: color.surface.line,
  },
  markUsed: { backgroundColor: color.signal.danger },
});
