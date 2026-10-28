import { router } from 'expo-router';

import { PrimaryButton, Sheet, SheetList } from '@/design/components';
import { ALL_THREE_BONUS, BOSS_POINTS, POINTS, WORD_DAILY_CAP } from '@/features/challenges/rules';
import { useT } from '@/i18n';

/** "How points work" (FDrawReveal chip, Settings › Guides). */
export default function HowPointsWork() {
  const t = useT();
  return (
    <Sheet
      testID="challenges.points"
      size="large"
      title={t('challenges.points.title')}
      body={t('challenges.points.body', { cap: WORD_DAILY_CAP })}
      actions={
        <PrimaryButton
          label={t('common.ok')}
          variant="light"
          compact
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/challenges'))}
        />
      }>
      <SheetList
        rows={[
          { id: 'easy', label: t('challenges.difficulty.easy'), value: `+${POINTS.easy}` },
          { id: 'med', label: t('challenges.difficulty.med'), value: `+${POINTS.medium}` },
          { id: 'hard', label: t('challenges.difficulty.hard'), value: `+${POINTS.hard}` },
          {
            id: 'all',
            label: t('challenges.points.allThree'),
            value: `+${ALL_THREE_BONUS}`,
            valueTone: 'accent',
          },
          {
            id: 'boss',
            label: t('challenges.points.boss'),
            value: `+${BOSS_POINTS}`,
            valueTone: 'accent',
          },
          {
            id: 'cap',
            label: t('challenges.points.wordCap'),
            value: t('challenges.points.capValue', { cap: WORD_DAILY_CAP }),
          },
        ]}
      />
    </Sheet>
  );
}
