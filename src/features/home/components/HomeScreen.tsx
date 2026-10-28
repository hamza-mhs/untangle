import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Banner,
  BlockedAppsCard,
  ChallengeList,
  ClarityScore,
  FocusCard,
  Ghost,
  PrimaryButton,
  PressableScale,
  StarField,
  StatsGrid,
  Text,
} from '@/design/components';
import { color, layout, size } from '@/design/tokens';
import { SCENE_WIDTH, stars } from '@/features/onboarding/components/splash/sceneData';
import { useNotificationsOffSheet } from '@/features/onboarding/hooks/useNotificationsOffSheet';
import { usePaywallStore } from '@/features/paywall/paywallStore';
import { usePricingMoments } from '@/features/paywall/usePricingMoments';
import { fixBlockingAccess } from '@/features/rules/accessStore';
import { useFocusStore } from '@/features/focus/store';
import { useT } from '@/i18n';
import { purchases } from '@/services/purchases';

import type { HomeModel } from '../homeModel';
import { useHomeModel } from '../useHomeModel';
import { HomeTopBar } from './HomeTopBar';
import { TrialCard } from './TrialCard';

const H = layout.home;
const STARS_OPACITY = 0.5;

/**
 * Today (SPEC §5 Home). Fixed order: top bar, optional banner, Ghost, Clarity, one action,
 * challenges, blocked apps, stats. The whole screen scrolls; the tab bar is pinned.
 */
export function HomeScreen() {
  const { width, height } = useWindowDimensions();
  // `now` per focus: render stays pure, and coming back to Home refreshes the day-level state.
  const [now, setNow] = useState(() => Date.now());
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      setIsFocused(true);
      // A session that ended while the app was closed: show Focus done on the next open.
      if (useFocusStore.getState().session.status === 'done') router.push('/focus/done');
      return () => setIsFocused(false);
    }, []),
  );
  const model = useHomeModel(now);
  useNotificationsOffSheet();
  usePricingMoments(model.banner === null);

  const ghostWidth = height < size.compactHeight ? size.ghost.homeCompact : size.ghost.home;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.stars} pointerEvents="none">
        <StarField
          stars={stars}
          tileWidth={SCENE_WIDTH}
          height={layout.splash.starsHeight}
          width={width}
          opacity={STARS_OPACITY}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="home.scroll">
        <PressableScale
          accessible={false}
          onLongPress={__DEV__ ? () => router.push('/dev/menu') : undefined}>
          <HomeTopBar dateLabel={model.dateLabel} streak={model.streak} />
        </PressableScale>
        {model.banner ? (
          <View style={styles.banner}>
            <Banner
              testID={`home.banner.${model.banner.kind}`}
              kind={model.banner.kind}
              title={model.banner.title}
              sub={model.banner.sub}
              actionLabel={model.banner.actionLabel}
              onAction={() =>
                model.banner?.kind === 'grace'
                  ? void purchases.openManageSubscriptions()
                  : void fixBlockingAccess()
              }
            />
          </View>
        ) : null}
        <View style={styles.ghost}>
          <Ghost
            mood={model.ghost.mood}
            width={ghostWidth}
            animated={model.ghost.isAnimated && isFocused}
          />
        </View>
        <ClarityScore
          value={model.clarity}
          isFrozen={model.isClarityFrozen}
          testID="home.clarity"
        />
        {model.trialCard ? (
          <View style={styles.action}>
            <TrialCard
              {...model.trialCard}
              onWhatsInPro={() => router.push('/paywall?from=settings')}
              onDismiss={() => usePaywallStore.getState().markSeen('trialCard')}
            />
          </View>
        ) : null}
        <View style={model.trialCard ? styles.actionAfterCard : styles.action}>
          <HomeAction action={model.action} />
        </View>
        <View style={styles.section}>
          <ChallengeList
            testID="home.challenges"
            items={model.challenges.items}
            doneCount={model.challenges.doneCount}
            onStart={(id) => router.push({ pathname: '/challenge/[id]', params: { id } })}
          />
        </View>
        <View style={styles.section}>
          <BlockedAppsCard
            testID="home.blocked"
            mode={model.blocked.mode}
            title={model.blocked.title}
            subtitle={model.blocked.subtitle}
            apps={model.blocked.apps}
            onPress={() => router.push('/block')}
          />
        </View>
        <View style={styles.section}>
          {model.stats.mode === 'baseline' ? (
            <StatsGrid mode="baseline" day={model.stats.day} testID="home.stats" />
          ) : (
            <StatsGrid mode="normal" cards={model.stats.cards} testID="home.stats" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeAction({ action }: { action: HomeModel['action'] }) {
  const t = useT();
  switch (action.kind) {
    case 'startFocus':
      return (
        <PrimaryButton
          testID="home.startFocus"
          label={t('home.action.startFocus')}
          icon="lock"
          onPress={() => router.push('/focus/start')}
        />
      );
    case 'lightsOut':
      return (
        <PrimaryButton
          testID="home.lightsOut"
          label={t('home.action.lightsOut')}
          onPress={() => router.push('/lights-out')}
        />
      );
    case 'focus':
      return (
        <View>
          <FocusCard
            testID="home.focusCard"
            startedAt={action.startedAt}
            endsAt={action.endsAt}
            endsAtLabel={action.endsAtLabel}
            onEnd={() => useFocusStore.getState().dispatch({ type: 'tick', now: Date.now() })}
          />
          <View style={styles.passLine}>
            <Text variant="meta" tone="muted">
              {t('home.focus.cantTurnOff')}
            </Text>
            <PressableScale
              accessibilityRole="link"
              accessibilityLabel={t('home.focus.passLink', { count: action.passesLeft })}
              hitSlop={size.hitTarget / 4}
              onPress={() =>
                router.push(action.passesLeft > 0 ? '/focus/emergency' : '/focus/no-passes')
              }>
              <Text variant="meta" style={styles.underline}>
                {t('home.focus.passLink', { count: action.passesLeft })}
              </Text>
            </PressableScale>
          </View>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  stars: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: H.x, paddingTop: H.topBarTop, paddingBottom: H.section },
  banner: { marginTop: H.sectionLabelGap * 2 },
  ghost: { alignItems: 'center', marginTop: H.ghostTop },
  action: { marginTop: H.actionTop },
  actionAfterCard: { marginTop: H.statGap * 2 },
  section: { marginTop: H.section + H.sectionLabelGap },
  passLine: {
    marginTop: H.sectionLabelGap + 2,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  underline: { textDecorationLine: 'underline' },
});
