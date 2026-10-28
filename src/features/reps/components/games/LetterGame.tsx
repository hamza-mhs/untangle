import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LetterKeyboard, type LetterState, Text } from '@/design/components';
import { color, layout, pill, rounded, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

import { pickCalmWord } from '../../calmWords';
import { createRng } from '../../rng';
import type { GameProps, LossInfo } from '../gameTypes';

export const LETTER_LIVES = 6;

/** GLetter2: six lives, a clue, the letter slots, a "Missed" row and the keyboard. */
export function LetterGame({ level, seed, running, onWin, onLose, report }: GameProps) {
  const t = useT();
  const [{ word, clue }] = useState(() => pickCalmWord(createRng(seed), level));
  const [guessed, setGuessed] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const letters = [...word];
  const missed = guessed.filter((g) => !word.includes(g));
  const lives = LETTER_LIVES - missed.length;
  const found = letters.filter((l) => guessed.includes(l)).length;

  useEffect(() => {
    report(lossInfo(t, 'reps.letter.timeUp', word, guessed));
  }, [guessed, report, t, word]);

  const guess = () => {
    if (!selected || !running) return;
    const next = [...guessed, selected];
    setGuessed(next);
    setSelected(null);
    if (word.includes(selected)) {
      haptics.select();
      if (letters.every((l) => next.includes(l))) {
        const misses = next.filter((g) => !word.includes(g)).length;
        onWin(t('reps.letter.won', { count: misses }));
      }
    } else {
      haptics.error();
      if (next.filter((g) => !word.includes(g)).length >= LETTER_LIVES) {
        onLose(lossInfo(t, 'reps.letter.outOfLives', word, next));
      }
    }
  };

  const states: Record<string, LetterState> = {};
  for (const g of guessed) states[g] = word.includes(g) ? 'hit' : 'miss';

  return (
    <View style={styles.root}>
      <View style={styles.livesHead}>
        <Text variant="body.l" tone="muted">
          {t('reps.letter.lives')}
        </Text>
        <Text variant="body.l" tone="muted">
          {t('reps.letter.livesCount', { lives, total: LETTER_LIVES })}
        </Text>
      </View>
      <View
        style={styles.lives}
        accessible
        accessibilityLabel={t('reps.letter.livesA11y', { lives, total: LETTER_LIVES })}>
        {Array.from({ length: LETTER_LIVES }, (_, i) => (
          <View key={i} style={[styles.life, i < lives && styles.lifeOn]} />
        ))}
      </View>
      <Text variant="body.xl.regular" tone="muted" style={styles.clue}>
        {t('reps.letter.clue', { clue })}
      </Text>
      <View
        style={styles.slots}
        accessible
        accessibilityLabel={t('reps.letter.slotsA11y', { found, total: letters.length })}>
        {letters.map((l, i) => (
          <View key={i} style={[styles.slot, guessed.includes(l) && styles.slotHit]}>
            <Text variant="display.tile" tone="ink">
              {guessed.includes(l) ? l : ' '}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="body.l" tone="muted" style={styles.missedLabel}>
        {t('reps.letter.missed')}
      </Text>
      <View style={styles.missed}>
        {missed.map((m) => (
          <View key={m} style={styles.missedChip}>
            <Text variant="title.s" tone="faint">
              {m}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.keyboard}>
        <LetterKeyboard
          testID="letter.keys"
          states={states}
          selected={selected}
          disabled={!running}
          onLetter={setSelected}
          onSubmit={guess}
          onClear={() => setSelected(null)}
        />
      </View>
    </View>
  );
}

function lossInfo(
  t: ReturnType<typeof useT>,
  key: string,
  word: string,
  guessed: readonly string[],
): LossInfo {
  const letters = [...word];
  const found = letters.filter((l) => guessed.includes(l)).length;
  return {
    line: t(key, { found, total: letters.length, word }),
    highlight: word,
    tiles: letters.map((l) => ({ label: l, hit: guessed.includes(l) })),
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: layout.onboarding.optionsX },
  livesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX,
  },
  lives: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, paddingHorizontal: space.sm },
  life: {
    width: size.lifeDot,
    height: size.lifeDot,
    ...pill(size.lifeDot),
    backgroundColor: color.bg.raisedHigh,
  },
  lifeOn: { backgroundColor: color.game.word },
  clue: { marginTop: space.xxl, paddingHorizontal: space.sm },
  slots: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  slot: {
    flex: 1,
    maxWidth: size.letterSlot.width,
    aspectRatio: size.letterSlot.width / size.letterSlot.height,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotHit: { backgroundColor: color.game.word },
  missedLabel: {
    marginTop: space.xxl,
    paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX,
  },
  missed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
    minHeight: size.missedChip,
  },
  missedChip: {
    width: size.missedChip,
    height: size.missedChip,
    ...pill(size.missedChip),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboard: { marginTop: 'auto', paddingBottom: space.lg },
});
