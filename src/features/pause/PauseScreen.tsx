import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import {
  AppIcon,
  Button,
  GameIcon,
  Icon,
  PressableScale,
  Screen,
  SiteIcon,
  Text,
} from '@/design/components';
import type { IconName } from '@/design/icons';
import { color, radius, size, space } from '@/design/tokens';
import { GameShell, gameMeta, playedToday, useTrainingStore, type GameId } from '@/features/games';
import { useSettingsStore } from '@/features/settings';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';
import { blocker } from '@/native';

import { BreathView } from './BreathView';
import { logDetour, type DetourChoice } from './detours';
import { pickPauseGame, planPause, reasonChip, type PauseParams } from './variant';

/** Firm unlocks: fixed by 02-android-platform §4.6. */
const FIRM_MINUTES = 3;
const FIRM_WAIT_SECONDS = 30;
/** Time's up: "You stopped on time" when Back comes this quickly. */
const ON_TIME_MS = 10_000;

/** Games offered recently, so the same one doesn't come up every pause. */
const recentOffered: GameId[] = [];

function Choice({
  icon,
  art,
  title,
  sub,
  primary,
  onPress,
  testID,
}: {
  icon?: IconName;
  art?: ReactNode;
  title: string;
  sub: string;
  primary?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      onPress={onPress}
      style={[styles.choice, primary ? styles.choicePrimary : null]}>
      {art ??
        (icon ? (
          <Icon
            name={icon}
            size={size.icon.md}
            color={primary ? color.text.onLight : color.text.primary}
          />
        ) : null)}
      <View style={styles.choiceText}>
        <Text variant="bodyLg" tone={primary ? 'onLight' : 'primary'}>
          {title}
        </Text>
        <Text variant="caption" tone={primary ? 'onLight' : 'secondary'}>
          {sub}
        </Text>
      </View>
    </PressableScale>
  );
}

function FirmUnlockButton({
  seconds,
  label,
  onPress,
}: {
  seconds: number;
  label: string;
  onPress: () => void;
}) {
  const t = useT();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <Button
      testID="pause.unlock"
      variant="ghost"
      label={left > 0 ? t('pause.after.wait', { s: left }) : label}
      disabled={left > 0}
      onPress={onPress}
    />
  );
}

/** The pause screen family (20-phase2-core-app §8), opened over a blocked app. */
export function PauseScreen({ params }: { params: PauseParams }) {
  const t = useT();
  const unlockGentle = useSettingsStore((s) => s.unlockMinutes);
  const [stage, setStage] = useState<'main' | 'breath' | 'game'>('main');
  const [shownAt] = useState(() => Date.now());
  const [game] = useState<GameId>(() => {
    let played = new Set<string>();
    try {
      played = playedToday();
    } catch {
      // No history yet.
    }
    const g = pickPauseGame({
      training: useTrainingStore.getState().today(),
      playedToday: played,
      recentOffered,
      rand: Math.random,
    });
    recentOffered.push(g);
    if (recentOffered.length > 6) recentOffered.shift();
    return g;
  });
  const plan = planPause(params, {
    unlockMinutesGentle: unlockGentle,
    unlockMinutesFirm: FIRM_MINUTES,
    firmWaitSeconds: FIRM_WAIT_SECONDS,
  });
  const app = params.label;
  const isSite = params.targetKey.startsWith('site:');

  const log = (choice: DetourChoice) => {
    if (!plan.logsDetours) return;
    try {
      logDetour({ targetKey: params.targetKey, choice, lockId: params.lockId });
    } catch {
      // Logging must never block leaving.
    }
  };

  /** Back to my day: the home screen, never back into the blocked app (§4.3). */
  const leave = useCallback(() => {
    if (params.preview) {
      router.back();
      return;
    }
    void blocker.goHome();
    router.replace('/');
  }, [params.preview]);

  const backToDay = (from: 'main' | 'breath' | 'game') => {
    if (from === 'main') log('back');
    if (plan.variant === 'timeUp' && Date.now() - shownAt <= ON_TIME_MS) {
      showToast({
        title: t('pause.timeUp.onTime'),
        sub: t('pause.timeUp.onTimeSub'),
        tone: 'success',
      });
    }
    leave();
  };

  // System Back anywhere in the pause flow = Back to my day.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      backToDay(stage);
      return true;
    });
    return () => sub.remove();
  });

  const unlock = async () => {
    if (params.preview || plan.unlockMinutes === null) return;
    try {
      await blocker.grantUnlock(params.targetKey as `app:${string}`, plan.unlockMinutes);
      await blocker.openTarget(params.targetKey as `app:${string}`);
    } catch {
      showToast({ title: t('pause.after.unlockFailed'), tone: 'neutral' });
    }
    router.replace('/');
  };

  if (stage === 'breath') {
    return (
      <Screen
        testID="pause.breath"
        footer={
          <Button
            variant="secondary"
            label={t('pause.back.title')}
            onPress={() => backToDay('breath')}
          />
        }>
        <BreathView onDone={() => backToDay('breath')} />
      </Screen>
    );
  }

  if (stage === 'game') {
    const meta = gameMeta(game)!;
    return (
      <GameShell
        gameId={meta.id}
        source="pause"
        kicker={t('pause.game.kicker', { app })}
        onQuit={() => setStage('main')}
        renderActions={() => (
          <>
            <Button
              testID="pause.after.back"
              label={t('pause.back.title')}
              onPress={() => backToDay('game')}
            />
            {plan.unlockMinutes !== null && !params.preview ? (
              plan.waitSeconds > 0 ? (
                <FirmUnlockButton
                  seconds={plan.waitSeconds}
                  label={t('pause.after.open', { app, minutes: plan.unlockMinutes })}
                  onPress={() => void unlock()}
                />
              ) : (
                <Button
                  testID="pause.unlock"
                  variant="ghost"
                  label={t('pause.after.open', { app, minutes: plan.unlockMinutes })}
                  onPress={() => void unlock()}
                />
              )
            ) : (
              <Text variant="body" tone="secondary" align="center">
                {t(plan.variant === 'focus' ? 'pause.after.focus' : 'pause.after.locked', { app })}
              </Text>
            )}
          </>
        )}
      />
    );
  }

  const chip = reasonChip(params);
  const focusLeft = params.focusEndAt
    ? Math.max(1, Math.ceil((params.focusEndAt - shownAt) / 60_000))
    : 0;
  const title =
    plan.variant === 'timeUp'
      ? t('pause.timeUp.title')
      : plan.variant === 'focus'
        ? t('pause.focus.title', { minutes: focusLeft })
        : plan.variant === 'locked'
          ? t('pause.locked.title', { app })
          : plan.allDay
            ? t('pause.allDay.title', { app })
            : t('pause.title');
  const body =
    plan.variant === 'timeUp'
      ? t('pause.timeUp.body', { minutes: params.minutesAllowed ?? 0, app })
      : plan.variant === 'focus'
        ? t('pause.focus.body', { app })
        : plan.variant === 'locked'
          ? t('pause.locked.body')
          : plan.variant === 'capReached'
            ? t('pause.cap.body', { count: params.unlocksUsed })
            : t('pause.body', { app, count: params.opensToday });
  const meta = gameMeta(game)!;

  return (
    <Screen testID="pause.main" variant="game">
      <View style={styles.top}>
        {isSite ? (
          <SiteIcon domain={app} size={size.appIcon.sm} />
        ) : (
          <AppIcon label={app} colorKey={params.targetKey.slice(4)} size={size.appIcon.sm} />
        )}
        <Text variant="body" tone="secondary" style={styles.flex} numberOfLines={1}>
          {app}
        </Text>
        <View style={styles.chip}>
          <Icon name="lock" size={size.icon.xs} color={color.text.secondary} />
          <Text variant="caption" tone="secondary">
            {chip.key === 'minutes'
              ? t('pause.chip.minutes', { minutes: chip.minutes })
              : chip.key === 'opens'
                ? t('pause.chip.opens', { count: chip.opens })
                : t(`pause.chip.${chip.key}`)}
          </Text>
        </View>
      </View>
      {params.preview ? (
        <View style={styles.previewPill}>
          <Text variant="micro" tone="onLight">
            {t('pause.preview')}
          </Text>
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="titleLg" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" tone="body">
          {body}
        </Text>
        {plan.variant === 'firm' ? (
          <Text variant="caption" tone="warning">
            {t('pause.firm.note')}
          </Text>
        ) : null}
      </View>
      <View style={styles.choices}>
        {plan.offersChoices ? (
          <>
            <Choice
              testID="pause.choice.game"
              primary
              art={<GameIcon color={color.game[meta.accent]} size={size.appIcon.md} />}
              title={t('pause.game.title')}
              sub={t('pause.game.sub', {
                game: t(`games.list.${meta.id}.name`),
                seconds: meta.seconds,
              })}
              onPress={() => {
                log('game');
                setStage('game');
              }}
            />
            <Choice
              testID="pause.choice.breath"
              icon="wind"
              title={t('pause.breath.title')}
              sub={t('pause.breath.sub')}
              onPress={() => {
                log('breath');
                setStage('breath');
              }}
            />
            <Choice
              testID="pause.choice.back"
              icon="sun"
              title={t('pause.back.title')}
              sub={t('pause.back.sub', { app })}
              onPress={() => backToDay('main')}
            />
          </>
        ) : (
          <>
            <Button
              testID="pause.timeUp.back"
              label={t('pause.back.title')}
              onPress={() => backToDay('main')}
            />
            <Button
              variant="ghost"
              label={t('pause.back.sub', { app })}
              onPress={() => backToDay('main')}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: color.surface.control,
  },
  previewPill: {
    alignSelf: 'flex-start',
    marginTop: space.md,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: color.signal.warning,
  },
  text: { gap: space.md, marginTop: space['2xl'] },
  choices: { flex: 1, justifyContent: 'flex-end', gap: space.sm, paddingBottom: space.lg },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    minHeight: size.listRow + space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: color.surface.card,
    borderWidth: size.hairline,
    borderColor: color.surface.line,
  },
  choicePrimary: { backgroundColor: color.text.primary, borderColor: color.text.primary },
  choiceText: { flex: 1, gap: 2 },
});
