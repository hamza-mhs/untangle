import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GameShell, Ghost, Icon, LiveText, Text } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { POINTS } from '@/features/challenges/rules';
import { challengeById } from '@/features/challenges/library';
import { useChallengesStore } from '@/features/challenges/store';
import { DevSkip } from '@/features/dev/DevSkip';
import { HoldButton } from '@/features/onboarding/components/HoldButton';
import {
  countdownParts,
  initialQuietState,
  makeQuietReducer,
} from '@/features/onboarding/logic/quietMinute';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { isFaceDownAvailable, watchFaceDown } from '@/services/sensors/faceDown';

const DEFAULT_MINUTES = 5;
const NO_RUN = -1;

/**
 * OxSilence (`challenge/silence`): OB12's mechanics (face-down, pause on lift) at 5 minutes,
 * reusing the same sensor service and state machine. One soft buzz half-way is the only
 * interruption. Calm ghost; minutes over seconds.
 */
export default function Silence() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const def = id ? challengeById(id) : undefined;
  const minutesTotal = def?.target ?? DEFAULT_MINUTES;
  const durationMs = minutesTotal * 60_000;
  const [reducer] = useState(() => makeQuietReducer(durationMs));
  const [state, dispatch] = useReducer(reducer, initialQuietState);
  const [hasSensor, setHasSensor] = useState<boolean | null>(null);
  const elapsedBase = useSharedValue(0);
  const runningSince = useSharedValue(NO_RUN);
  const hasBuzzed = useSharedValue(false);
  const start = countdownParts(durationMs);
  const minutes = useSharedValue(start.minutes);
  const seconds = useSharedValue(start.seconds);

  useEffect(() => {
    let alive = true;
    void isFaceDownAvailable().then((ok) => alive && setHasSensor(ok));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!hasSensor) return;
    return watchFaceDown((isDown) => dispatch({ type: isDown ? 'down' : 'up', now: Date.now() }));
  }, [hasSensor]);
  useEffect(() => {
    elapsedBase.set(state.elapsedMs);
    runningSince.set(state.runningSince ?? NO_RUN);
  }, [state, elapsedBase, runningSince]);

  const tick = () => dispatch({ type: 'tick', now: Date.now() });
  const buzz = () => haptics.tap();

  useFrameCallback(() => {
    const since = runningSince.value;
    const elapsed = elapsedBase.value + (since === NO_RUN ? 0 : Date.now() - since);
    const remaining = Math.max(0, durationMs - elapsed);
    const p = countdownParts(remaining);
    if (p.minutes !== minutes.value) minutes.set(p.minutes);
    if (p.seconds !== seconds.value) seconds.set(p.seconds);
    if (!hasBuzzed.value && elapsed >= durationMs / 2) {
      hasBuzzed.set(true);
      scheduleOnRN(buzz);
    }
    if (remaining === 0 && since !== NO_RUN) {
      runningSince.set(NO_RUN);
      scheduleOnRN(tick);
    }
  });

  const finish = () => {
    const points = def ? useChallengesStore.getState().complete(def.id) : null;
    router.replace({
      pathname: '/challenge/done',
      params: { id: def?.id ?? 'silence-5', points: String(points ?? 0) },
    });
  };

  useEffect(() => {
    if (state.phase !== 'done') return;
    haptics.success();
    finish();
    // finish() reads the store at call time; it only needs to run on the phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const status =
    state.phase === 'running'
      ? { title: 'silence.statusRunning', icon: 'check' as const, isOn: true }
      : state.phase === 'paused'
        ? { title: 'silence.statusPaused', icon: 'pause' as const, isOn: true }
        : {
            title: hasSensor === false ? 'silence.statusHold' : 'silence.statusWaiting',
            icon: 'phone' as const,
            isOn: false,
          };

  return (
    <>
      <GameShell
        title={t('challenges.silence.title')}
        right={{ kind: 'points', value: def ? POINTS[def.difficulty] : 10 }}
        closeKind="quit"
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/challenges'))}
        footer={
          <>
            <View
              style={[styles.status, state.phase === 'paused' && styles.statusPaused]}
              accessible
              accessibilityLiveRegion="polite">
              <View style={[styles.statusIcon, status.isOn ? styles.iconOn : styles.iconOff]}>
                <Icon
                  name={status.icon}
                  size={size.icon.lg}
                  color={status.isOn ? color.text.onAccent : color.text.primary}
                />
              </View>
              <View style={styles.flex}>
                <Text variant="body.l">{t(`challenges.${status.title}`)}</Text>
                <Text variant="meta" tone="muted">
                  {t('challenges.silence.buzz', {
                    at: `${Math.floor(minutesTotal / 2)}m ${minutesTotal % 2 ? '30s' : '00s'}`,
                  })}
                </Text>
              </View>
            </View>
            {hasSensor === false ? (
              <HoldButton
                label={t('onboarding.quietMinute.hold')}
                onHoldStart={() => dispatch({ type: 'down', now: Date.now() })}
                onHoldEnd={() => dispatch({ type: 'up', now: Date.now() })}
              />
            ) : null}
            <Text variant="caption" tone="faint" align="center">
              {t('challenges.silence.privacy')}
            </Text>
          </>
        }>
        <View style={styles.center}>
          <Ghost mood={0.6} width={size.ghost.state - space.xxl} />
          <Text variant="label.strong" tone="muted" style={styles.timeLeft}>
            {t('onboarding.quietMinute.timeLeft')}
          </Text>
          <LiveText text={minutes} variant="display.silence" />
          <LiveText text={seconds} variant="display.silenceSec" style={styles.seconds} />
          <Text variant="body.xl" align="center" style={styles.body}>
            {t('challenges.silence.body')}
          </Text>
        </View>
      </GameShell>
      <DevSkip label="DEV · Finish silence" onSkip={finish} />
    </>
  );
}

const Q = layout.quietMinute;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: space.lg },
  timeLeft: { marginTop: space.lg },
  seconds: { color: color.mood.pink },
  body: { marginTop: space.xl, paddingHorizontal: space.xxl },
  status: {
    height: Q.statusHeight,
    ...pill(Q.statusHeight),
    backgroundColor: color.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Q.statusGap,
    paddingLeft: Q.statusPaddingLeft,
    paddingRight: Q.statusPaddingRight,
  },
  statusPaused: { backgroundColor: color.bg.raisedHigh },
  statusIcon: {
    width: Q.statusIcon,
    height: Q.statusIcon,
    ...pill(Q.statusIcon),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: { backgroundColor: color.mood.pink },
  iconOff: { backgroundColor: color.bg.raisedHigh },
  flex: { flex: 1 },
});
