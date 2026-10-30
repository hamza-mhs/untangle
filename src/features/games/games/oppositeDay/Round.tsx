import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { Arrow, ToyKey, useRoundLoop, Well, type ArrowDir } from '../../kit';
import { DIRS, OPPOSITE, oppPoints, oppStars, oppTrials, OPP_SECONDS, OPP_TRIALS } from './logic';

const POLL_MS = 40;
/** D-pad cells on a 3 × 3 grid: [row, col]. */
const CELL: Record<ArrowDir, [number, number]> = {
  up: [0, 1],
  left: [1, 0],
  right: [1, 2],
  down: [2, 1],
};

export default function OppositeDayRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const key = Math.min((W - space.md * 2) / 3.4, size.touch * 2.2);
  const padW = key * 3 + space.sm * 2;
  const padTop = api.board.height - padW - space.md;
  const [shown, setShown] = useState<{ dir: ArrowDir; n: number } | null>(null);
  const [bad, setBad] = useState<ArrowDir | null>(null);
  const answer = useRef<ArrowDir | null>(null);
  const open = useRef(false);

  const keyCentre = (d: ArrowDir) => {
    const [r, c] = CELL[d];
    return {
      x: (W - padW) / 2 + c * (key + space.sm) + key / 2,
      y: padTop + r * (key + space.sm) + key / 2,
    };
  };

  useRoundLoop(api, async () => {
    const trials = oppTrials(seed);
    const timer = api.timer(OPP_SECONDS);
    let n = 0;
    let right = 0;
    let slips = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && n < OPP_TRIALS) {
      const d = trials[n]!;
      n++;
      api.setRound(t('games.hud.of', { n, total: OPP_TRIALS }));
      setShown({ dir: d, n });
      api.hint(t('games.oppositeDay.tap'));
      answer.current = null;
      open.current = true;
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      const a = answer.current;
      if (a === null) break;
      const c = keyCentre(a);
      if (a === OPPOSITE[d]) {
        right++;
        streak++;
        api.combo(streak);
        const pts = oppPoints(streak);
        api.addScore(pts);
        api.fx.hit(c.x, c.y, color.game.violet, pts);
        api.hint(
          streak >= 3
            ? t('games.oppositeDay.inARow', { n: streak })
            : t('games.oppositeDay.opposite'),
          'good',
        );
        setShown({ dir: a, n: n + 0.5 });
      } else {
        slips++;
        streak = 0;
        api.combo(0);
        setBad(a);
        api.fx.oops();
        api.hint(t(a === d ? 'games.oppositeDay.sameWay' : 'games.oppositeDay.notOpposite'), 'bad');
        await api.wait(450);
        setBad(null);
      }
      await api.wait(330);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = Math.max(right + slips, 1);
    api.finish({
      title: t('games.oppositeDay.title'),
      stars: oppStars(right),
      stats: [
        t('games.oppositeDay.statRight', { right, n: total }),
        t('games.common.slips', { count: slips }),
      ],
      best: { value: right, label: t('games.oppositeDay.statRight', { right, n: total }) },
    });
  });

  const press = (d: ArrowDir) => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && answer.current === null) answer.current = d;
  };

  return (
    <View style={styles.fill}>
      <View style={[styles.tokenBox, { bottom: padW + space['2xl'] }]}>
        {shown ? (
          <Animated.View
            key={shown.n}
            {...(api.reducedMotion ? {} : { entering: ZoomIn.duration(200) })}
            style={[styles.token, { width: key * 1.5, height: key * 1.5 }]}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={t(`games.oppositeDay.dirs.${shown.dir}`)}>
            <Arrow dir={shown.dir} size={key * 0.9} />
          </Animated.View>
        ) : null}
      </View>
      <View style={[styles.pad, { width: padW, height: padW, top: padTop }]}>
        <Well
          style={[
            styles.centre,
            { width: key, height: key, left: key + space.sm, top: key + space.sm },
          ]}
        />
        {DIRS.map((d) => {
          const [r, c] = CELL[d];
          return (
            <View
              key={d}
              style={[
                styles.cell,
                {
                  width: key,
                  height: key,
                  left: c * (key + space.sm),
                  top: r * (key + space.sm),
                },
                bad === d ? styles.bad : null,
              ]}>
              <ToyKey
                testID={`game.oppositeDay.${d}`}
                tint={color.game.violet}
                accessibilityLabel={t(`games.oppositeDay.dirs.${d}`)}
                onPress={() => press(d)}
                style={styles.key}>
                <Arrow dir={d} size={key * 0.42} />
              </ToyKey>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tokenBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  token: {
    borderRadius: radius['4xl'],
    backgroundColor: color.game.pink,
    borderWidth: 3,
    borderColor: color.game.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: { position: 'absolute', alignSelf: 'center' },
  centre: { position: 'absolute' },
  cell: { position: 'absolute' },
  key: { flex: 1 },
  bad: { borderRadius: radius['3xl'], borderWidth: 3, borderColor: color.signal.danger },
});
