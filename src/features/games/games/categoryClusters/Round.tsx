import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';

import { PressableScale, Text } from '@/design/components';
import { color, motion, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { GameId } from '../../catalog';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import pack from './content.json';
import {
  ccStars,
  checkPick,
  dealWords,
  herringTrap,
  pickedGroup,
  unsolved,
  CC_GROUP_POINTS,
  CC_GROUP_SIZE,
  CC_GROUPS,
  CC_LIVES,
  CC_SECONDS,
  type CcPuzzle,
} from './logic';

/** Not in the catalog's `GameId` union until the lead wires the batch. */
const GAME_ID: GameId = 'categoryClusters';
const POLL_MS = 40;
const COLS = 3;
/** Prototype beat between the fourth tap and the verdict. */
const CHECK_MS = 300;
/** Prototype: capsules fly up and shrink away in 380 ms, then the tray row pops in. */
const FLY_MS = 380;
/** Prototype `.bad` shake (0.4 s) and the pause before the pick clears. */
const SHAKE_MS = 400;
const BAD_HOLD_MS = 600;
const ROW_H = size.touch;
const ROW_GAP = space.sm;
/** Tray colour per group, in pack order (prototype: sky, pink, orange). */
const GROUP_TINT = [color.game.sky, color.game.pink, color.game.orange] as const;

type Row = { group: number; revealed: boolean };

/** One word capsule (Enamel piece, prototype `.ccw.mat`): grey face, gold rim, white when picked. */
function Capsule({
  word,
  width,
  selected,
  leaving,
  bad,
  shakeX,
  reduced,
  label,
  onPress,
}: {
  word: string;
  width: number;
  selected: boolean;
  leaving: boolean;
  bad: boolean;
  shakeX: SharedValue<number>;
  reduced: boolean;
  label: string;
  onPress: () => void;
}) {
  const fly = useSharedValue(0);
  const lift = useSharedValue(0);
  useEffect(() => {
    if (leaving)
      fly.set(
        reduced ? 1 : withTiming(1, { duration: FLY_MS, easing: Easing.bezier(0.5, 0, 0.3, 1) }),
      );
  }, [leaving, reduced, fly]);
  useEffect(() => {
    lift.set(withTiming(selected ? 1 : 0, { duration: reduced ? 0 : motion.duration.instant }));
  }, [selected, reduced, lift]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - fly.get(),
    transform: [
      { translateX: bad ? shakeX.get() : 0 },
      { translateY: -space['4xl'] * 1.25 * fly.get() - space.xs * lift.get() },
      { scale: 1 - 0.4 * fly.get() },
    ],
  }));
  return (
    <Animated.View
      {...(reduced ? {} : { layout: LinearTransition.duration(motion.duration.fast) })}
      style={[{ width }, style]}>
      <PressableScale
        testID={`game.categoryClusters.word.${word}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={[
          styles.capsule,
          selected ? styles.capsuleSel : null,
          bad ? styles.capsuleBad : null,
        ]}>
        <View style={styles.lip} />
        <View style={styles.shine} />
        <Text
          variant="micro"
          tone={selected ? 'onLight' : 'primary'}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {word.toUpperCase()}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

export default function CategoryClustersRound({ api, seed }: RoundProps) {
  const t = useT();
  const [puzzle] = useState<CcPuzzle | undefined>(
    () => pickRoundItems(GAME_ID, pack as ContentPack<CcPuzzle>, seed, 1)[0],
  );
  const [words, setWords] = useState<string[]>(() => (puzzle ? dealWords(puzzle, seed) : []));
  const [sel, setSel] = useState<string[]>([]);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [bad, setBad] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const selRef = useRef<string[]>([]);
  const pick = useRef<string[] | null>(null);
  const open = useRef(false);
  const shakeX = useSharedValue(0);

  const W = api.board.width;
  const capW = (W - space.sm * (COLS - 1)) / COLS;
  const rowCentre = (i: number) => ({ x: W / 2, y: space.sm + i * (ROW_H + ROW_GAP) + ROW_H / 2 });
  const shown = (w: string) => w.toUpperCase();

  const select = (next: string[]) => {
    selRef.current = next;
    setSel(next);
  };

  useRoundLoop(api, async () => {
    if (!puzzle) {
      // Release build with the pack still unreviewed: nothing to serve, so end calmly.
      api.finish({
        title: t('games.categoryClusters.titleEmpty'),
        stats: [],
        line: t('games.categoryClusters.emptyLine'),
        items: [],
      });
      return;
    }
    const timer = api.timer(CC_SECONDS);
    const lives = api.lives(CC_LIVES);
    let left = CC_LIVES;
    let slips = 0;
    const found: number[] = [];
    api.setRound(t('games.categoryClusters.round', { n: CC_GROUPS }));
    api.hint(t('games.categoryClusters.hint'));

    /** Group `g` flies up into the tray. Revealed groups (out of lives / time) score nothing. */
    const solve = async (g: number, revealed: boolean) => {
      const gw = puzzle.groups[g]!.words;
      select([]);
      setLeaving(gw);
      await api.wait(api.reducedMotion ? 0 : FLY_MS);
      setWords((ws) => ws.filter((w) => !gw.includes(w)));
      setLeaving([]);
      setRows((rs) => [...rs, { group: g, revealed }]);
      found.push(g);
      if (revealed) return;
      const tint = GROUP_TINT[g % GROUP_TINT.length]!;
      const c = rowCentre(found.length - 1);
      api.addScore(CC_GROUP_POINTS);
      api.sound('good');
      api.fx.ring(c.x, c.y, tint, W * 0.4);
      api.fx.burst(c.x, c.y, tint, 12);
      api.hint(puzzle.groups[g]!.name, 'good');
    };

    while (!timer.done() && left > 0 && found.length < CC_GROUPS) {
      const rest = unsolved(puzzle, found);
      if (rest.length === 1) {
        // The last four can only be one group: it sorts itself.
        await api.wait(500);
        await solve(rest[0]!, false);
        break;
      }
      pick.current = null;
      open.current = true;
      while (pick.current === null && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      const picked: string[] | null = pick.current;
      if (picked === null) break;
      await api.wait(CHECK_MS);
      const verdict = checkPick(puzzle, picked);
      if (verdict === 'group') {
        await solve(pickedGroup(puzzle, picked), false);
        await api.wait(500);
        continue;
      }
      slips++;
      setBad(picked);
      shakeX.set(
        api.reducedMotion
          ? 0
          : withSequence(
              ...[-1, 1, -1, 1, 0].map((s) => withTiming(s * space.sm, { duration: SHAKE_MS / 5 })),
            ),
      );
      api.fx.oops();
      left = lives.lose();
      if (verdict === 'oneAway') {
        api.fx.toast(t('games.categoryClusters.oneAway'), color.game.pink);
        const trap = herringTrap(puzzle, picked);
        api.hint(
          trap
            ? t('games.categoryClusters.herring', { word: shown(trap) })
            : t('games.categoryClusters.oneAwayHint'),
          'bad',
        );
      } else {
        api.hint(t('games.categoryClusters.miss'), 'bad');
      }
      await api.wait(BAD_HOLD_MS);
      setBad([]);
      select([]);
    }

    const solved = found.length;
    if (solved === CC_GROUPS) {
      api.fx.toast(t('games.categoryClusters.allGrouped'), color.game.pink);
      await api.wait(700);
    } else {
      api.fx.toast(
        timer.done() ? t('games.hud.timeUp') : t('games.categoryClusters.outOfLives'),
        color.signal.danger,
      );
      api.hint(t('games.categoryClusters.revealHint'));
      for (const g of unsolved(puzzle, found)) await solve(g, true);
      await api.wait(1200);
    }

    const slipsStat = t('games.common.slips', { count: slips });
    api.finish({
      title: t(solved ? 'games.categoryClusters.title' : 'games.categoryClusters.titleNone'),
      stars: ccStars(solved, slips),
      stats: [t('games.categoryClusters.statGroups', { n: solved, total: CC_GROUPS }), slipsStat],
      // Fewer slips is better, so only a fully sorted board can set a record.
      ...(solved === CC_GROUPS ? { best: { value: slips, label: slipsStat } } : {}),
      items: [puzzle.id],
    });
  });

  const onTap = (w: string) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    const cur = selRef.current;
    const next = cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w];
    select(next);
    if (next.length === CC_GROUP_SIZE) {
      open.current = false;
      pick.current = next;
    }
  };

  return (
    <View style={styles.fill}>
      <View style={styles.tray} accessibilityLiveRegion="polite">
        {puzzle
          ? rows.map(({ group, revealed }) => {
              const g = puzzle.groups[group]!;
              const tint = GROUP_TINT[group % GROUP_TINT.length]!;
              return (
                <Animated.View
                  key={group}
                  {...(api.reducedMotion
                    ? {}
                    : {
                        entering: ZoomIn.duration(FLY_MS).easing(
                          Easing.bezier(...motion.easing.pop),
                        ),
                      })}
                  accessible
                  accessibilityLabel={t('games.categoryClusters.row', {
                    name: g.name,
                    words: g.words.join(', '),
                  })}
                  style={[styles.row, revealed ? styles.rowRevealed : null]}>
                  <View style={[styles.rowTint, { backgroundColor: tint }]} />
                  <View style={[styles.rowEdge, { borderColor: tint }]} />
                  <Text variant="bodyStrong" style={{ color: tint }} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text variant="micro" tone="body" numberOfLines={1} adjustsFontSizeToFit>
                    {g.words.map(shown).join(' · ')}
                  </Text>
                </Animated.View>
              );
            })
          : null}
      </View>
      <View style={styles.grid}>
        {words.map((w) => {
          const selected = sel.includes(w);
          return (
            <Capsule
              key={w}
              word={w}
              width={capW}
              selected={selected}
              leaving={leaving.includes(w)}
              bad={bad.includes(w)}
              shakeX={shakeX}
              reduced={api.reducedMotion}
              label={t(
                selected ? 'games.categoryClusters.wordSelected' : 'games.categoryClusters.word',
                { word: w },
              )}
              onPress={() => onTap(w)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'space-between' },
  tray: { paddingTop: space.sm, gap: ROW_GAP },
  row: {
    height: ROW_H,
    borderRadius: radius.md,
    backgroundColor: color.bg.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: space.md,
  },
  rowRevealed: { opacity: 0.6 },
  rowTint: { ...StyleSheet.absoluteFill, opacity: 0.22 },
  rowEdge: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.md,
    borderWidth: size.hairline * 1.5,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingBottom: space.xs,
  },
  capsule: {
    height: size.touch,
    borderRadius: radius.md,
    backgroundColor: color.surface.ring,
    borderWidth: size.hairline * 3,
    borderColor: color.signal.warningText,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: space.xs,
  },
  capsuleSel: { backgroundColor: color.text.primary },
  capsuleBad: { borderColor: color.signal.danger },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '16%',
    backgroundColor: color.overlay.scrim,
    opacity: 0.5,
  },
  /** Enamel's diagonal glint (prototype `.mat::before`). */
  shine: {
    position: 'absolute',
    top: -space.lg,
    bottom: -space.lg,
    left: '40%',
    width: space.md,
    backgroundColor: color.text.primary,
    opacity: 0.18,
    transform: [{ rotate: '32deg' }],
  },
});
