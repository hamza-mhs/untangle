import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useFrame, useRoundLoop, Well } from '../../kit';
import {
  linePos,
  timeError,
  timePoints,
  timeStars,
  TIME_DEG_PER_MS,
  TIME_GIVE_UP_MS,
  TIME_SECONDS,
  TIME_SHOWN_MS,
  TIME_TRIES,
} from './logic';

const POLL_MS = 10;
const DIAL = 190;
const C = DIAL / 2;
const ARC_R = 62;
const ARC_LEN = 2 * Math.PI * ARC_R;
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Prototype dial: 20 ticks, every 4th long. */
const TICKS = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
  const big = i % 4 === 0;
  const inner = big ? 72 : 78;
  return {
    x1: C + 84 * Math.cos(a),
    y1: C + 84 * Math.sin(a),
    x2: C + inner * Math.cos(a),
    y2: C + inner * Math.sin(a),
    big,
  };
});

type Shot = { s: number; err: number };

export default function TimeItRightRound({ api, seed: _seed }: RoundProps) {
  const t = useT();
  const [phase, setPhase] = useState<'ready' | 'sweep' | 'hidden' | 'shown'>('ready');
  const [shot, setShot] = useState<Shot | null>(null);
  const [tries, setTries] = useState<(Shot | null)[]>(
    Array.from({ length: TIME_TRIES }, () => null),
  );
  const [bestI, setBestI] = useState<number | null>(null);
  const pressed = useRef<number | null>(null);
  const open = useRef(false);
  const from = useRef<number | null>(null);
  const deg = useSharedValue(0);
  const lineW = useRef(0);
  const lineY = useRef(0);

  useFrame(api, (now) => {
    const f = from.current;
    if (f !== null) deg.set(Math.min(TIME_SHOWN_MS, now - f) * TIME_DEG_PER_MS);
  });

  const handProps = useAnimatedProps(() => {
    const a = (deg.get() - 90) * (Math.PI / 180);
    return { x2: C + 65 * Math.cos(a), y2: C + 65 * Math.sin(a) };
  });
  const arcProps = useAnimatedProps(() => ({
    strokeDasharray: [(deg.get() / 360) * ARC_LEN, ARC_LEN],
  }));
  const dialStyle = useAnimatedStyle(() => ({ opacity: deg.get() >= 144 ? 0 : 1 }));

  useRoundLoop(api, async () => {
    const timer = api.timer(TIME_SECONDS);
    let k = 0;
    let best = Infinity;
    const shots: (Shot | null)[] = Array.from({ length: TIME_TRIES }, () => null);
    while (!timer.done() && k < TIME_TRIES) {
      api.setRound(t('games.timeItRight.try', { n: k + 1, total: TIME_TRIES }));
      setPhase('ready');
      setShot(null);
      deg.set(0);
      api.hint(t('games.timeItRight.ready'));
      await api.wait(700);
      api.hint(t('games.timeItRight.count'));
      const start = api.clock.now();
      from.current = start;
      setPhase('sweep');
      pressed.current = null;
      open.current = true;
      api.sound('tick');
      while (pressed.current === null && api.clock.now() - start < TIME_GIVE_UP_MS) {
        if (api.clock.now() - start >= TIME_SHOWN_MS) {
          setPhase((p) => (p === 'sweep' ? 'hidden' : p));
          api.quiet(true);
        }
        await api.wait(POLL_MS);
      }
      open.current = false;
      from.current = null;
      api.quiet(false);
      const tapMs = (pressed.current ?? start + TIME_GIVE_UP_MS) - start;
      const err = timeError(tapMs);
      const s = { s: tapMs / 1000, err };
      shots[k] = s;
      setTries([...shots]);
      setShot(s);
      setPhase('shown');
      const pts = timePoints(err);
      api.addScore(pts);
      api.fx.hit(linePos(s.s) * lineW.current, lineY.current, color.game.orange, pts);
      if (Math.abs(err) < best) {
        best = Math.abs(err);
        setBestI(k);
        if (k > 0) api.fx.toast(t('games.timeItRight.closest'), color.signal.successText);
      }
      api.hint(
        Math.abs(err) < 0.1
          ? t('games.timeItRight.spotOn')
          : err > 0
            ? t('games.timeItRight.late')
            : t('games.timeItRight.early'),
        Math.abs(err) < 0.25 ? 'good' : 'bad',
      );
      k++;
      await api.wait(1300);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const b = Number.isFinite(best) ? best : 9;
    const label = t('games.timeItRight.statClosest', { s: b.toFixed(2) });
    api.finish({
      title: t('games.timeItRight.title'),
      stars: timeStars(b),
      stats: [label, t('games.timeItRight.statTries', { count: k })],
      best: { value: Math.round(b * 1000), label },
    });
  });

  const press = () => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && pressed.current === null) pressed.current = api.clock.now();
  };

  const fmt = (e: number) => `${e > 0 ? '+' : '−'}${Math.abs(e).toFixed(2)}`;
  return (
    <View style={styles.fill}>
      <View style={styles.dialBox}>
        <Well style={styles.face}>
          <Animated.View style={dialStyle}>
            <Svg width={DIAL} height={DIAL}>
              {TICKS.map((k, i) => (
                <Line
                  key={i}
                  x1={k.x1}
                  y1={k.y1}
                  x2={k.x2}
                  y2={k.y2}
                  stroke={k.big ? color.text.secondary : color.surface.track}
                  strokeWidth={k.big ? 2.5 : 1.5}
                  strokeLinecap="round"
                />
              ))}
              <AnimatedCircle
                cx={C}
                cy={C}
                r={ARC_R}
                fill="none"
                stroke={color.game.orange}
                strokeWidth={5}
                transform={`rotate(-90 ${C} ${C})`}
                animatedProps={arcProps}
              />
              <AnimatedLine
                x1={C}
                y1={C}
                stroke={color.text.primary}
                strokeWidth={4}
                strokeLinecap="round"
                animatedProps={handProps}
              />
              <Circle cx={C} cy={C} r={6} fill={color.text.primary} />
            </Svg>
          </Animated.View>
          <View style={styles.overlay} pointerEvents="none">
            {phase === 'hidden' ? (
              <Text variant="bodyStrong" tone="secondary">
                {t('games.timeItRight.keep')}
              </Text>
            ) : null}
            {phase === 'shown' && shot ? (
              <View style={styles.reveal} accessible accessibilityLiveRegion="polite">
                <Text variant="statLg">
                  {t('games.timeItRight.seconds', { s: shot.s.toFixed(2) })}
                </Text>
                <Text
                  variant="bodyStrong"
                  style={{
                    color:
                      Math.abs(shot.err) < 0.1
                        ? color.signal.successText
                        : Math.abs(shot.err) < 0.25
                          ? color.signal.warningText
                          : color.signal.dangerText,
                  }}>
                  {t('games.timeItRight.seconds', { s: fmt(shot.err) })}
                </Text>
              </View>
            ) : null}
          </View>
        </Well>
      </View>
      <View
        style={styles.line}
        onLayout={(e) => {
          const { width, y, height } = e.nativeEvent.layout;
          lineW.current = width;
          lineY.current = y + height / 2;
        }}>
        <View style={styles.rule} />
        <View style={styles.target} />
        {shot ? <View style={[styles.you, { left: `${linePos(shot.s) * 100}%` }]} /> : null}
        <View style={styles.labels}>
          {['3 s', '5 s', '7 s'].map((l) => (
            <Text key={l} variant="caption" tone="tertiary">
              {l}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.tries}>
        {tries.map((s, i) => (
          <View key={i} style={[styles.try, bestI === i ? styles.best : null]}>
            <Text variant="caption" tone={s ? 'primary' : 'tertiary'}>
              {s ? fmt(s.err) : '—'}
            </Text>
          </View>
        ))}
      </View>
      <ToyKey
        testID="game.timeItRight.tap"
        tint={color.game.orange}
        accessibilityLabel={t('games.timeItRight.button')}
        onPress={press}
        style={styles.button}>
        <Text variant="button">{t('games.timeItRight.button')}</Text>
      </ToyKey>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.lg, paddingBottom: space.md },
  dialBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  face: {
    width: DIAL + space['2xl'],
    height: DIAL + space['2xl'],
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  reveal: { alignItems: 'center', gap: space.xs },
  line: { height: space['3xl'], marginHorizontal: space.lg, justifyContent: 'center' },
  rule: { height: 2, backgroundColor: color.surface.track },
  target: {
    position: 'absolute',
    left: '50%',
    width: 3,
    height: space.lg,
    marginLeft: -1.5,
    backgroundColor: color.text.primary,
  },
  you: {
    position: 'absolute',
    width: space.md,
    height: space.md,
    marginLeft: -space.md / 2,
    borderRadius: radius.pill,
    backgroundColor: color.game.orange,
  },
  labels: {
    position: 'absolute',
    top: space['3xl'] - space.sm,
    left: -space.sm,
    right: -space.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tries: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginTop: space.md },
  try: {
    minWidth: size.touch,
    paddingVertical: space.xs,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.surface.card,
  },
  best: { borderWidth: 1, borderColor: color.signal.success },
  button: { height: size.touch * 1.6 },
});
