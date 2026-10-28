import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  GameIntro,
  GameShell,
  Ghost,
  PrimaryButton,
  ResultStats,
  StarField,
  Text,
} from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { DevSkip } from '@/features/dev/DevSkip';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { useScoringStore } from '@/features/scoring/store';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { dayKey } from '@/lib/time';

import { otherRep, REPS } from '../catalog';
import { GAME_HEX, gameBg } from '../gameColors';
import { peekRound, playedToday, useRepsStore } from '../repsStore';
import { hashSeed } from '../rng';
import { MAX_LEVEL, retriesLeft, roundAccess } from '../rules';
import { createRepTimer, type RepTimer } from '../timer';
import type { GameProgress, LossInfo } from './gameTypes';
import { GAMES, type GameId } from './games';

const COUNTDOWN_FROM = 3;
const TICK_MS = 250;
const STARS_OPACITY = 0.6;

type Attempt = { n: number; seed: number; level: number; durationMs: number; timer: RepTimer };

type Phase =
  | { kind: 'intro' }
  | { kind: 'ready'; count: number }
  | { kind: 'playing' }
  | { kind: 'paused' }
  | {
      kind: 'won';
      elapsedMs: number;
      detail: string;
      prevBest: number | undefined;
      levelBefore: number;
      levelAfter: number;
    }
  | { kind: 'lost'; info: LossInfo; reason: 'time' | 'lives'; retries: number }
  | { kind: 'dailyDone' };

/**
 * One rep, every state (pack 2 SPEC §4, R1–R7 + FTimeUp): intro → 3-2-1 → playing (time-boxed,
 * paused while the app is in the background) → won / time up, or "Done for today" when today's
 * round is already used. The game itself only draws the playing view (see gameTypes).
 */
export function RepScreen({ id }: { id: GameId }) {
  const t = useT();
  const def = REPS[id];
  const game = GAMES[id];
  const hex = GAME_HEX[def.color];
  const name = t(`reps.${id}.name`);

  const [phase, setPhase] = useState<Phase>(() => {
    const access = roundAccess(peekRound(id));
    return access.kind === 'doneToday' ? { kind: 'dailyDone' } : { kind: 'intro' };
  });
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [left, setLeft] = useState(0);
  const [progress, setProgress] = useState<GameProgress>(null);
  const loss = useRef<LossInfo>({ line: '' });
  const report = useCallback((info: LossInfo) => {
    loss.current = info;
  }, []);

  const begin = () => {
    const store = useRepsStore.getState();
    store.start(id);
    const n = store.today[id]?.attempts ?? 1;
    const level = store.level[id] ?? 1;
    const durationMs = game.durationMs(level);
    setAttempt({
      n,
      seed: hashSeed(`${id}:${dayKey()}:${n}`),
      level,
      durationMs,
      timer: createRepTimer(durationMs),
    });
    setLeft(durationMs);
    setProgress(null);
    loss.current = { line: '' };
    setPhase({ kind: 'ready', count: COUNTDOWN_FROM });
  };

  // R1: 3-2-1, then the clock starts.
  useEffect(() => {
    if (phase.kind !== 'ready' || !attempt) return;
    const id = setTimeout(() => {
      if (phase.count > 1) setPhase({ kind: 'ready', count: phase.count - 1 });
      else {
        attempt.timer.start(Date.now());
        setPhase({ kind: 'playing' });
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [phase, attempt]);

  const lose = (info: LossInfo, reason: 'time' | 'lives') => {
    if (!attempt) return;
    const now = Date.now();
    attempt.timer.pause(now);
    useRepsStore.getState().finish(id, { won: false, elapsedMs: attempt.timer.elapsed(now) });
    haptics.warning();
    setPhase({
      kind: 'lost',
      info,
      reason,
      retries: retriesLeft(useRepsStore.getState().roundFor(id)),
    });
  };

  // The clock: only foreground time counts.
  useEffect(() => {
    if (phase.kind !== 'playing' || !attempt) return;
    const tick = setInterval(() => {
      const remaining = attempt.timer.remaining(Date.now());
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        lose(loss.current, 'time');
      }
    }, TICK_MS);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `lose` reads the latest attempt
  }, [phase.kind, attempt]);

  // R5: leaving the app (or a call) pauses the round; nothing is lost.
  useEffect(() => {
    if (phase.kind !== 'playing' || !attempt) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      attempt.timer.pause(Date.now());
      setLeft(attempt.timer.remaining(Date.now()));
      setPhase({ kind: 'paused' });
    });
    return () => sub.remove();
  }, [phase.kind, attempt]);

  const resume = () => {
    attempt?.timer.resume(Date.now());
    setPhase({ kind: 'playing' });
  };

  const win = (detail: string) => {
    if (!attempt) return;
    const now = Date.now();
    attempt.timer.pause(now);
    const elapsedMs = attempt.timer.elapsed(now);
    const store = useRepsStore.getState();
    const prevBest = store.bestMs[id];
    store.finish(id, { won: true, elapsedMs }, now);
    useScoringStore.getState().recordEarn('rep', def.points, def.minutes, id, 'timed', now);
    haptics.success();
    setPhase({
      kind: 'won',
      elapsedMs,
      detail,
      prevBest,
      levelBefore: attempt.level,
      levelAfter: useRepsStore.getState().level[id] ?? attempt.level,
    });
  };

  const backToToday = () => router.replace('/today');
  const backToChallenges = () => router.replace('/challenges');

  const inRound = phase.kind === 'playing' || phase.kind === 'paused';
  const right =
    inRound && attempt
      ? {
          kind: 'timer' as const,
          node: (
            <Text variant="label.strong" tone="onAccent">
              {formatClock(t, left)}
            </Text>
          ),
        }
      : phase.kind === 'intro'
        ? { kind: 'points' as const, value: def.points }
        : { kind: 'none' as const };

  const Game = game.Component;
  const Preview = game.Preview;

  return (
    <>
      <GameShell
        testID={`rep.${id}`}
        title={name}
        right={right}
        closeKind={inRound ? 'quit' : 'close'}
        onClose={() => (router.canGoBack() ? router.back() : backToChallenges())}
        {...(phase.kind === 'playing' && progress ? { progress: { ...progress, color: hex } } : {})}
        footer={footerFor()}>
        {phase.kind === 'intro' ? (
          <GameIntro
            tag={t(`reps.tag.${def.color}`)}
            title={name}
            preview={<Preview />}
            rules={[t(`reps.${id}.rule1`), t(`reps.${id}.rule2`), t(`reps.${id}.rule3`)]}
            meta={t(`reps.${id}.meta`, { points: def.points })}
            color={hex}
            startLabel={
              roundAccess(peekRound(id)).kind === 'retry'
                ? t('reps.intro.retry')
                : t('reps.intro.start')
            }
            onStart={begin}
          />
        ) : null}

        {phase.kind === 'ready' && attempt ? (
          <View style={styles.ready} accessibilityLiveRegion="assertive">
            <Text variant="body.xl.regular" tone="muted" align="center">
              {t(`reps.${id}.ready`, { time: formatDuration(t, attempt.durationMs) })}
            </Text>
            <Text variant="display.countdown" align="center" style={{ color: hex }}>
              {phase.count}
            </Text>
            <Text
              variant="body.xl.regular"
              tone="secondary"
              align="center"
              style={styles.readyRule}>
              {t(`reps.${id}.readyRule`)}
            </Text>
          </View>
        ) : null}

        {(phase.kind === 'playing' || phase.kind === 'paused') && attempt ? (
          <View style={styles.flex}>
            <Game
              key={attempt.n}
              level={attempt.level}
              seed={attempt.seed}
              running={phase.kind === 'playing'}
              onWin={win}
              onLose={(info) => lose(info, 'lives')}
              report={report}
              setProgress={setProgress}
            />
            {phase.kind === 'paused' ? (
              <View style={styles.paused} accessibilityViewIsModal>
                <Text variant="body.l" tone="muted" align="center">
                  {t('reps.paused.title')}
                </Text>
                <Text variant="display.op" align="center" style={styles.pausedClock}>
                  {formatClock(t, left)}
                </Text>
                <Text variant="body.xl.regular" tone="secondary" align="center">
                  {t('reps.paused.body')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase.kind === 'won' ? renderWon() : null}
        {phase.kind === 'lost' ? renderLost() : null}
        {phase.kind === 'dailyDone' ? renderDailyDone() : null}
      </GameShell>
      {phase.kind === 'playing' ? (
        <DevSkip label="DEV · Win round" onSkip={() => win('DEV')} />
      ) : null}
    </>
  );

  function footerFor() {
    if (phase.kind === 'paused') {
      return (
        <>
          <PrimaryButton testID="rep.resume" label={t('reps.paused.resume')} onPress={resume} />
          <PrimaryButton
            label={t('reps.paused.quit')}
            variant="outline"
            onPress={backToChallenges}
          />
        </>
      );
    }
    if (phase.kind === 'won') {
      return <PrimaryButton testID="rep.back" label={t('focus.done.back')} onPress={backToToday} />;
    }
    if (phase.kind === 'lost') {
      return (
        <>
          <PrimaryButton
            testID="rep.retry"
            label={
              phase.retries > 0
                ? t('reps.timeUp.retry', { count: phase.retries })
                : t('reps.timeUp.noRetry')
            }
            disabled={phase.retries === 0}
            onPress={begin}
          />
          <PrimaryButton
            label={t('reps.timeUp.back')}
            variant="outline"
            onPress={backToChallenges}
          />
        </>
      );
    }
    if (phase.kind === 'dailyDone') {
      const other = otherRep(id, playedToday(useRepsStore.getState().today));
      return (
        <>
          {other ? (
            <PrimaryButton
              label={t('reps.daily.other', { game: t(`reps.${other}.name`) })}
              onPress={() =>
                other === 'read'
                  ? router.replace('/challenges')
                  : router.replace({ pathname: '/reps/[game]', params: { game: other } })
              }
            />
          ) : null}
          <PrimaryButton
            label={t('focus.done.back')}
            variant={other ? 'outline' : 'accent'}
            onPress={backToToday}
          />
        </>
      );
    }
    return undefined;
  }

  function renderWon() {
    if (phase.kind !== 'won') return null;
    const harder = phase.levelAfter > phase.levelBefore;
    const detail =
      phase.prevBest !== undefined
        ? t('reps.won.subBest', { detail: phase.detail, best: formatClock(t, phase.prevBest) })
        : phase.detail;
    return (
      <Celebration mood={1}>
        <Text variant="title.l" align="center" accessibilityRole="header">
          {t('reps.won.title', { time: formatClock(t, phase.elapsedMs) })}
        </Text>
        <Text variant="body.xl.regular" tone="muted" align="center" style={styles.sub}>
          {detail}
        </Text>
        <View style={styles.stats}>
          <ResultStats
            items={[
              {
                label: t('reps.won.points'),
                value: `+${def.points}`,
                sub: t('reps.won.pointsSub'),
                subTone: 'success',
              },
              {
                label: t('reps.won.earned'),
                value: t('reps.won.minutes', { count: def.minutes }),
                sub: t('reps.won.earnedSub'),
                subTone: 'accent',
              },
              {
                label: t('reps.won.next'),
                value: harder
                  ? t('reps.won.harder')
                  : phase.levelAfter >= MAX_LEVEL
                    ? t('reps.won.top')
                    : t('reps.won.same'),
                sub: t(`reps.${id}.level`, { n: game.levelValue(phase.levelAfter) }),
                subTone: 'muted',
              },
            ]}
          />
        </View>
      </Celebration>
    );
  }

  function renderLost() {
    if (phase.kind !== 'lost') return null;
    const { info } = phase;
    const parts = info.highlight ? info.line.split(info.highlight) : [info.line];
    const best = useRepsStore.getState().bestMs[id];
    return (
      <Celebration mood={0} small>
        <Text variant="title.xl" align="center" accessibilityRole="header">
          {t(phase.reason === 'lives' ? 'reps.timeUp.titleLives' : 'reps.timeUp.title')}
        </Text>
        <Text variant="body.xl.regular" tone="secondary" align="center" style={styles.sub}>
          {parts[0]}
          {info.highlight && parts.length > 1 ? (
            <Text variant="body.xl" tone="accent">
              {info.highlight}
            </Text>
          ) : null}
          {parts.slice(1).join(info.highlight ?? '')}
        </Text>
        {info.tiles ? (
          <View style={styles.tiles}>
            {info.tiles.map((tile, i) => (
              <View key={i} style={[styles.tile, tile.hit ? gameBg[def.color] : styles.tileMiss]}>
                <Text variant="display.tile" tone={tile.hit ? 'ink' : 'faint'}>
                  {tile.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.note}>
          <Text variant="body.l" tone="muted">
            {best !== undefined
              ? t('reps.timeUp.noteBest', { best: Math.round(best / 1000) })
              : t('reps.timeUp.note')}
          </Text>
        </View>
      </Celebration>
    );
  }

  function renderDailyDone() {
    return (
      <Celebration mood={0.5} small>
        <Text variant="title.xl" align="center" accessibilityRole="header">
          {t('reps.daily.title')}
        </Text>
        <Text variant="body.xl.regular" tone="secondary" align="center" style={styles.sub}>
          {t('reps.daily.body')}
        </Text>
      </Celebration>
    );
  }
}

/** Stars, a ghost and centred content: R6, R7 and FTimeUp. */
function Celebration({
  mood,
  small = false,
  children,
}: {
  mood: number;
  small?: boolean;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.flex}>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          tileWidth={SCENE_WIDTH}
          height={layout.splash.starsHeight}
          width={width}
          opacity={STARS_OPACITY}
        />
      </View>
      <View style={styles.celebration}>
        <View style={styles.ghost}>
          <Ghost mood={mood} width={small ? size.watchTile * 0.56 : size.watchTile * 0.88} />
        </View>
        {children}
      </View>
    </View>
  );
}

type T = ReturnType<typeof useT>;

/** "1m 24s" (time left rounds up so the pill never shows 0m 00s while time remains). */
export function formatClock(t: T, ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return t('reps.clock', { m: Math.floor(total / 60), s: String(total % 60).padStart(2, '0') });
}

function formatDuration(t: T, ms: number): string {
  const sec = Math.round(ms / 1000);
  return sec % 60 === 0
    ? t('reps.time.minutes', { count: sec / 60 })
    : t('reps.time.seconds', { count: sec });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ready: { flex: 1, paddingHorizontal: layout.onboarding.optionsX, paddingTop: space.huge * 2 },
  readyRule: { marginTop: space.xl, paddingHorizontal: space.xxl },
  paused: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.bg.canvas,
    paddingTop: space.huge * 2,
    paddingHorizontal: layout.onboarding.optionsX,
  },
  pausedClock: { marginVertical: space.lg },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  celebration: { flex: 1, paddingHorizontal: layout.onboarding.optionsX },
  ghost: { alignItems: 'center', marginTop: space.lg, marginBottom: space.xl },
  sub: { marginTop: space.md },
  stats: { marginTop: space.xxl },
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginTop: space.lg },
  tile: {
    width: size.timeUpTile.width,
    height: size.timeUpTile.height,
    ...rounded(radius.m),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMiss: { backgroundColor: color.bg.raisedHigh },
  note: {
    marginTop: space.lg,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    padding: space.lg,
  },
});
