import { useEffect, useReducer, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Ghost, Icon, LiveText, StarField, Text, TextLink } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { startingClarity } from '@/features/clarity/score';
import { HoldButton } from '@/features/onboarding/components/HoldButton';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import {
  countdownParts,
  initialQuietState,
  makeQuietReducer,
  QUIET_MINUTE_MS,
  QUIET_SKIP_AFTER_MS,
  type QuietPhase,
} from '@/features/onboarding/logic/quietMinute';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { isFaceDownAvailable, watchFaceDown } from '@/services/sensors/faceDown';

const STEP = stepOf('quiet-minute');
const ONE_MINUTE = makeQuietReducer(QUIET_MINUTE_MS);
const Q = layout.quietMinute;
const STARS_OPACITY = 0.6;
const NO_RUN = -1;

/**
 * Onboarding 12 · one quiet minute, phone face-down. waiting → running ⇄ paused → done (→ OB13
 * automatically). No sensor → "Hold to continue". "Skip" appears after 10 s. The countdown is
 * drawn from a UI-thread clock; React only re-renders on phase changes.
 */
export default function QuietMinute() {
  const t = useT();
  const { width } = useWindowDimensions();
  const [state, dispatch] = useReducer(ONE_MINUTE, initialQuietState);
  const [hasSensor, setHasSensor] = useState<boolean | null>(null);
  const [canSkip, setCanSkip] = useState(false);

  // Mirrors of the reducer state for the clock (UI thread).
  const elapsedBase = useSharedValue(0);
  const runningSince = useSharedValue(NO_RUN);
  const minutes = useSharedValue(countdownParts(QUIET_MINUTE_MS).minutes);
  const seconds = useSharedValue(countdownParts(QUIET_MINUTE_MS).seconds);

  useEffect(() => {
    let alive = true;
    void isFaceDownAvailable().then((ok) => alive && setHasSensor(ok));
    const skipTimer = setTimeout(() => setCanSkip(true), QUIET_SKIP_AFTER_MS);
    return () => {
      alive = false;
      clearTimeout(skipTimer);
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

  const finish = () => dispatch({ type: 'tick', now: Date.now() });

  useFrameCallback(() => {
    const since = runningSince.value;
    const run = since === NO_RUN ? 0 : Date.now() - since;
    const remaining = Math.max(0, QUIET_MINUTE_MS - elapsedBase.value - run);
    const parts = countdownParts(remaining);
    if (parts.minutes !== minutes.value) minutes.set(parts.minutes);
    if (parts.seconds !== seconds.value) seconds.set(parts.seconds);
    if (remaining === 0 && since !== NO_RUN) {
      runningSince.set(NO_RUN);
      scheduleOnRN(finish);
    }
  });

  useEffect(() => {
    if (state.phase !== 'done') return;
    haptics.success();
    completeQuietMinute();
  }, [state.phase]);

  const status = statusOf(state.phase, hasSensor === false);
  return (
    <>
      <View style={styles.root}>
        <OnboardingScreen
          step={STEP}
          scroll={false}
          contentStyle={styles.content}
          footer={
            <View>
              <View
                testID={`quietMinute.status.${state.phase}`}
                style={[styles.status, state.phase === 'paused' && styles.statusPaused]}
                accessibilityLiveRegion="polite"
                accessible
                accessibilityLabel={`${t(status.title)}. ${t(status.sub)}`}>
                <View style={[styles.statusIcon, status.isOn ? styles.iconOn : styles.iconOff]}>
                  <Icon
                    name={status.icon}
                    size={size.icon.lg}
                    color={status.isOn ? color.text.onAccent : color.text.primary}
                  />
                </View>
                <View style={styles.statusText}>
                  <Text variant="body.l" numberOfLines={2}>
                    {t(status.title)}
                  </Text>
                  <Text variant="meta" tone="muted" numberOfLines={2}>
                    {t(status.sub)}
                  </Text>
                </View>
              </View>
              <View style={styles.slot}>
                {hasSensor === false && state.phase !== 'done' ? (
                  <HoldButton
                    testID="quietMinute.hold"
                    label={t('onboarding.quietMinute.hold')}
                    onHoldStart={() => dispatch({ type: 'down', now: Date.now() })}
                    onHoldEnd={() => dispatch({ type: 'up', now: Date.now() })}
                  />
                ) : null}
                {canSkip && state.phase !== 'done' ? (
                  <TextLink
                    testID="quietMinute.skip"
                    label={t('onboarding.quietMinute.skip')}
                    tone="muted"
                    onPress={completeQuietMinute}
                  />
                ) : null}
              </View>
            </View>
          }>
          <Text variant="meta" tone="muted" align="center">
            {t('onboarding.quietMinute.caption')}
          </Text>
          <View style={styles.ghost}>
            <Ghost animated width={Q.ghostWidth} />
          </View>
          <Text variant="label.strong" tone="muted" align="center" style={styles.timeLeft}>
            {t('onboarding.quietMinute.timeLeft')}
          </Text>
          <View style={styles.timer} accessible accessibilityRole="timer">
            <LiveText testID="quietMinute.minutes" text={minutes} variant="display.xl" />
            <LiveText
              testID="quietMinute.seconds"
              text={seconds}
              variant="display.xl"
              style={styles.seconds}
            />
          </View>
          <Text variant="lead" align="center" style={styles.body}>
            {t('onboarding.quietMinute.body')}
          </Text>
        </OnboardingScreen>
        <View style={styles.stars} pointerEvents="none">
          <StarField
            stars={stars}
            tileWidth={SCENE_WIDTH}
            height={Q.starsHeight}
            width={width}
            opacity={STARS_OPACITY}
          />
        </View>
      </View>
      <DevSkip label="DEV · Skip minute" onSkip={completeQuietMinute} />
    </>
  );
}

/** Done or skipped: fix the starting Clarity once, then OB13. */
function completeQuietMinute() {
  const store = useOnboardingStore.getState();
  if (store.startingClarity === null) {
    store.setAnswer(
      'startingClarity',
      startingClarity({ screenTime: store.screenTime, when: store.when }),
    );
  }
  goNext(STEP);
}

type Status = {
  title: string;
  sub: string;
  icon: 'check' | 'pause' | 'phone';
  isOn: boolean;
};

function statusOf(phase: QuietPhase, isHold: boolean): Status {
  const k = 'onboarding.quietMinute.';
  if (phase === 'running' || phase === 'done') {
    return {
      title: `${k}statusRunningTitle`,
      sub: `${k}statusRunningSub`,
      icon: 'check',
      isOn: true,
    };
  }
  if (phase === 'paused') {
    return {
      title: `${k}statusPausedTitle`,
      sub: `${k}statusPausedSub`,
      icon: 'pause',
      isOn: true,
    };
  }
  if (isHold) {
    return { title: `${k}statusHoldTitle`, sub: `${k}statusHoldSub`, icon: 'phone', isOn: false };
  }
  return {
    title: `${k}statusWaitingTitle`,
    sub: `${k}statusWaitingSub`,
    icon: 'phone',
    isOn: false,
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { marginTop: Q.captionTop, paddingHorizontal: 0 },
  ghost: { alignItems: 'center' },
  timeLeft: { marginTop: Q.timeLeftTop },
  timer: { marginTop: Q.timerTop, flexDirection: 'row', justifyContent: 'center' },
  seconds: { color: color.mood.pink, marginLeft: space.lg },
  body: { marginTop: Q.bodyTop, paddingHorizontal: layout.onboarding.subtitleX },
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
  statusText: { flex: 1 },
  slot: { minHeight: Q.actionSlot, justifyContent: 'flex-end', gap: layout.onboarding.gridGap },
});
