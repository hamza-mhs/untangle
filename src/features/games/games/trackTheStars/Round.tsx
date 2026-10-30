import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import {
  FIELD,
  trackPaths,
  trackPick,
  trackStars,
  TRACK_BEADS,
  TRACK_DRIFT_MS,
  TRACK_POINTS,
  TRACK_ROUNDS,
  TRACK_SECONDS,
  TRACK_SHOW_MS,
} from './logic';

const POLL_MS = 40;
/** How often the board checks for a pause while the beads drift (real time). */
const PAUSE_POLL_MS = 50;

type BeadState = 'idle' | 'glow' | 'good' | 'bad';

function Bead({
  i,
  frames,
  p,
  field,
  size,
  state,
  label,
  onPress,
}: {
  i: number;
  frames: SharedValue<[number, number][][]>;
  p: SharedValue<number>;
  field: { w: number; h: number };
  size: number;
  state: BeadState;
  label: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const f = frames.get();
    if (f.length === 0) return { opacity: 0 };
    const at = Math.max(0, Math.min(f.length - 1, p.get()));
    const a = Math.floor(at);
    const b = Math.min(f.length - 1, a + 1);
    const k = at - a;
    const pa = f[a]![i]!;
    const pb = f[b]![i]!;
    return {
      opacity: 1,
      transform: [
        { translateX: (pa[0] + (pb[0] - pa[0]) * k) * field.w - size / 2 },
        { translateY: (pa[1] + (pb[1] - pa[1]) * k) * field.h - size / 2 },
      ],
    };
  });
  return (
    <Animated.View style={[styles.beadBox, { width: size, height: size }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={size * 0.3}
        style={[
          styles.bead,
          state === 'glow' ? styles.glow : null,
          state === 'good' ? styles.good : null,
          state === 'bad' ? styles.bad : null,
        ]}
      />
    </Animated.View>
  );
}

export default function TrackTheStarsRound({ api, seed }: RoundProps) {
  const t = useT();
  const frames = useSharedValue<[number, number][][]>([]);
  const p = useSharedValue(0);
  const [field, setField] = useState({ w: 0, h: 0, x: 0, y: 0 });
  const fieldRef = useRef(field);
  const [states, setStates] = useState<BeadState[]>(() =>
    Array.from({ length: TRACK_BEADS }, () => 'idle'),
  );
  const tapped = useRef<number | null>(null);
  const open = useRef(false);

  /** Plays the drift on the UI thread and holds it while the game clock is paused. */
  const drift = async (last: number) => {
    let running = true;
    const play = () =>
      p.set(
        withTiming(last, {
          duration: ((last - p.get()) / last) * TRACK_DRIFT_MS,
          easing: Easing.linear,
        }),
      );
    play();
    const id = setInterval(() => {
      if (running && !api.clock.running) {
        running = false;
        cancelAnimation(p);
      } else if (!running && api.clock.running) {
        running = true;
        play();
      }
    }, PAUSE_POLL_MS);
    try {
      await api.wait(TRACK_DRIFT_MS);
    } finally {
      clearInterval(id);
      cancelAnimation(p);
      p.set(last);
    }
  };

  useRoundLoop(api, async () => {
    while (fieldRef.current.w === 0) await api.wait(POLL_MS);
    const timer = api.timer(TRACK_SECONDS);
    let picked = 0;
    let lost = 0;
    let total = 0;
    let streak = 0;
    api.combo(0);
    for (let r = 0; r < TRACK_ROUNDS && !timer.done(); r++) {
      api.setRound(t('games.common.roundOf', { n: r + 1, total: TRACK_ROUNDS }));
      const path = trackPaths(seed, r);
      const targets = trackPick(seed, r);
      const k = targets.length;
      total += k;
      frames.set(path);
      p.set(0);
      setStates(
        Array.from({ length: TRACK_BEADS }, (_, i) => (targets.includes(i) ? 'glow' : 'idle')),
      );
      api.hint(t('games.trackTheStars.follow', { count: k }));
      await api.wait(TRACK_SHOW_MS);
      setStates(Array.from({ length: TRACK_BEADS }, () => 'idle'));
      api.quiet(true);
      api.hint(t('games.trackTheStars.keep'));
      await drift(path.length - 1);
      api.quiet(false);
      api.hint(t('games.trackTheStars.tapThem', { count: k }));
      const end = path[path.length - 1]!;
      const chosen = new Set<number>();
      let roundLost = 0;
      open.current = true;
      while (chosen.size < k && !timer.done()) {
        tapped.current = null;
        while (tapped.current === null && !timer.done()) await api.wait(POLL_MS);
        const i = tapped.current;
        if (i === null) break;
        if (chosen.has(i)) continue;
        chosen.add(i);
        const f = fieldRef.current;
        const x = f.x + end[i]![0] * f.w;
        const y = f.y + end[i]![1] * f.h;
        if (targets.includes(i)) {
          picked++;
          setStates((s) => s.map((v, b) => (b === i ? 'good' : v)));
          api.addScore(TRACK_POINTS);
          api.fx.hit(x, y, color.signal.success, TRACK_POINTS);
        } else {
          lost++;
          roundLost++;
          setStates((s) => s.map((v, b) => (b === i ? 'bad' : v)));
          api.fx.oops();
          api.hint(t('games.trackTheStars.notOne'), 'bad');
        }
      }
      open.current = false;
      // Show the ones that got away.
      setStates((s) => s.map((v, b) => (v === 'idle' && targets.includes(b) ? 'glow' : v)));
      streak = roundLost === 0 ? streak + 1 : 0;
      api.combo(streak);
      await api.wait(1000);
    }
    open.current = false;
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    api.finish({
      title: t('games.trackTheStars.title'),
      stars: trackStars(picked, lost, Math.max(total, 1)),
      stats: [
        t('games.trackTheStars.statTracked', { count: picked }),
        t('games.trackTheStars.statLost', { count: lost }),
      ],
      best: { value: picked, label: t('games.trackTheStars.statTracked', { count: picked }) },
    });
  });

  const onField = (e: LayoutChangeEvent) => {
    const { width, height, x, y } = e.nativeEvent.layout;
    fieldRef.current = { w: width, h: height, x, y };
    setField(fieldRef.current);
  };

  const onBead = (i: number) => {
    if (!open.current || tapped.current !== null) return;
    api.haptic('tap');
    api.sound('tap');
    tapped.current = i;
  };

  const bead = (FIELD.bead / FIELD.w) * field.w;
  const fieldW = Math.min(api.board.width, ((api.board.height - space.md * 2) * FIELD.w) / FIELD.h);
  return (
    <View style={styles.fill}>
      <Well
        style={[styles.field, { width: fieldW, height: (fieldW * FIELD.h) / FIELD.w }]}
        onLayout={onField}>
        {field.w > 0
          ? states.map((s, i) => (
              <Bead
                key={i}
                i={i}
                frames={frames}
                p={p}
                field={field}
                size={bead}
                state={s}
                label={t('games.trackTheStars.bead', { n: i + 1 })}
                onPress={() => onBead(i)}
              />
            ))
          : null}
      </Well>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', paddingVertical: space.md },
  field: { alignSelf: 'center' },
  beadBox: { position: 'absolute', left: 0, top: 0 },
  bead: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
    borderWidth: 1,
    borderColor: color.surface.line,
  },
  glow: { backgroundColor: color.game.sky, borderColor: color.text.primary },
  good: { backgroundColor: color.signal.success, borderColor: color.text.primary },
  bad: { backgroundColor: color.signal.danger },
});
