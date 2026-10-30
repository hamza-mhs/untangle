import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { Arrow, ToyKey, useRoundLoop } from '../../kit';
import {
  beepStars,
  beepTrials,
  BEEP_SECONDS,
  BEEP_TRIALS,
  GO_POINTS,
  GO_WINDOW_MS,
  HOLD_MS,
  HOLD_POINTS,
} from './logic';

const POLL_MS = 20;
type Side = 'left' | 'right';

export default function StopOnTheBeepRound({ api, seed }: RoundProps) {
  const t = useT();
  const [arrow, setArrow] = useState<Side | null>(null);
  const [flash, setFlash] = useState(false);
  const pressed = useRef<Side | null>(null);
  const open = useRef(false);
  const keysY = useRef(0);
  const keysX = useRef<Record<Side, number>>({ left: 0, right: 0 });

  /** Waits up to `ms` of game time for a press; returns it (or null). */
  const waitPress = async (ms: number) => {
    const until = api.clock.now() + ms;
    while (pressed.current === null && api.clock.now() < until) await api.wait(POLL_MS);
    return pressed.current;
  };

  useRoundLoop(api, async () => {
    const trials = beepTrials(seed);
    const timer = api.timer(BEEP_SECONDS);
    let n = 0;
    let fast = 0;
    let held = 0;
    let slips = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && n < BEEP_TRIALS) {
      const tr = trials[n]!;
      n++;
      api.setRound(t('games.hud.of', { n, total: BEEP_TRIALS }));
      pressed.current = null;
      open.current = true;
      setArrow(tr.dir);
      api.hint(t('games.stopOnTheBeep.tap'));
      if (tr.stop) {
        // A tap before the flash still breaks the stop.
        let p = await waitPress(tr.delayMs);
        if (p === null) {
          setFlash(true);
          api.sound('beep');
          api.haptic('bad');
          api.hint(t('games.stopOnTheBeep.freeze'), 'bad');
          p = await waitPress(HOLD_MS);
        }
        open.current = false;
        if (p === null) {
          held++;
          streak++;
          api.combo(streak);
          api.addScore(HOLD_POINTS);
          api.fx.ring(api.board.width / 2, api.board.height * 0.4, color.signal.successText, 120);
          api.sound('good');
          api.hint(t('games.stopOnTheBeep.held'), 'good');
        } else {
          slips++;
          streak = 0;
          api.combo(0);
          api.fx.oops();
          api.hint(t('games.stopOnTheBeep.wasStop'), 'bad');
        }
        setFlash(false);
      } else {
        const p = await waitPress(GO_WINDOW_MS);
        open.current = false;
        if (p === tr.dir) {
          fast++;
          streak++;
          api.combo(streak);
          api.addScore(GO_POINTS);
          api.fx.hit(keysX.current[p], keysY.current, color.game.mint, GO_POINTS);
        } else {
          streak = 0;
          api.combo(0);
          if (p === null) api.hint(t('games.stopOnTheBeep.late'), 'bad');
          else {
            api.fx.oops();
            api.hint(t('games.stopOnTheBeep.wrongWay'), 'bad');
          }
        }
      }
      setArrow(null);
      await api.wait(380);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    api.finish({
      title: t('games.stopOnTheBeep.title'),
      stars: beepStars(fast, held, slips),
      stats: [
        t('games.stopOnTheBeep.statFast', { count: fast }),
        t('games.stopOnTheBeep.statHeld', { held, n: held + slips }),
      ],
      best: { value: fast, label: t('games.stopOnTheBeep.statFast', { count: fast }) },
    });
  });

  const press = (s: Side) => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && pressed.current === null) pressed.current = s;
  };

  return (
    <View style={styles.fill}>
      {flash ? <View style={styles.flash} pointerEvents="none" /> : null}
      <View
        style={styles.arrowBox}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          flash ? t('games.stopOnTheBeep.freeze') : arrow ? t(`games.stopOnTheBeep.${arrow}`) : ''
        }>
        {arrow ? <Arrow dir={arrow} size={size.touch * 3} /> : null}
      </View>
      <View
        style={styles.row}
        onLayout={(e) =>
          (keysY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)
        }>
        {(['left', 'right'] as const).map((s) => (
          <View
            key={s}
            style={styles.cell}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              keysX.current[s] = x + width / 2;
            }}>
            <ToyKey
              testID={`game.stopOnTheBeep.${s}`}
              tint={color.game.mint}
              accessibilityLabel={t(`games.stopOnTheBeep.${s}`)}
              onPress={() => press(s)}
              style={styles.key}>
              <Arrow dir={s} size={size.icon.lg} />
            </ToyKey>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.signal.dangerSoft,
  },
  arrowBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: space.md, paddingBottom: space.md },
  cell: { flex: 1 },
  key: { height: size.touch * 2 },
});
