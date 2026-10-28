import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton, Text } from '@/design/components';
import { color, layout, pill, radius, rounded } from '@/design/tokens';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { buildFirstRules } from '@/features/onboarding/logic/firstRules';
import { finishOnboarding } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useRulesStore } from '@/features/rules/store';
import { useT } from '@/i18n';

const STEP = stepOf('trial');
const T = layout.trial;

const MILESTONES = [
  { id: 'today', tone: 'green' },
  { id: 'day5', tone: 'accent' },
  { id: 'day7', tone: 'light' },
] as const;

/**
 * Onboarding 15 · the reverse trial, honestly. "Turn on my first lock" creates the bedtime
 * (+ mornings) rules with the OB08 strength and applies the shields; switching a rule on starts
 * the app-side 7-day trial (mirrored to the Keychain on iOS). Then Home.
 */
export default function Trial() {
  const t = useT();
  const [isSaving, setIsSaving] = useState(false);

  const handleStart = () => {
    setIsSaving(true);
    const { appSelection, blocking, strength, when } = useOnboardingStore.getState();
    // No-blocking mode (E01 "Continue without blocking"): nothing to lock yet; Home shows
    // the blockingOff banner and the trial starts with the first rule later.
    if (blocking === 'approved' && appSelection) {
      const rules = buildFirstRules({
        apps: appSelection,
        strength,
        when,
        names: {
          bedtime: t('onboarding.trial.bedtimeRule'),
          mornings: t('onboarding.trial.morningRule'),
        },
        now: Date.now(),
      });
      const { upsertRule } = useRulesStore.getState();
      for (const rule of rules) upsertRule(rule);
    }
    finishOnboarding();
  };

  return (
    <OnboardingScreen
      step={STEP}
      title={t('onboarding.trial.title')}
      subtitle={t('onboarding.trial.subtitle')}
      contentStyle={styles.content}
      footer={
        <PrimaryButton
          testID="trial.start"
          label={t('onboarding.trial.cta')}
          icon="arrowRight"
          loading={isSaving}
          onPress={handleStart}
        />
      }>
      <View style={styles.timeline}>
        {MILESTONES.map((m, i) => (
          <View key={m.id}>
            {i > 0 ? <View style={styles.connector} /> : null}
            <View style={styles.row} accessible>
              <View style={[styles.dot, dotTones[m.tone]]} />
              <View style={styles.rowText}>
                <Text variant="body.xl">{t(`onboarding.trial.${m.id}Title`)}</Text>
                <Text variant="body" tone="muted">
                  {t(`onboarding.trial.${m.id}Sub`)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card} accessible>
        <Text variant="meta" tone="muted" style={styles.cardLabel}>
          {t('onboarding.trial.freeLabel')}
        </Text>
        <Text variant="body.s" tone="secondary">
          {t('onboarding.trial.freeBody')}
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: T.top, paddingHorizontal: 0 },
  timeline: { paddingHorizontal: T.x },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: T.dotGap },
  rowText: { flex: 1 },
  dot: { width: T.dot, height: T.dot, ...pill(T.dot) },
  connector: {
    width: T.connectorWidth,
    height: T.connectorHeight,
    ...pill(T.connectorWidth),
    marginVertical: T.connectorGap,
    marginLeft: (T.dot - T.connectorWidth) / 2,
    backgroundColor: color.bg.raisedHigh,
  },
  card: {
    marginTop: T.cardTop,
    marginHorizontal: layout.onboarding.optionsX,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    paddingVertical: T.cardPaddingY,
    paddingHorizontal: T.cardPaddingX,
  },
  cardLabel: { marginBottom: T.cardLabelGap },
});

const dotTones = StyleSheet.create({
  green: { backgroundColor: color.mood.green },
  accent: { backgroundColor: color.accent.primary },
  light: { backgroundColor: color.light.surface },
});
