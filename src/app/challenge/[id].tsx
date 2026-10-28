import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GameShell, Icon, PrimaryButton, Text } from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { DevSkip } from '@/features/dev/DevSkip';
import { challengeById, type ChallengeDef } from '@/features/challenges/library';
import { challengeTitle, CHECK_OF } from '@/features/challenges/present';
import { POINTS } from '@/features/challenges/rules';
import { useChallengesStore } from '@/features/challenges/store';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/time';
import { getStepsForDay, requestStepsAccess } from '@/native/health';
import { blocking } from '@/services/blocking';

/**
 * A challenge (`challenge/[id]`). Silence, focus and reading hand off to their own flows; steps
 * and screen time are checked on-device; "your word" is a plain confirmation. Without Health
 * or usage data a verified card falls back to "your word" (EDGE_CASES › Verified).
 */
export default function ChallengeDetail() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const def = id ? challengeById(id) : undefined;
  const isLibrary = useChallengesStore((s) => !s.draw?.cards.includes(id ?? ''));
  const [check, setCheck] = useState<'idle' | 'checking' | 'short' | 'noData'>('idle');
  const [steps, setSteps] = useState(0);

  if (!def) return <Redirect href="/challenges" />;
  if (def.kind === 'silence')
    return <Redirect href={{ pathname: '/challenge/silence', params: { id: def.id } }} />;
  if (def.kind === 'reading')
    return <Redirect href={{ pathname: '/reading', params: { challenge: def.id } }} />;

  const finish = (verification?: ChallengeDef['verification']) => {
    const store = useChallengesStore.getState();
    const points = isLibrary
      ? store.completeLibrary(def.id)
      : store.complete(def.id, undefined, verification);
    router.replace({
      pathname: '/challenge/done',
      params: { id: def.id, points: String(points ?? 0) },
    });
  };

  const handleVerify = async () => {
    setCheck('checking');
    if (def.kind === 'steps') {
      const ok = await requestStepsAccess();
      if (!ok) {
        setCheck('noData');
        return;
      }
      const n = await getStepsForDay(new Date());
      setSteps(n);
      if (n >= (def.target ?? 0)) finish();
      else setCheck('short');
      return;
    }
    // Screen time: Android usage stats; iOS can't read them (report view only).
    const usage = await blocking.getUsageSummary(dayKey());
    if (!usage) {
      setCheck('noData');
      return;
    }
    if (usage.screenTimeMinutes <= (def.target ?? 0)) finish();
    else setCheck('short');
  };

  const isWordFallback = check === 'noData';
  const verification = isWordFallback ? 'word' : def.verification;
  const points = POINTS[def.difficulty];

  return (
    <>
      <GameShell
        title={t(`challenges.check.${CHECK_OF[verification]}Short`)}
        right={{
          kind: 'pill',
          label: t('challenges.detail.points', { points }),
          bg: color.accent.primary,
        }}
        closeKind="back"
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/challenges'))}
        footer={
          def.kind === 'focus' ? (
            <PrimaryButton
              testID="challenge.focus"
              label={t('challenges.detail.startFocus', { minutes: def.target ?? 25 })}
              icon="lock"
              onPress={() => router.replace('/focus/start')}
            />
          ) : def.kind === 'word' || isWordFallback ? (
            <PrimaryButton
              testID="challenge.didIt"
              label={t('challenges.detail.didIt')}
              icon="check"
              onPress={() => finish('word')}
            />
          ) : (
            <PrimaryButton
              testID="challenge.verify"
              label={t(
                def.kind === 'steps'
                  ? 'challenges.detail.checkSteps'
                  : 'challenges.detail.checkScreenTime',
              )}
              loading={check === 'checking'}
              onPress={() => void handleVerify()}
            />
          )
        }>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="title.m" accessibilityRole="header">
            {challengeTitle(def)}
          </Text>
          <Text variant="body.lead" tone="secondary" style={styles.body}>
            {t(`challenges.detail.why.${def.kind}`, { target: def.target ?? 0 })}
          </Text>
          <View style={styles.card}>
            <Icon name={def.icon} size={size.icon.lg} color={color.accent.primary} />
            <Text variant="label" tone="secondary" style={styles.flex}>
              {isWordFallback
                ? t('challenges.detail.noData')
                : check === 'short'
                  ? def.kind === 'steps'
                    ? t('challenges.detail.shortSteps', { steps, target: def.target ?? 0 })
                    : t('challenges.detail.shortScreenTime', { target: def.target ?? 0 })
                  : t(`challenges.detail.how.${def.kind}`, { target: def.target ?? 0 })}
            </Text>
          </View>
        </ScrollView>
      </GameShell>
      <DevSkip label="DEV · Complete" onSkip={() => finish()} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.onboarding.titleX,
    paddingTop: space.xl,
    paddingBottom: space.xl,
  },
  body: { marginTop: space.md },
  card: {
    marginTop: space.xxl,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    padding: space.lg + 2,
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
  },
  flex: { flex: 1 },
});
