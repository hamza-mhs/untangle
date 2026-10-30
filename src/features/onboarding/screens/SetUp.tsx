import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Icon, PressableScale, Sheet, Text } from '@/design/components';
import { AccessibilitySettingsMock } from '@/design/illustrations';
import { color, glow, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { blocker } from '@/native';

import { OnboardingFrame } from '../components/OnboardingFrame';
import { askFor, usePermissionFlow } from '../permissionFlow';
import {
  ctaLabel,
  nextPermission,
  PERMISSIONS,
  rowStatus,
  shouldOfferRestrictedHelp,
  showSkip,
  type Permission,
  type RowStatus,
} from '../permissions';
import { hrefFor } from '../steps';

const EMOJI: Record<Permission, string> = { accessibility: '🛡️', usage: '📊', battery: '🔋' };

function PermissionRow({
  k,
  status,
  onPress,
}: {
  k: Permission;
  status: RowStatus;
  onPress: () => void;
}) {
  const t = useT();
  const granted = status === 'granted';
  return (
    <PressableScale
      testID={`onboarding.permissions.${k}`}
      accessibilityRole="button"
      accessibilityLabel={`${t(`onboarding.permissions.${k}.title`)}, ${t(`onboarding.permissions.${k}.body`)}`}
      accessibilityState={{ checked: granted }}
      accessibilityHint={granted ? undefined : t('onboarding.permissions.rowHint')}
      disabled={granted}
      onPress={onPress}
      style={styles.row}>
      <Text
        variant="heading"
        style={styles.emoji}
        accessibilityElementsHidden
        importantForAccessibility="no">
        {EMOJI[k]}
      </Text>
      <View style={styles.rowText}>
        <Text variant="bodyStrong">{t(`onboarding.permissions.${k}.title`)}</Text>
        <Text variant="caption" tone={status === 'notOnYet' ? 'warning' : 'secondary'}>
          {status === 'notOnYet'
            ? t('onboarding.permissions.notOnYet')
            : t(`onboarding.permissions.${k}.body`)}
        </Text>
      </View>
      <View style={[styles.tick, granted ? styles.tickOn : null]}>
        {granted ? <Icon name="check" size={size.icon.sm} color={color.text.onLight} /> : null}
      </View>
    </PressableScale>
  );
}

/** §2.16 Permissions: three rows, one CTA that walks them in order. */
export function PermissionsScreen() {
  const t = useT();
  const granted = usePermissionFlow((s) => s.granted);
  const progress = usePermissionFlow((s) => s.progress);
  const restrictedHelp = usePermissionFlow((s) => s.restrictedHelp);
  const [busy, setBusy] = useState(false);

  /** Asks for usage and battery in turn until the walk reaches Accessibility or the end. */
  const walkRest = useCallback(async () => {
    const flow = usePermissionFlow.getState();
    flow.setWalking(true);
    setBusy(true);
    try {
      for (;;) {
        const s = usePermissionFlow.getState();
        const next = nextPermission(s.granted, s.progress);
        if (next === null || next === 'accessibility') break;
        await askFor(next);
      }
    } finally {
      usePermissionFlow.getState().setWalking(false);
      setBusy(false);
    }
  }, []);

  // Live re-check each time the screen comes back (from settings or from the disclosure).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void usePermissionFlow
        .getState()
        .refresh()
        .then((g) => {
          const s = usePermissionFlow.getState();
          if (alive && s.walking && (g.accessibility || s.progress.accessibilitySkipped))
            void walkRest();
        });
      return () => {
        alive = false;
      };
    }, [walkRest]),
  );

  const start = async () => {
    const s = usePermissionFlow.getState();
    const g = await s.refresh();
    const next = nextPermission(g, s.progress);
    if (next === null) {
      router.push(hrefFor('pick-apps'));
      return;
    }
    if (next === 'accessibility') {
      s.setWalking(true);
      router.push(hrefFor('accessibility'));
      return;
    }
    await walkRest();
  };

  const askOne = async (k: Permission) => {
    if (k === 'accessibility') {
      usePermissionFlow.getState().setWalking(false);
      router.push(hrefFor('accessibility'));
      return;
    }
    setBusy(true);
    try {
      await askFor(k);
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    const s = usePermissionFlow.getState();
    s.setProgress({ ...s.progress, accessibilitySkipped: true });
    await walkRest();
  };

  const label = ctaLabel(granted, progress);
  return (
    <OnboardingFrame
      step="permissions"
      scroll
      glow={glow.permissions}
      title={t('onboarding.permissions.title')}
      body={t('onboarding.permissions.body')}
      cta={{
        label: t(`onboarding.permissions.cta.${label}`),
        onPress: () => void start(),
        variant: 'brand',
        loading: busy,
      }}
      {...(showSkip(granted, progress)
        ? {
            secondary: {
              label: t('onboarding.permissions.skip'),
              onPress: () => void skip(),
              testID: 'onboarding.permissions.skip',
            },
          }
        : {})}>
      <View style={styles.rows}>
        {PERMISSIONS.map((k) => (
          <PermissionRow
            key={k}
            k={k}
            status={rowStatus(k, granted, progress)}
            onPress={() => void askOne(k)}
          />
        ))}
        <Text variant="caption" tone="tertiary" style={styles.foot}>
          {t('onboarding.permissions.footnote')}
        </Text>
      </View>
      <Sheet
        testID="onboarding.permissions.restricted"
        visible={restrictedHelp}
        onClose={() => usePermissionFlow.getState().setRestrictedHelp(false)}
        title={t('onboarding.restricted.title')}
        body={t('onboarding.restricted.body')}
        actions={
          <>
            <Button
              label={t('onboarding.restricted.openAppInfo')}
              onPress={() => {
                usePermissionFlow.getState().setRestrictedHelp(false);
                void blocker.openAppDetailsSettings();
              }}
            />
            <Button
              variant="ghost"
              size="md"
              label={t('onboarding.restricted.tryAgain')}
              onPress={() => {
                usePermissionFlow.getState().setRestrictedHelp(false);
                void start();
              }}
            />
          </>
        }>
        <View style={styles.steps}>
          {(['one', 'two', 'three'] as const).map((n, i) => (
            <Text key={n} variant="body" tone="body">
              {`${i + 1}. ${t(`onboarding.restricted.steps.${n}`)}`}
            </Text>
          ))}
        </View>
      </Sheet>
    </OnboardingFrame>
  );
}

/**
 * §2.17 Accessibility disclosure (Play prominent disclosure): explicit choice only, no
 * dismissing by tapping outside. Agree opens the system settings.
 */
export function AccessibilityScreen() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const finish = (grantedNow: boolean) => {
    const s = usePermissionFlow.getState();
    if (!grantedNow) s.setWalking(false);
    router.back();
  };

  const agree = async () => {
    setBusy(true);
    const before = usePermissionFlow.getState().progress;
    const ok = await askFor('accessibility');
    if (shouldOfferRestrictedHelp(before, usePermissionFlow.getState().progress)) {
      usePermissionFlow.getState().setRestrictedHelp(true);
    }
    setBusy(false);
    finish(ok);
  };

  const notNow = () => {
    const s = usePermissionFlow.getState();
    const before = s.progress;
    const after = { ...before, accessibilityFailures: before.accessibilityFailures + 1 };
    s.setProgress(after);
    if (shouldOfferRestrictedHelp(before, after)) s.setRestrictedHelp(true);
    finish(false);
  };

  return (
    <OnboardingFrame
      step="accessibility"
      layout="story"
      glow={glow.accessibility}
      title={t('onboarding.accessibility.title')}
      body={t('onboarding.accessibility.body')}
      cta={{
        label: t('onboarding.accessibility.agree'),
        onPress: () => void agree(),
        variant: 'brand',
        loading: busy,
      }}
      secondary={{ label: t('onboarding.accessibility.notNow'), onPress: notNow }}>
      <View style={styles.mock}>
        <AccessibilitySettingsMock
          heading={t('onboarding.accessibility.mock.heading')}
          section={t('onboarding.accessibility.mock.section')}
          rows={[
            t('onboarding.accessibility.mock.row1'),
            t('onboarding.accessibility.mock.row2'),
            t('onboarding.accessibility.mock.row3'),
          ]}
          off={t('onboarding.accessibility.mock.off')}
        />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  rows: { gap: space.sm },
  row: {
    minHeight: size.listRow + space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface.option,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  emoji: { width: space['2xl'], textAlign: 'center', lineHeight: space['3xl'] },
  rowText: { flex: 1, gap: 2 },
  tick: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.surface.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: color.signal.success, borderColor: color.signal.success },
  foot: { marginTop: space.sm },
  steps: { gap: space.sm, marginTop: space.sm },
  mock: { flex: 1, opacity: 0.85 },
});
