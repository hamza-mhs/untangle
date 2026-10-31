import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Polyline, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/design/components';
import { color, space, type as typeScale } from '@/design/tokens';
import { useT } from '@/i18n';

import type { GameId } from '../../catalog';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import { usePointDrag } from '../../kit/useDrag';
import { LetterWells, type WellState } from '../../kit/WordTiles';
import pack from './content.json';
import {
  beadPoints,
  judgeWord,
  packTray,
  slideBead,
  tapBead,
  trailStars,
  trayOrder,
  trayWell,
  TRAIL_LONG_WORD,
  TRAIL_SECONDS,
  TRAIL_WORDS,
  wordPoints,
  wordWidth,
  type TrailBoard,
} from './logic';

/** Not in the catalog's `GameId` union until the lead wires the game. */
const GAME_ID: GameId = 'wordTrails';
const PACK = pack as unknown as ContentPack<TrailBoard>;
const POLL_MS = 40;
/** Prototype stage (264 × 396): ring centre 132, 268; bead ring 72; ring well 180; beads 48. */
const STAGE_W = 264;
const STAGE_H = 396;
const RING_CY = 268;
const RING_R = 72;
const RING_D = 180;
const BEAD_D = 48;
const TRAIL_W = 8;
/** Lit beads grow 12 % (prototype `.wtb.on`). */
const BEAD_ON = 1.12;
/** Touch radius around a bead; well clear of its neighbours (72 apart on the ring). */
const HIT_R = 28;
/** Prototype: letters stamp into a found row 60 ms apart; a miss shakes for 400 ms. */
const STAMP_MS = 60;
const HIT_MS = 450;
const AGAIN_MS = 700;
const MISS_MS = 400;
const SHAKE_STEP_MS = 50;
const POP_MS = 150;
const POP_SCALE = 1.1;
/** Largest tray well (dp) and the smallest it may shrink to on short boards. */
const WELL_MAX = 34;
const WELL_MIN = 18;

export default function WordTrailsRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const [board] = useState(() => pickRoundItems(GAME_ID, PACK, seed, 1)[0]!);
  const [tray] = useState(() => trayOrder(board.words));
  const letters = [...board.letters];

  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  /** Letters shown so far in each found row (they stamp in one by one). */
  const [shown, setShown] = useState<Record<string, number>>({});
  /** A tray word tried again: its row lights up briefly. */
  const [again, setAgain] = useState<string | null>(null);
  const [bad, setBad] = useState(false);

  const pathRef = useRef<number[]>([]);
  const open = useRef(false);
  const submitted = useRef<string | null>(null);
  /** A touch began on this bead while a tapped word was waiting (tap or drag not known yet). */
  const pending = useRef<number | null>(null);
  /** The current touch slid between beads. */
  const dragged = useRef(false);

  const shake = useSharedValue(0);
  const pop = useSharedValue(1);
  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.get() }, { scale: pop.get() }],
  }));

  // Layout: the prototype stage scaled to the board, the ring kept at the bottom; the tray
  // fills the space above the word being built.
  const u = Math.min(W / STAGE_W, H / STAGE_H);
  const cx = W / 2;
  const cy = H - (STAGE_H - RING_CY) * u;
  const ringD = RING_D * u;
  const beadR = (BEAD_D / 2) * u;
  const hitR = HIT_R * u;
  const points = beadPoints(cx, cy, RING_R * u);
  const wordH = typeScale.statLg.lineHeight ?? space['4xl'];
  const wordTop = cy - ringD / 2 - space.md - wordH;
  const trayH = wordTop - space.md;
  const gap = space.sm;
  const wordGap = space.lg;
  const rowGap = space.sm;
  const lengths = tray.map((w) => w.length);
  const well = trayWell(lengths, W, trayH, gap, wordGap, rowGap, WELL_MAX * u, WELL_MIN);
  const rows = packTray(lengths, W, well, gap, wordGap);

  /** Centre of tray word `wi` in board coordinates (for the hit ring and the float text). */
  const rowCentre = (wi: number) => {
    const r = rows.findIndex((row) => row.includes(wi));
    const row = rows[r]!;
    const widths = row.map((i) => wordWidth(lengths[i]!, well, gap));
    const total = widths.reduce((a, b) => a + b, 0) + wordGap * (row.length - 1);
    let x = (W - total) / 2;
    for (let k = 0; k < row.indexOf(wi); k++) x += widths[k]! + wordGap;
    return { x: x + widths[row.indexOf(wi)]! / 2, y: r * (well + rowGap) + well / 2 };
  };

  const show = (p: number[]) => {
    pathRef.current = p;
    setPath(p);
  };
  const tick = () => {
    api.haptic('tap');
    api.sound('tap');
  };
  const letterPop = () => {
    if (api.reducedMotion) return;
    pop.set(
      withSequence(withTiming(POP_SCALE, { duration: 0 }), withTiming(1, { duration: POP_MS })),
    );
  };
  const submit = () => {
    const p = pathRef.current;
    if (p.length < 2) {
      show([]);
      return;
    }
    open.current = false;
    submitted.current = p.map((i) => letters[i]).join('');
  };
  /** Read through a function so the loop sees words submitted while it was waiting. */
  const takeWord = () => submitted.current;

  // Sliding: lifting after moving between beads tries the word. Tapping (TalkBack, adb):
  // tap beads one by one, then tap the last bead again to try it — no extra button, and the
  // same "back onto an earlier bead takes letters off" rule as sliding.
  const onStart = (i: number) => {
    if (!open.current) return;
    dragged.current = false;
    if (pathRef.current.length) {
      pending.current = i;
      return;
    }
    pending.current = null;
    show([i]);
    tick();
    letterPop();
  };
  const onEnter = (i: number) => {
    if (!open.current) return;
    if (!dragged.current) {
      dragged.current = true;
      const p = pending.current;
      pending.current = null;
      // A slide from the tapped word's last bead carries on; from anywhere else it starts over.
      if (p !== null && p !== pathRef.current.at(-1)) {
        show([p]);
        tick();
      }
    }
    const r = slideBead(pathRef.current, i);
    if (r.step === 'same') return;
    show(r.path);
    tick();
    if (r.step === 'add') letterPop();
  };
  const onEnd = () => {
    if (!open.current) return;
    const p = pending.current;
    pending.current = null;
    if (dragged.current) {
      dragged.current = false;
      submit();
      return;
    }
    if (p === null) {
      if (pathRef.current.length === 1) api.hint(t('games.wordTrails.tapTry'));
      return;
    }
    const r = tapBead(pathRef.current, p);
    tick();
    if (r.step === 'try') {
      submit();
      return;
    }
    show(r.path);
    if (r.step === 'add') letterPop();
    api.hint(t('games.wordTrails.tapTry'));
  };
  const tapTarget = (i: number) => {
    onStart(i);
    onEnd();
  };

  const gesture = usePointDrag(points, hitR, { onStart, onEnter, onEnd });

  useRoundLoop(api, async () => {
    const timer = api.timer(TRAIL_SECONDS);
    api.setRound(t('games.wordTrails.round', { total: TRAIL_WORDS }));
    api.hint(t('games.wordTrails.hint'));
    api.combo(0);
    const got: string[] = [];
    let tries = 0;
    let streak = 0;
    open.current = true;
    while (!timer.done() && got.length < TRAIL_WORDS) {
      submitted.current = null;
      while (submitted.current === null && !timer.done()) await api.wait(POLL_MS);
      const word = takeWord();
      if (word === null) break;
      const verdict = judgeWord(word, tray, got);
      if (verdict === 'found') {
        tries++;
        streak++;
        got.push(word);
        api.combo(streak);
        setFound([...got]);
        const pts = wordPoints(word);
        api.addScore(pts);
        const c = rowCentre(tray.indexOf(word));
        api.fx.ring(c.x, c.y, color.glow.lilac, wordWidth(word.length, well, gap));
        api.fx.float(c.x, c.y, `+${pts}`, color.glow.lilac);
        api.haptic('good');
        api.sound('good');
        api.hint(
          t(word.length >= TRAIL_LONG_WORD ? 'games.wordTrails.longOne' : 'games.wordTrails.found'),
          'good',
        );
        // The word flies into its row letter by letter.
        for (let k = 1; k <= word.length; k++) {
          setShown((s) => ({ ...s, [word]: api.reducedMotion ? word.length : k }));
          if (api.reducedMotion) break;
          await api.wait(STAMP_MS);
        }
        await api.wait(HIT_MS);
      } else if (verdict === 'again') {
        // Already in the tray: a soft nudge, not a miss.
        setAgain(word);
        api.hint(t('games.wordTrails.already', { word: word.toUpperCase() }));
        await api.wait(AGAIN_MS);
        setAgain(null);
      } else {
        tries++;
        streak = 0;
        api.combo(0);
        setBad(true);
        api.fx.oops();
        if (!api.reducedMotion) {
          const a = space.sm;
          const d = { duration: SHAKE_STEP_MS };
          shake.set(
            withSequence(
              withTiming(-a, d),
              withTiming(a, d),
              withTiming(-a, d),
              withTiming(a, d),
              withTiming(-a / 2, d),
              withTiming(0, d),
            ),
          );
        }
        api.hint(t('games.wordTrails.notIn', { word: word.toUpperCase() }), 'bad');
        await api.wait(MISS_MS);
        setBad(false);
        await api.wait(MISS_MS);
      }
      show([]);
      if (got.length < TRAIL_WORDS) {
        api.hint(t('games.wordTrails.hint'));
        open.current = true;
      }
    }
    open.current = false;
    show([]);
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const n = got.length;
    const stat = t('games.wordTrails.statWords', { n, total: TRAIL_WORDS });
    api.finish({
      title: n ? t('games.wordTrails.title') : t('games.wordTrails.titleNone'),
      stars: trailStars(n),
      stats: [stat, t('games.common.misses', { count: tries - n })],
      best: { value: n, label: stat },
      items: [board.id],
    });
  });

  const current = path.map((i) => letters[i]!.toUpperCase()).join('');
  const lit = new Set(path);
  const trail = path.map((i) => `${points[i]!.x},${points[i]!.y}`).join(' ');

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.fill} testID="game.wordTrails.board">
        {/* The tray: one row of wells per word, shortest first. */}
        <View style={[styles.tray, { gap: rowGap }]} pointerEvents="none">
          {rows.map((row, r) => (
            <View key={r} style={[styles.trayRow, { gap: wordGap }]}>
              {row.map((wi) => {
                const w = tray[wi]!;
                const isFound = found.includes(w);
                const n = shown[w] ?? 0;
                const st: WellState = again === w ? 'active' : isFound ? 'ok' : 'empty';
                return (
                  <LetterWells
                    key={w}
                    testID={`game.wordTrails.row${wi}`}
                    letters={[...w].map((ch, k) => (isFound && k < n ? ch : ''))}
                    states={[...w].map(() => st)}
                    size={well}
                    accessibilityLabel={
                      isFound
                        ? t('games.wordTrails.a11yFound', { word: w.toUpperCase() })
                        : t('games.wordTrails.a11yRow', { count: w.length })
                    }
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* The word being built, above the ring. */}
        <Animated.View
          style={[styles.word, { top: wordTop, height: wordH }, wordStyle]}
          pointerEvents="none"
          testID="game.wordTrails.word"
          accessible={!!current}
          accessibilityLabel={t('games.wordTrails.a11yWord', { word: current })}
          accessibilityLiveRegion="polite">
          <Text variant="statLg" align="center" tone={bad ? 'danger' : 'primary'}>
            {current}
          </Text>
        </Animated.View>

        <Well
          style={[
            styles.ring,
            {
              left: cx - ringD / 2,
              top: cy - ringD / 2,
              width: ringD,
              height: ringD,
              borderRadius: ringD / 2,
            },
          ]}
        />

        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="wtBead" cx="40%" cy="35%" r="65%">
              <Stop offset="0" stopColor={color.brand.violetLight} />
              <Stop offset="0.6" stopColor={color.game.violet} />
              <Stop offset="1" stopColor={color.brand.violetDeep} />
            </RadialGradient>
            <RadialGradient id="wtBeadOn" cx="40%" cy="35%" r="65%">
              <Stop offset="0" stopColor={color.glow.lilac} />
              <Stop offset="0.55" stopColor={color.brand.violetLight} />
              <Stop offset="1" stopColor={color.game.violet} />
            </RadialGradient>
          </Defs>
          {/* Glowing trail: a soft halo under the bright line (the prototype's drop-shadow). */}
          {path.length > 1 ? (
            <>
              <Polyline
                points={trail}
                fill="none"
                stroke={color.brand.violetLight}
                strokeOpacity={0.3}
                strokeWidth={TRAIL_W * u * 2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Polyline
                points={trail}
                fill="none"
                stroke={color.glow.lilac}
                strokeOpacity={0.85}
                strokeWidth={TRAIL_W * u}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}
          {points.map((p, i) => {
            const on = lit.has(i);
            const r = on ? beadR * BEAD_ON : beadR;
            return (
              <Circle
                key={`g${i}`}
                cx={p.x}
                cy={p.y}
                r={r}
                fill={on ? 'url(#wtBeadOn)' : 'url(#wtBead)'}
              />
            );
          })}
          {/* Glass highlight on each bead. */}
          {points.map((p, i) => {
            const r = lit.has(i) ? beadR * BEAD_ON : beadR;
            return (
              <Ellipse
                key={`s${i}`}
                cx={p.x - r * 0.2}
                cy={p.y - r * 0.5}
                rx={r * 0.45}
                ry={r * 0.22}
                fill={color.text.primary}
                fillOpacity={0.3}
              />
            );
          })}
        </Svg>

        {/* Letters, plus touch and TalkBack targets: the drag reads coordinates; these give
            each bead a label and an activate action (tap beads one by one, last one again). */}
        {points.map((p, i) => {
          const last = path.at(-1) === i;
          return (
            <View
              key={i}
              testID={`game.wordTrails.bead${i}`}
              pointerEvents="none"
              accessible
              accessibilityRole="button"
              accessibilityLabel={t(
                last ? 'games.wordTrails.a11yBeadLast' : 'games.wordTrails.a11yBead',
                {
                  letter: letters[i]!.toUpperCase(),
                },
              )}
              accessibilityState={{ selected: lit.has(i) }}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={() => tapTarget(i)}
              style={[
                styles.bead,
                { left: p.x - hitR, top: p.y - hitR, width: hitR * 2, height: hitR * 2 },
              ]}>
              <Text variant="statMd">{letters[i]!.toUpperCase()}</Text>
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tray: { position: 'absolute', left: 0, right: 0, top: 0 },
  trayRow: { flexDirection: 'row', justifyContent: 'center' },
  word: { position: 'absolute', left: 0, right: 0, justifyContent: 'center' },
  ring: { position: 'absolute', borderColor: color.brand.violetSoft },
  bead: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
