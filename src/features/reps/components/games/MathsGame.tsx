import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerBox, NumberPad, Text } from '@/design/components';
import { layout, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { REPS } from '../../catalog';
import { GAME_HEX } from '../../gameColors';
import { generateMathsChain, type MathsLevel, type MathsStep } from '../../maths';
import { createRng } from '../../rng';
import { useGameDelay } from '../../useGameDelay';
import { DelayBar } from '../DelayBar';
import type { GameProps } from '../gameTypes';

export const MATHS_CHAINS = 5;
const STEP_MS = 2500;
const FEEDBACK_MS = 2000;
const MAX_DIGITS = 4;

type Stage =
  | { kind: 'start' }
  | { kind: 'step'; i: number }
  | { kind: 'answer' }
  | { kind: 'feedback'; right: boolean };

/** Steps per chain at each level (also the R6 "Next time · 6-step chains" line). */
export function mathsStepsFor(level: number): number {
  return Math.min(3, Math.max(1, level)) + 2;
}

/** R2–R4: a start number, then one operation at a time, then type the result. */
export function MathsGame({ level, seed, running, onWin, report }: GameProps) {
  const t = useT();
  const [chains] = useState(() => {
    const rng = createRng(seed);
    return Array.from({ length: MATHS_CHAINS }, () => generateMathsChain(rng, level as MathsLevel));
  });
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>({ kind: 'start' });
  const [input, setInput] = useState('');
  const [right, setRight] = useState(0);
  const chain = chains[index]!;
  const perChain = Math.round(REPS.maths.points / MATHS_CHAINS);

  useEffect(() => {
    report({ line: t('reps.maths.timeUp', { right, total: MATHS_CHAINS }) });
  }, [report, right, t]);

  const advance = () => {
    if (stage.kind === 'start') setStage({ kind: 'step', i: 0 });
    else if (stage.kind === 'step') {
      setStage(
        stage.i + 1 < chain.steps.length ? { kind: 'step', i: stage.i + 1 } : { kind: 'answer' },
      );
    } else if (stage.kind === 'feedback') {
      if (index + 1 >= MATHS_CHAINS) {
        onWin(t('reps.maths.won', { right, total: MATHS_CHAINS }));
        return;
      }
      setIndex(index + 1);
      setInput('');
      setStage({ kind: 'start' });
    }
  };
  const delay =
    stage.kind === 'start' || stage.kind === 'step'
      ? STEP_MS
      : stage.kind === 'feedback'
        ? FEEDBACK_MS
        : null;
  useGameDelay(
    running,
    delay,
    advance,
    `${index}-${stage.kind}-${stage.kind === 'step' ? stage.i : ''}`,
  );

  const submit = () => {
    const ok = Number(input) === chain.answer;
    if (ok) {
      setRight(right + 1);
      haptics.success();
    } else haptics.error();
    setStage({ kind: 'feedback', right: ok });
  };

  if (stage.kind === 'answer' || stage.kind === 'feedback') {
    const state = stage.kind === 'answer' ? 'typing' : stage.right ? 'right' : 'wrong';
    return (
      <View style={styles.answer}>
        <Text variant="body.xl.regular" tone="muted" align="center">
          {t('reps.maths.ask')}
        </Text>
        <AnswerBox value={input} state={state} testID="maths.answer" />
        <Text
          variant="body.xl"
          tone={state === 'right' ? 'success' : 'muted'}
          align="center"
          style={styles.feedback}
          accessibilityLiveRegion="polite">
          {state === 'right'
            ? t('reps.maths.right', { points: perChain })
            : state === 'wrong'
              ? t('reps.maths.wrong', { answer: chain.answer, seconds: FEEDBACK_MS / 1000 })
              : ' '}
        </Text>
        <NumberPad
          testID="maths.pad"
          onDigit={(d) =>
            stage.kind === 'answer' && input.length < MAX_DIGITS && setInput(input + d)
          }
          onBack={() => stage.kind === 'answer' && setInput(input.slice(0, -1))}
          onSubmit={submit}
          submitEnabled={stage.kind === 'answer' && input.length > 0}
        />
      </View>
    );
  }

  const step: MathsStep | null = stage.kind === 'step' ? chain.steps[stage.i]! : null;
  return (
    <View style={styles.play}>
      <Text variant="body.xl.regular" tone="muted" align="center">
        {step
          ? t('reps.maths.position', {
              chain: index + 1,
              total: MATHS_CHAINS,
              step: (stage.kind === 'step' ? stage.i : 0) + 1,
            })
          : t('reps.maths.positionStart', { chain: index + 1, total: MATHS_CHAINS })}
      </Text>
      <Text variant="display.op" align="center" style={styles.op} accessibilityLiveRegion="polite">
        {step ? `${step.op} ${step.operand}` : chain.start}
      </Text>
      <Text variant="title.s" align="center">
        {step ? opWords(t, step) : t('reps.maths.startWords')}
      </Text>
      <View style={styles.bar}>
        <DelayBar
          key={`${index}-${stage.kind === 'step' ? stage.i : 's'}`}
          ms={STEP_MS}
          running={running}
          fill={GAME_HEX.number}
        />
        <Text variant="body.l" tone="muted" align="center" style={styles.next}>
          {t('reps.maths.next', { seconds: STEP_MS / 1000 })}
        </Text>
      </View>
    </View>
  );
}

function opWords(t: ReturnType<typeof useT>, step: MathsStep): string {
  if (step.op === '×' && step.operand === 2) return t('reps.maths.op.double');
  if (step.op === '×' && step.operand === 3) return t('reps.maths.op.triple');
  if (step.op === '÷' && step.operand === 2) return t('reps.maths.op.halve');
  const key = { '+': 'add', '−': 'subtract', '×': 'multiply', '÷': 'divide' }[step.op];
  return t(`reps.maths.op.${key}`, { n: step.operand });
}

const styles = StyleSheet.create({
  play: { flex: 1, paddingHorizontal: layout.onboarding.optionsX, paddingTop: space.huge },
  op: { marginTop: space.xxl },
  bar: { marginTop: space.huge + space.xxl, paddingHorizontal: space.sm },
  next: { marginTop: space.md },
  answer: {
    flex: 1,
    paddingHorizontal: layout.onboarding.optionsX,
    paddingTop: space.xxl,
    gap: space.lg,
  },
  feedback: { marginBottom: space.lg },
});
