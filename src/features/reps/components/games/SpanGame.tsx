import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NumberPad, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { useRepsStore } from '../../repsStore';
import { createRng } from '../../rng';
import { checkSpan, generateSpan } from '../../span';
import { useGameDelay } from '../../useGameDelay';
import type { GameProps } from '../gameTypes';

export const SPAN_SEQUENCES = 3;
const DIGIT_MS = 1000;
const FEEDBACK_MS = 1500;
const MIN_LENGTH = 3;

/** Starting length at each level (the R6 "Next time · starts at 6 digits" line). */
export function spanStartFor(level: number): number {
  return Math.min(3, Math.max(1, level)) + 3;
}

type Stage =
  { kind: 'watch'; shown: number } | { kind: 'type' } | { kind: 'feedback'; right: boolean };

/** GSpan1 / GSpan2: watch the digits (one a second), then type them back. Length adapts ±1. */
export function SpanGame({ level, seed, running, onWin, report, setProgress }: GameProps) {
  const t = useT();
  const bestSpan = useRepsStore((s) => s.bestSpan);
  const setBestSpan = useRepsStore((s) => s.setBestSpan);
  const [rng] = useState(() => createRng(seed));
  const [length, setLength] = useState(() => spanStartFor(level));
  const [round, setRound] = useState(() => generateSpan(rng, spanStartFor(level)));
  const [sequence, setSequence] = useState(0);
  const [stage, setStage] = useState<Stage>({ kind: 'watch', shown: 1 });
  const [input, setInput] = useState<readonly number[]>([]);
  const [right, setRight] = useState(0);
  const [longest, setLongest] = useState(0);

  useEffect(
    () => setProgress({ total: 2, done: stage.kind === 'watch' ? 0 : 1 }),
    [stage.kind, setProgress],
  );
  useEffect(() => {
    report({ line: t('reps.span.timeUp', { right, total: SPAN_SEQUENCES }) });
  }, [report, right, t]);

  const delay = stage.kind === 'watch' ? DIGIT_MS : stage.kind === 'feedback' ? FEEDBACK_MS : null;
  useGameDelay(
    running,
    delay,
    () => {
      if (stage.kind === 'watch') {
        setStage(
          stage.shown < round.digits.length
            ? { kind: 'watch', shown: stage.shown + 1 }
            : { kind: 'type' },
        );
        return;
      }
      if (stage.kind !== 'feedback') return;
      if (sequence + 1 >= SPAN_SEQUENCES) {
        onWin(t('reps.span.won', { right, total: SPAN_SEQUENCES, longest }));
        return;
      }
      const nextLength = stage.right ? length + 1 : Math.max(MIN_LENGTH, length - 1);
      setLength(nextLength);
      setRound(generateSpan(rng, nextLength));
      setSequence(sequence + 1);
      setInput([]);
      setStage({ kind: 'watch', shown: 1 });
    },
    `${sequence}-${stage.kind}-${stage.kind === 'watch' ? stage.shown : ''}`,
  );

  const submit = () => {
    const ok = checkSpan(round, input);
    if (ok) {
      haptics.success();
      setRight(right + 1);
      setLongest(Math.max(longest, round.digits.length));
      setBestSpan(round.digits.length);
    } else haptics.error();
    setStage({ kind: 'feedback', right: ok });
  };

  if (stage.kind === 'watch') {
    const current = round.digits[stage.shown - 1]!;
    return (
      <View style={styles.root}>
        <Text variant="title.l" accessibilityRole="header" style={styles.title}>
          {t('reps.span.watch')}
        </Text>
        <Text variant="body.xl.regular" tone="muted" style={styles.sub}>
          {t('reps.span.watchSub', { count: round.digits.length })}
        </Text>
        <View
          style={styles.tile}
          accessible
          accessibilityLabel={String(current)}
          accessibilityLiveRegion="assertive">
          <Text variant="display.hero" tone="ink">
            {current}
          </Text>
        </View>
        <View style={styles.dots}>
          {round.digits.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < stage.shown - 1 && styles.dotDone,
                i === stage.shown - 1 && styles.dotNow,
              ]}
            />
          ))}
        </View>
        {bestSpan > 0 ? (
          <Text variant="body" tone="muted" align="center" style={styles.foot}>
            {t('reps.span.best', { count: bestSpan })}
          </Text>
        ) : null}
      </View>
    );
  }

  const feedback = stage.kind === 'feedback' ? stage.right : null;
  return (
    <View style={styles.root}>
      <Text variant="title.l" accessibilityRole="header" style={styles.title}>
        {t('reps.span.type')}
      </Text>
      <View
        style={styles.slots}
        accessible
        accessibilityLabel={t('reps.span.slotsA11y', {
          typed: input.length,
          total: round.digits.length,
        })}>
        {round.digits.map((_, i) => (
          <View
            key={i}
            style={[
              styles.slot,
              input[i] !== undefined && styles.slotFilled,
              feedback === true && styles.slotRight,
              feedback === false && styles.slotWrong,
            ]}>
            <Text variant="display.tile" tone={input[i] !== undefined ? 'ink' : 'primary'}>
              {input[i] ?? ' '}
            </Text>
          </View>
        ))}
      </View>
      <Text
        variant="body.xl"
        tone={feedback ? 'success' : 'muted'}
        align="center"
        style={styles.feedback}
        accessibilityLiveRegion="polite">
        {feedback === true
          ? t('reps.span.right')
          : feedback === false
            ? t('reps.span.wrong', { digits: round.digits.join(' ') })
            : ' '}
      </Text>
      <NumberPad
        testID="span.pad"
        onDigit={(d) =>
          stage.kind === 'type' && input.length < round.digits.length && setInput([...input, d])
        }
        onBack={() => stage.kind === 'type' && setInput(input.slice(0, -1))}
        onSubmit={submit}
        submitEnabled={stage.kind === 'type' && input.length === round.digits.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: layout.onboarding.optionsX - space.sm },
  title: {
    marginTop: space.huge,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX + space.sm,
  },
  sub: {
    marginTop: space.lg,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX + space.sm,
  },
  tile: {
    alignSelf: 'center',
    width: size.watchTile,
    height: size.watchTile * 1.2,
    ...rounded(radius.l),
    backgroundColor: color.game.memory,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.huge,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm + 2, marginTop: space.xxl },
  dot: {
    width: size.spanDot,
    height: size.spanDot,
    ...pill(size.spanDot),
    backgroundColor: color.bg.raisedHigh,
  },
  dotDone: { backgroundColor: color.text.primary },
  dotNow: { backgroundColor: color.game.memory },
  foot: { marginTop: 'auto', paddingBottom: space.lg },
  slots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.xs + 1,
    marginTop: space.huge,
  },
  slot: {
    flex: 1,
    maxWidth: size.spanSlot.width,
    aspectRatio: size.spanSlot.width / size.spanSlot.height,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: size.selectedRing,
    borderColor: color.bg.surface,
  },
  slotFilled: { backgroundColor: color.game.memory, borderColor: color.game.memory },
  slotRight: { borderColor: color.feedback.rightBorder },
  slotWrong: { borderColor: color.feedback.wrongBorder },
  feedback: { marginVertical: space.xl },
});
