import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import {
  evaluateTokens,
  type ExprToken,
  formatValue,
  hitsTarget,
  type TargetOp,
  tokenLabel,
  usedIndexes,
} from '../../expression';
import { createRng } from '../../rng';
import { generateTarget, solveTarget } from '../../target24';
import { useGameDelay } from '../../useGameDelay';
import type { GameProps } from '../gameTypes';

export const TARGET_PUZZLES = 3;
const SOLVED_MS = 900;
const KEYS: readonly ExprToken[] = [
  { kind: 'op', op: '+' },
  { kind: 'op', op: '−' },
  { kind: 'op', op: '×' },
  { kind: 'op', op: '÷' },
  { kind: 'paren', open: true },
  { kind: 'paren', open: false },
];

/** The target at each level (the R6 "Next time · Target 36" line). */
export function targetFor(level: number): number {
  return [24, 36, 48][Math.min(3, Math.max(1, level)) - 1]!;
}

/** GTarget2: three solvable puzzles; build an expression from the four numbers. */
export function TargetGame({ level, seed, running, onWin, report, setProgress }: GameProps) {
  const t = useT();
  const target = targetFor(level);
  const [puzzles] = useState(() => {
    const rng = createRng(seed);
    return Array.from({ length: TARGET_PUZZLES }, () => generateTarget(rng, target));
  });
  const [index, setIndex] = useState(0);
  const [tokens, setTokens] = useState<readonly ExprToken[]>([]);
  const { numbers } = puzzles[index]!;
  const used = usedIndexes(tokens);
  const solved = hitsTarget(tokens, numbers, target);
  const complete = used.length === numbers.length;
  const value = complete ? evaluateTokens(tokens, numbers) : null;

  useEffect(() => setProgress({ total: TARGET_PUZZLES, done: index }), [index, setProgress]);
  useEffect(() => {
    report({
      line: t('reps.target.timeUp', {
        solved: index,
        total: TARGET_PUZZLES,
        solution: solveTarget(numbers, target) ?? '',
      }),
    });
  }, [index, numbers, report, t, target]);

  // "Undo with the back gesture": Android back pops the last token instead of leaving.
  useEffect(() => {
    if (!running || tokens.length === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setTokens((ts) => ts.slice(0, -1));
      return true;
    });
    return () => sub.remove();
  }, [running, tokens.length]);

  useGameDelay(
    running,
    solved ? SOLVED_MS : null,
    () => {
      if (index + 1 >= TARGET_PUZZLES) {
        onWin(t('reps.target.won', { total: TARGET_PUZZLES, target }));
        return;
      }
      setIndex(index + 1);
      setTokens([]);
    },
    index,
  );

  const push = (tok: ExprToken) => {
    if (!running || solved) return;
    const next = [...tokens, tok];
    setTokens(next);
    if (hitsTarget(next, numbers, target)) haptics.success();
    else if (usedIndexes(next).length === numbers.length && evaluateTokens(next, numbers) !== null)
      haptics.error();
  };

  return (
    <View style={styles.root}>
      <Text variant="body.l" tone="muted" style={styles.label}>
        {t('reps.target.target')}
      </Text>
      <View
        style={styles.circle}
        accessible
        accessibilityLabel={t('reps.target.targetA11y', { target })}>
        <Text variant="display.xl" tone="ink">
          {target}
        </Text>
      </View>
      <Text variant="body.l" tone="muted" style={styles.label}>
        {t('reps.target.numbers')}
      </Text>
      <View style={styles.chips}>
        {numbers.map((n, i) => {
          const isUsed = used.includes(i);
          return (
            <PressableScale
              key={i}
              testID={`target.num.${i}`}
              accessibilityRole="button"
              accessibilityLabel={String(n)}
              accessibilityState={{ disabled: isUsed }}
              disabled={isUsed}
              onPress={() => push({ kind: 'num', index: i })}
              style={[styles.chip, isUsed ? styles.chipUsed : styles.chipFree]}>
              <Text variant="title.m" tone={isUsed ? 'faint' : 'ink'}>
                {n}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('reps.target.undoA11y')}
        accessibilityHint={t('reps.target.clearHint')}
        onPress={() => setTokens(tokens.slice(0, -1))}
        onLongPress={() => setTokens([])}
        style={[
          styles.field,
          solved && styles.fieldRight,
          complete && !solved && value !== null && styles.fieldWrong,
        ]}>
        <Text variant="title.s" numberOfLines={1} adjustsFontSizeToFit style={styles.expr}>
          {tokens.map((tok) => tokenLabel(tok, numbers)).join(' ')}
        </Text>
        <Text
          variant="title.s"
          tone={solved ? 'success' : complete && value !== null ? 'danger' : 'faint'}>
          {complete && value !== null
            ? `= ${formatValue(value)}`
            : t('reps.target.equals', { target })}
        </Text>
      </PressableScale>
      <View style={styles.keys}>
        {KEYS.map((k) => (
          <PressableScale
            key={tokenLabel(k, numbers)}
            accessibilityRole="button"
            accessibilityLabel={t(`reps.target.key.${keyName(k)}`)}
            onPress={() => push(k)}
            style={styles.key}>
            <Text variant="title.s">{tokenLabel(k, numbers)}</Text>
          </PressableScale>
        ))}
      </View>
      <Text variant="body" tone="muted" align="center" style={styles.foot}>
        {t('reps.target.foot', { index: index + 1, total: TARGET_PUZZLES })}
      </Text>
    </View>
  );
}

function keyName(k: ExprToken): string {
  if (k.kind === 'paren') return k.open ? 'open' : 'close';
  if (k.kind === 'num') return 'num';
  const names: Record<TargetOp, string> = {
    '+': 'plus',
    '−': 'minus',
    '×': 'times',
    '÷': 'divide',
  };
  return names[k.op];
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: layout.onboarding.optionsX - space.sm },
  label: {
    marginTop: space.lg,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX + space.sm,
  },
  circle: {
    alignSelf: 'center',
    width: size.targetCircle,
    height: size.targetCircle,
    ...pill(size.targetCircle),
    backgroundColor: color.game.number,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: space.sm,
  },
  chip: {
    flex: 1,
    maxWidth: size.numberChip,
    aspectRatio: 1,
    ...pill(size.numberChip),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipFree: { backgroundColor: color.text.primary },
  chipUsed: { backgroundColor: color.bg.raised },
  field: {
    marginTop: space.lg,
    height: size.answerBox * 0.7,
    ...pill(size.answerBox * 0.7),
    backgroundColor: color.bg.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    gap: space.md,
    borderWidth: size.selectedRing,
    borderColor: color.bg.surface,
  },
  fieldRight: { borderColor: color.feedback.rightBorder, backgroundColor: color.feedback.rightBg },
  fieldWrong: { borderColor: color.feedback.wrongBorder, backgroundColor: color.feedback.wrongBg },
  expr: { flex: 1 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  key: {
    flexBasis: '31%',
    flexGrow: 1,
    height: size.gameKeyTall,
    ...pill(size.gameKeyTall),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foot: { marginTop: 'auto', paddingBottom: space.lg },
});
