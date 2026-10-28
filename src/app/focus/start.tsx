import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTileRow, Chip, PressableScale, PrimaryButton, Text, Toggle } from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { focusAppCount, focusSelection } from '@/features/focus/focusApps';
import { defaultChip, nextSessionMinutes } from '@/features/focus/ladder';
import { DURATION_CHIPS, earnedMinutesFor, pointsFor } from '@/features/focus/machine';
import { longestLocked, useFocusStore } from '@/features/focus/store';
import { useAccessStore } from '@/features/rules/accessStore';
import { selectionTiles } from '@/features/rules/present';
import { useRulesStore } from '@/features/rules/store';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { blocking } from '@/services/blocking';
import { isFaceDownAvailable, watchFaceDown } from '@/services/sensors/faceDown';

const S = layout.state;

function startSession(minutes: number, lockedCount: number) {
  useFocusStore.getState().dispatch({ type: 'start', now: Date.now(), minutes, lockedCount });
  haptics.success();
  router.replace('/focus/run');
}
const SHOWN_TILES = 5;

/**
 * FFocusStart (formSheet over Home): duration chips (default = the ladder's next step), the
 * apps that lock, "Flip to start", what it earns. Blocking unavailable → E09 instead.
 */
export default function FocusStart() {
  const t = useT();
  const rules = useRulesStore((s) => s.rules);
  const own = useFocusStore((s) => s.selection);
  const setSelection = useFocusStore((s) => s.setSelection);
  const history = useFocusStore((s) => s.history);
  const access = useAccessStore((s) => s.status);
  const [minutes, setMinutes] = useState(() =>
    defaultChip(nextSessionMinutes(longestLocked(history)), DURATION_CHIPS),
  );
  const [isFlip, setIsFlip] = useState(false);
  const [hasSensor, setHasSensor] = useState(false);
  const [isWaitingForFlip, setIsWaitingForFlip] = useState(false);
  const selection = focusSelection(rules, own);
  const count = focusAppCount(selection);

  useEffect(() => {
    let alive = true;
    void isFaceDownAvailable().then((ok) => alive && setHasSensor(ok));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isWaitingForFlip) return;
    return watchFaceDown((isDown) => {
      if (isDown) startSession(minutes, count);
    });
  }, [isWaitingForFlip, minutes, count]);

  const handleStart = () => {
    if (access !== 'approved') {
      router.replace({ pathname: '/focus/cant-lock', params: { minutes: String(minutes) } });
      return;
    }
    if (isFlip && hasSensor) {
      setIsWaitingForFlip(true);
      return;
    }
    startSession(minutes, count);
  };

  const handleEditApps = async () => {
    const result = await blocking.pickApps(selection);
    if (result.ok) setSelection(result.value);
  };

  const tiles = selection ? selectionTiles({ id: 'focus', apps: selection }) : [];

  return (
    <>
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <Text variant="title.s" accessibilityRole="header">
          {t('focus.start.title')}
        </Text>
        <Text variant="label" tone="muted" style={styles.sub}>
          {t('focus.start.sub')}
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {DURATION_CHIPS.map((m) => (
            <Chip
              key={m}
              testID={`focus.start.duration.${m}`}
              label={t('focus.start.minutes', { count: m })}
              size="m"
              fill
              selected={minutes === m}
              onPress={() => setMinutes(m)}
            />
          ))}
        </View>
        <Text variant="meta" tone="muted" style={styles.section}>
          {t('focus.start.lockedDuring')}
        </Text>
        <View style={styles.apps}>
          <AppTileRow apps={tiles.slice(0, SHOWN_TILES)} max={SHOWN_TILES} size="l" />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('focus.start.editA11y', { count })}
            hitSlop={space.md}
            onPress={() => void handleEditApps()}>
            <Text variant="meta" tone="muted">
              {count > SHOWN_TILES
                ? t('focus.start.moreEdit', { count: count - SHOWN_TILES })
                : t('focus.start.edit')}
            </Text>
          </PressableScale>
        </View>
        <View style={[styles.row, styles.rowFirst]}>
          <View style={styles.flex}>
            <Text variant="body">{t('focus.start.flip')}</Text>
            <Text variant="caption" tone="muted">
              {hasSensor ? t('focus.start.flipSub') : t('focus.start.flipUnavailable')}
            </Text>
          </View>
          <Toggle
            testID="focus.start.flip"
            value={isFlip && hasSensor}
            onChange={setIsFlip}
            disabled={!hasSensor}
            accessibilityLabel={t('focus.start.flip')}
          />
        </View>
        <View style={styles.row}>
          <Text variant="body">{t('focus.start.youllEarn')}</Text>
          <Text variant="body.strong" tone="accent">
            {t('focus.start.earn', {
              minutes: earnedMinutesFor(minutes),
              points: pointsFor(minutes),
            })}
          </Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            testID="focus.start.cta"
            label={
              isWaitingForFlip ? t('focus.start.waitingForFlip') : t('focus.start.cta', { minutes })
            }
            {...(isWaitingForFlip ? {} : { icon: 'lock' as const })}
            disabled={isWaitingForFlip}
            compact
            onPress={handleStart}
          />
        </View>
      </SafeAreaView>
      <DevSkip label="DEV · Start now" onSkip={() => startSession(minutes, count)} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg.raised,
    paddingTop: S.sheetPadding,
    paddingHorizontal: S.sheetPadding,
  },
  sub: { marginTop: space.xxs },
  chips: { flexDirection: 'row', gap: space.sm, marginTop: space.lg + 2 },
  section: { marginTop: space.lg + 2 },
  apps: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  row: {
    minHeight: size.listRow + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: size.hairline,
    borderTopColor: color.border.hairline,
  },
  rowFirst: { marginTop: space.lg + 2 },
  flex: { flex: 1 },
  footer: {
    marginTop: 'auto',
    paddingBottom: layout.onboarding.footerBottom,
    marginHorizontal: layout.gutter - S.sheetPadding,
  },
});
