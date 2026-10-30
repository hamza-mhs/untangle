import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, BackHandler, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  Button,
  CategoryChip,
  GameIcon,
  Icon,
  PressableScale,
  Screen,
  Sheet,
  Text,
} from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { playSound, preloadSounds } from '@/lib/sound';

import { gameMeta, type GameId } from '../catalog';
import { saveResult, type GameSource } from '../results';
import { GameBackground } from './Background';
import { GameClock } from './clock';
import { Countdown } from './Countdown';
import { FxLayer, type FxHandle } from './Fx';
import { HintLine, Hud, type HudState } from './Hud';
import { ResultScreen } from './ResultScreen';
import type { GameApi, GameDefinition, RoundResult } from './types';

/** Calm games show a settle line instead of the countdown (§A.2.3). */
const SETTLE_MS = 1200;
const HUD_TICK_MS = 100;
const SHAKE_PX = 6;

export type GameScreenProps = {
  gameId: GameId;
  definition: GameDefinition;
  source: GameSource;
  /** Pause screen: "You opened Instagram. Play this instead?". */
  kicker?: string;
  onQuit: () => void;
  renderActions: (r: RoundResult, again: () => void, calm: boolean) => ReactNode;
  onCompleted?: (r: RoundResult) => void;
};

type Phase = 'intro' | 'start' | 'play' | 'result';

/**
 * The game shell (BATCH-3.1 §A.2): intro → 3-2-1-Go (calm: settle line) → round with HUD, FX
 * and pause → result. Saves every round; quitting saves an incomplete one.
 */
export function GameScreen({
  gameId,
  definition,
  source,
  kicker,
  onQuit,
  renderActions,
  onCompleted,
}: GameScreenProps) {
  const t = useT();
  const meta = gameMeta(gameId)!;
  const reduced = useReducedMotion();
  const accent = color.game[meta.accent];
  const name = t(`games.list.${meta.id}.name`);

  const [phase, setPhase] = useState<Phase>('intro');
  const [roundKey, setRoundKey] = useState(0);
  const [paused, setPaused] = useState<null | 'user' | 'left'>(null);
  const [resuming, setResuming] = useState(false);
  const [result, setResult] = useState<{ r: RoundResult; best: boolean } | null>(null);
  const [hud, setHud] = useState<HudState>({
    title: name,
    round: '',
    score: 0,
    combo: null,
    lives: null,
    hint: null,
    timer: null,
  });
  const [quiet, setQuiet] = useState(false);
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const fx = useRef<FxHandle>(null);
  const clock = useMemo(() => new GameClock(), [roundKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const timerRef = useRef<{ start: number; total: number } | null>(null);
  const startedAt = useRef(0);
  const finished = useRef(false);
  /** HUD points this round; null until the round scores. */
  const scored = useRef<number | null>(null);
  const seed = useMemo(() => Math.floor(Math.random() * 2 ** 31), [roundKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));

  // Frame loop: advances game time, refreshes the HUD timer ~10×/s.
  useEffect(() => {
    if (phase !== 'play') return undefined;
    let raf = 0;
    let lastHud = 0;
    const loop = () => {
      clock.tick();
      const now = Date.now();
      const tm = timerRef.current;
      if (tm && now - lastHud > HUD_TICK_MS) {
        lastHud = now;
        const left = Math.max(0, tm.total - (clock.now() - tm.start));
        setHud((h) => ({ ...h, timer: { leftMs: left, totalMs: tm.total } }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [clock, phase]);

  useEffect(() => () => clock.dispose(), [clock]);
  // Players are ready before the countdown's first tick.
  useEffect(() => preloadSounds(), []);

  const pause = useCallback(
    (why: 'user' | 'left') => {
      if (phase !== 'play' || finished.current) return;
      clock.pause();
      setPaused(why);
    },
    [clock, phase],
  );

  // Leaving the app pauses (§A.2.7).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') pause('left');
    });
    return () => sub.remove();
  }, [pause]);

  const quit = useCallback(() => {
    if (phase === 'play' && !finished.current) {
      try {
        saveResult({
          gameId,
          startedAt: startedAt.current,
          durationMs: Date.now() - startedAt.current,
          result: null,
          source,
          completed: false,
        });
      } catch {
        // Nothing to save.
      }
    }
    clock.dispose();
    onQuit();
  }, [clock, gameId, onQuit, phase, source]);

  // System Back = pause; Back on the sheet = Resume; on intro/result = close.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'play') {
        if (paused) resume();
        else pause('user');
      } else quit();
      return true;
    });
    return () => sub.remove();
  });

  const begin = () => {
    finished.current = false;
    scored.current = null;
    timerRef.current = null;
    setResult(null);
    setQuiet(false);
    setHud({ title: name, round: '', score: 0, combo: null, lives: null, hint: null, timer: null });
    setRoundKey((k) => k + 1);
    setPhase('start');
  };

  const startPlay = useCallback(() => {
    startedAt.current = Date.now();
    clock.start();
    setPhase('play');
  }, [clock]);

  useEffect(() => {
    if (phase !== 'start' || !meta.calm) return undefined;
    const id = setTimeout(startPlay, SETTLE_MS);
    return () => clearTimeout(id);
  }, [meta.calm, phase, startPlay]);

  const resume = () => {
    setPaused(null);
    if (meta.calm) clock.start();
    else setResuming(true);
  };

  const finish = useCallback(
    (round: RoundResult) => {
      if (finished.current) return;
      // The result shows the points the player watched add up on the HUD.
      const r = scored.current === null ? round : { ...round, score: scored.current };
      finished.current = true;
      clock.pause();
      haptics.success();
      if (meta.calm) playSound('chime');
      let best = false;
      try {
        best = saveResult({
          gameId,
          startedAt: startedAt.current,
          durationMs: Date.now() - startedAt.current,
          result: r,
          source,
          completed: true,
        }).isNewBest;
      } catch {
        // The result still shows without the database.
      }
      setResult({ r, best });
      setPhase('result');
      onCompleted?.(r);
    },
    [clock, gameId, meta.calm, onCompleted, source],
  );

  const api: GameApi = useMemo(
    () => ({
      clock,
      timer: (totalSec) => {
        const start = clock.now();
        const total = totalSec * 1000;
        timerRef.current = { start, total };
        setHud((h) => ({ ...h, timer: { leftMs: total, totalMs: total } }));
        return {
          left: () => Math.max(0, total - (clock.now() - start)),
          done: () => clock.now() - start >= total,
        };
      },
      wait: (ms) => clock.wait(ms),
      setRound: (round) => setHud((h) => ({ ...h, round })),
      hint: (text, tone = 'neutral') => setHud((h) => ({ ...h, hint: { text, tone } })),
      addScore: (n) => {
        scored.current = (scored.current ?? 0) + n;
        setHud((h) => ({ ...h, score: h.score + n }));
      },
      combo: (n) => setHud((h) => ({ ...h, combo: n })),
      lives: (n) => {
        let left = n;
        setHud((h) => ({ ...h, lives: { total: n, left } }));
        return {
          lose: () => {
            left = Math.max(0, left - 1);
            setHud((h) => ({ ...h, lives: { total: n, left } }));
            return left;
          },
        };
      },
      fx: {
        ring: (x, y, c, s) => fx.current?.ring(x, y, c, s),
        burst: (x, y, c, n) => fx.current?.burst(x, y, c, n),
        float: (x, y, text, c) => fx.current?.float(x, y, text, c),
        hit: (x, y, c, pts) => {
          fx.current?.ring(x, y, c);
          fx.current?.burst(x, y, c);
          if (pts) fx.current?.float(x, y, `+${pts}`);
          haptics.tap();
          playSound('good');
        },
        oops: () => {
          haptics.error();
          playSound('bad');
          if (reduced)
            flash.set(
              withSequence(withTiming(0.35, { duration: 80 }), withTiming(0, { duration: 220 })),
            );
          else
            shake.set(
              withSequence(
                withTiming(-SHAKE_PX, { duration: 45 }),
                withTiming(SHAKE_PX, { duration: 55 }),
                withTiming(-SHAKE_PX / 2, { duration: 55 }),
                withTiming(0, { duration: 65 }),
              ),
            );
        },
        toast: (text, c) => fx.current?.toast(text, c),
      },
      quiet: setQuiet,
      haptic: (k) =>
        k === 'bad'
          ? haptics.error()
          : k === 'go'
            ? haptics.success()
            : k === 'good'
              ? haptics.tap()
              : haptics.select(),
      sound: playSound,
      finish,
      board,
      reducedMotion: reduced,
    }),
    [board, clock, finish, flash, reduced, shake],
  );

  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== board.width || height !== board.height) setBoard({ width, height });
  };

  if (phase === 'result' && result) {
    return (
      <ResultScreen
        name={name}
        accent={accent}
        result={result.r}
        isNewBest={result.best}
        calm={meta.calm}
        actions={renderActions(result.r, begin, meta.calm)}
      />
    );
  }

  if (phase === 'intro') {
    return (
      <Screen
        testID="game.intro"
        variant="game"
        background={<GameBackground kind={definition.background} glow={accent} quiet={false} />}
        header={
          <View style={styles.introTop}>
            <PressableScale
              testID="game.close"
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={(size.touch - size.navChip) / 2}
              onPress={quit}
              style={styles.close}>
              <Icon name="close" size={size.icon.sm} color={color.text.primary} />
            </PressableScale>
            {kicker ? (
              <Text variant="bodyStrong" style={styles.flex} numberOfLines={2}>
                {kicker}
              </Text>
            ) : null}
          </View>
        }
        footer={
          <Button
            testID="game.start"
            label={t(meta.calm ? 'games.begin' : 'games.start')}
            onPress={begin}
          />
        }>
        <View style={styles.intro}>
          <View style={styles.badge}>
            <GameIcon color={accent} size={INTRO_ICON} />
          </View>
          <View style={styles.chips}>
            <CategoryChip group={meta.group} label={t(`games.groups.${meta.group}`)} />
            <View style={styles.lenChip}>
              <Text variant="caption">{t(`games.list.${meta.id}.length`)}</Text>
            </View>
          </View>
          <Text variant="titleLg" accessibilityRole="header">
            {name}
          </Text>
          <Text variant="body" tone="body">
            {t(`games.list.${meta.id}.how`)}
          </Text>
        </View>
      </Screen>
    );
  }

  const Round = definition.Round;
  return (
    <Screen
      testID="game.play"
      variant="game"
      background={<GameBackground kind={definition.background} glow={accent} quiet={quiet} />}
      header={<Hud state={hud} calm={meta.calm} onPause={() => pause('user')} />}
      footer={<HintLine hint={hud.hint} />}>
      <Animated.View style={[styles.board, shakeStyle]} onLayout={onBoardLayout}>
        {phase === 'play' && board.width > 0 ? (
          <Suspense fallback={null}>
            <Round key={roundKey} api={api} seed={seed} />
          </Suspense>
        ) : null}
        <FxLayer ref={fx} reduced={reduced} />
        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
      </Animated.View>
      {phase === 'start' && !meta.calm ? (
        <Countdown accent={accent} withGo onDone={startPlay} />
      ) : null}
      {phase === 'start' && meta.calm ? (
        <View style={styles.settle}>
          <Text variant="title" align="center">
            {definition.settle ?? t('games.settle')}
          </Text>
        </View>
      ) : null}
      {resuming ? (
        <Countdown
          accent={accent}
          withGo={false}
          onDone={() => {
            setResuming(false);
            clock.start();
          }}
        />
      ) : null}
      <Sheet
        visible={paused !== null}
        onClose={resume}
        testID="game.pauseSheet"
        title={t('games.pause.title')}
        body={t(
          meta.calm
            ? 'games.pause.calm'
            : paused === 'left'
              ? 'games.pause.left'
              : 'games.pause.body',
        )}
        actions={
          <>
            <Button testID="game.resume" label={t('games.pause.resume')} onPress={resume} />
            <Button
              variant="ghost"
              size="md"
              label={t('games.pause.restart')}
              onPress={() => {
                setPaused(null);
                clock.dispose();
                begin();
              }}
            />
            <Button
              testID="game.quit"
              variant="danger"
              size="md"
              label={t('games.pause.quit')}
              onPress={quit}
            />
          </>
        }
      />
    </Screen>
  );
}

const INTRO_ICON = 120;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  introTop: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm },
  close: {
    width: size.navChip,
    height: size.navChip,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { flex: 1, justifyContent: 'flex-end', gap: space.md, paddingBottom: space.lg },
  badge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: space.sm },
  lenChip: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: color.surface.glass,
  },
  board: { flex: 1, marginTop: space.lg },
  flash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.signal.danger,
  },
  settle: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
