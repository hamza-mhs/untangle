import { StyleSheet, View } from 'react-native';

import { Ghost, PrimaryButton, Text } from '@/design/components';
import { color, layout, pill } from '@/design/tokens';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import {
  daysPerYear,
  formatGain,
  goodNews,
  hoursPerDay,
} from '@/features/onboarding/logic/yearMath';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useT } from '@/i18n';

const STEP = stepOf('good-news');
const G = layout.goodNews;

/** Onboarding 07 · the reframe: one hour less a day = 15 days a year back. */
export default function GoodNews() {
  const t = useT();
  const bucket = useOnboardingStore((s) => s.screenTime);
  const news = goodNews(daysPerYear(hoursPerDay(bucket)));
  const gain = formatGain(news.gain);

  return (
    <OnboardingScreen
      step={STEP}
      contentStyle={styles.content}
      footer={
        <PrimaryButton
          testID="goodNews.continue"
          label={t('onboarding.goodNews.cta')}
          icon="arrowRight"
          onPress={() => goNext(STEP)}
        />
      }>
      <View style={styles.ghost}>
        <Ghost mood={0.5} width={G.ghostWidth} />
      </View>
      <Text variant="title.l" accessibilityRole="header" style={styles.title}>
        {t('onboarding.goodNews.title')}
      </Text>
      <Text testID="goodNews.body" variant="body.xl" style={styles.body}>
        {t('onboarding.goodNews.bodyLead', {
          change: t(
            news.goal === 'hour'
              ? 'onboarding.goodNews.changeHour'
              : 'onboarding.goodNews.changeHalfHour',
          ),
        })}
        <Text variant="body.xl" tone="green">
          {t('onboarding.goodNews.bodyGain', { gain })}
        </Text>
        {t('onboarding.goodNews.bodyTail')}
      </Text>
      <View style={styles.bars}>
        <Bar
          testID="goodNews.now"
          label={t('onboarding.goodNews.now')}
          value={t('onboarding.goodNews.daysValue', { value: news.now })}
          ratio={1}
          tone="pink"
        />
        <Bar
          testID="goodNews.withUs"
          label={t('onboarding.goodNews.withUs')}
          value={t('onboarding.goodNews.daysValue', { value: news.withUs })}
          ratio={news.ratio}
          tone="green"
        />
      </View>
      <Text variant="meta" tone="muted" style={styles.note}>
        {t('onboarding.goodNews.note')}
      </Text>
    </OnboardingScreen>
  );
}

function Bar({
  label,
  value,
  ratio,
  tone,
  testID,
}: {
  label: string;
  value: string;
  ratio: number;
  tone: 'pink' | 'green';
  testID: string;
}) {
  return (
    <View testID={testID} style={styles.track} accessible accessibilityLabel={`${label}, ${value}`}>
      <View style={[styles.fill, fillTones[tone], { width: `${ratio * 100}%` }]} />
      <View style={styles.barText}>
        <Text variant="body.l.strong" tone="onAccent">
          {label}
        </Text>
        <Text variant="body.l.strong">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: G.ghostTop, paddingHorizontal: 0 },
  ghost: { alignItems: 'center' },
  title: { marginTop: G.titleTop, paddingHorizontal: layout.onboarding.titleX },
  body: { marginTop: G.bodyTop, paddingHorizontal: layout.onboarding.subtitleX },
  bars: { marginTop: G.barsTop, gap: G.barGap, paddingHorizontal: layout.onboarding.optionsX },
  track: {
    height: G.barHeight,
    ...pill(G.barHeight),
    backgroundColor: color.bg.surface,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, ...pill(G.barHeight) },
  barText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: G.barPaddingX,
  },
  note: { marginTop: G.noteTop, paddingHorizontal: layout.onboarding.subtitleX },
});

const fillTones = StyleSheet.create({
  pink: { backgroundColor: color.mood.pink },
  green: { backgroundColor: color.mood.green },
});
