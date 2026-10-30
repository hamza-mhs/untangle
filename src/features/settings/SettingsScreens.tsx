import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Header,
  ListGroup,
  ListRow,
  RadioDot,
  PressableScale,
  Screen,
  Sheet,
  Stepper,
  Text,
  Toggle,
} from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { blocker } from '@/native';
import { useEntitlementStore } from '@/services/purchases';

import { deleteMyData } from './reset';
import { GOAL_MAX, GOAL_MIN, UNLOCK_CHOICES, useSettingsStore, type Strictness } from './store';

const DEV_TAPS = 7;
const STRICTNESS: Strictness[] = ['gentle', 'firm', 'locked'];

/** Permission status, refreshed when the screen comes back into focus. */
function usePermissions() {
  const [p, setP] = useState({ accessibility: true, usage: true, battery: true, loaded: false });
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void Promise.all([
        blocker.isAccessibilityEnabled(),
        blocker.hasUsageAccess(),
        blocker.isIgnoringBatteryOptimizations(),
      ]).then(([accessibility, usage, battery]) => {
        if (alive) setP({ accessibility, usage, battery, loaded: true });
      });
      return () => {
        alive = false;
      };
    }, []),
  );
  return p;
}

export type SettingsDeps = {
  /** Streak and detours this week (from Home), passed in to avoid a feature cycle. */
  streak: number;
  detoursWeek: number;
  /** Resets every feature store after Delete my data. */
  resetStores: () => void;
};

function OptionSheet<T extends string | number>({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onPick: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.options}>
        {options.map((o) => (
          <PressableScale
            key={String(o.value)}
            testID={`settings.option.${o.value}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
            accessibilityLabel={o.sub ? `${o.label}, ${o.sub}` : o.label}
            onPress={() => onPick(o.value)}
            style={styles.option}>
            <RadioDot selected={value === o.value} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{o.label}</Text>
              {o.sub ? (
                <Text variant="caption" tone="secondary">
                  {o.sub}
                </Text>
              ) : null}
            </View>
          </PressableScale>
        ))}
      </View>
    </Sheet>
  );
}

/** Settings (20-phase2-core-app §9). */
export function SettingsScreen({ streak, detoursWeek, resetStores }: SettingsDeps) {
  const t = useT();
  const s = useSettingsStore();
  const ent = useEntitlementStore((x) => x.entitlement);
  const perms = usePermissions();
  const [sheet, setSheet] = useState<'strictness' | 'unlock' | 'delete' | null>(null);
  const taps = useRef(0);
  const [now] = useState(() => Date.now());
  const needs = [perms.accessibility, perms.usage, perms.battery].filter((x) => !x).length;
  const version = `${Constants.expoConfig?.version ?? '1.0.0'} (${Constants.expoConfig?.android?.versionCode ?? 1})`;

  const plan = ent.isActive ? (ent.isTrial ? 'trial' : 'pro') : 'free';
  const daysLeft = ent.expiresAt ? Math.max(0, Math.ceil((ent.expiresAt - now) / 86_400_000)) : 0;

  return (
    <Screen
      testID="settings"
      gutter="tab"
      scroll
      header={<Header title={t('settings.title')} onBack={() => router.back()} />}>
      <View style={styles.body}>
        <Text variant="body" tone="secondary" testID="settings.summary">
          {t('settings.summary', { streak, detours: detoursWeek })}
        </Text>

        <Card
          testID={`settings.plan.${plan}`}
          onPress={() => router.push(plan === 'free' ? '/paywall' : '/settings/subscription')}>
          <View style={styles.planHead}>
            <Text variant="heading" style={styles.flex}>
              {t(`settings.plan.${plan}.title`, {
                plan: t(`paywall.plans.${ent.plan === 'monthly' ? 'monthly' : 'yearly'}.name`),
              })}
            </Text>
            {plan === 'trial' ? (
              <View style={styles.daysPill}>
                <Text variant="caption" tone="warning">
                  {t('settings.plan.daysLeft', { count: daysLeft })}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="body" tone="secondary">
            {plan === 'pro' && ent.expiresAt
              ? t(ent.willRenew ? 'settings.plan.pro.renews' : 'settings.plan.pro.ends', {
                  date: formatLongDate(ent.expiresAt),
                })
              : t(`settings.plan.${plan}.body`)}
          </Text>
          {plan !== 'pro' ? (
            <View style={styles.planCta}>
              <Button
                size="md"
                label={t(`settings.plan.${plan}.cta`)}
                onPress={() => router.push('/paywall')}
              />
            </View>
          ) : null}
        </Card>

        {perms.loaded && !perms.accessibility ? (
          <Banner
            tone="danger"
            title={t('home.banner.off')}
            body={t('settings.warn.offBody')}
            actionLabel={t('home.banner.fix')}
            onPress={() => void blocker.openAccessibilitySettings()}
          />
        ) : null}
        {perms.loaded && !perms.battery ? (
          <Banner
            title={t('home.banner.battery')}
            body={t('settings.warn.batteryBody')}
            actionLabel={t('home.banner.fix')}
            onPress={() => void blocker.openBatteryOptimizationSettings()}
          />
        ) : null}

        <ListGroup label={t('settings.blocking')}>
          <ListRow
            testID="settings.strictness"
            icon="shield"
            title={t('settings.strictness')}
            value={t(`locks.strictness.${s.defaultStrictness}`)}
            onPress={() => setSheet('strictness')}
          />
          <ListRow
            testID="settings.unlock"
            icon="key"
            title={t('settings.unlock')}
            subtitle={t('settings.unlockSub')}
            value={t('settings.minutes', { count: s.unlockMinutes })}
            onPress={() => setSheet('unlock')}
          />
          <ListRow
            testID="settings.permissions"
            icon="check"
            title={t('settings.permissions')}
            subtitle={needs ? t('settings.needs', { count: needs }) : t('settings.allSet')}
            onPress={() => router.push('/settings/permissions')}
          />
        </ListGroup>

        <ListGroup label={t('settings.games')}>
          <ListRow
            title={t('settings.goal')}
            subtitle={t('settings.goalSub')}
            trailing={
              <Stepper
                testID="settings.goal"
                value={s.dailyGoal}
                min={GOAL_MIN}
                max={GOAL_MAX}
                onChange={s.setDailyGoal}
                accessibilityLabel={t('settings.goal')}
              />
            }
          />
          <ListRow
            title={t('settings.sound')}
            trailing={
              <Toggle
                value={s.soundEnabled}
                onChange={s.setSoundEnabled}
                accessibilityLabel={t('settings.sound')}
              />
            }
          />
          <ListRow
            title={t('settings.haptics')}
            trailing={
              <Toggle
                value={s.hapticsEnabled}
                onChange={s.setHapticsEnabled}
                accessibilityLabel={t('settings.haptics')}
              />
            }
          />
        </ListGroup>

        <ListGroup label={t('settings.privacy')}>
          <ListRow
            testID="settings.sees"
            icon="eye"
            title={t('settings.sees')}
            onPress={() => router.push('/settings/privacy')}
          />
          <ListRow
            testID="settings.delete"
            icon="trash"
            danger
            title={t('settings.delete')}
            onPress={() => setSheet('delete')}
          />
        </ListGroup>

        <ListGroup label={t('settings.about')}>
          <ListRow
            title={t('paywall.terms')}
            onPress={() => void Linking.openURL('https://untangle.app/terms')}
          />
          <ListRow
            title={t('settings.privacyPolicy')}
            onPress={() => void Linking.openURL('https://untangle.app/privacy')}
          />
          <ListRow
            testID="settings.version"
            title={t('settings.version')}
            value={version}
            onPress={() => {
              taps.current += 1;
              if (taps.current >= DEV_TAPS && __DEV__) {
                taps.current = 0;
                router.push('/dev');
              }
            }}
          />
        </ListGroup>
      </View>

      <OptionSheet
        visible={sheet === 'strictness'}
        title={t('settings.strictness')}
        value={s.defaultStrictness}
        options={STRICTNESS.map((v) => ({
          value: v,
          label: t(`locks.strictness.${v}`),
          sub: t(`locks.strictness.${v}Sub`),
        }))}
        onPick={(v) => {
          s.setDefaultStrictness(v);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'unlock'}
        title={t('settings.unlock')}
        value={s.unlockMinutes}
        options={UNLOCK_CHOICES.map((m) => ({
          value: m,
          label: t('settings.minutes', { count: m }),
        }))}
        onPick={(m) => {
          s.setUnlockMinutes(m);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <Sheet
        visible={sheet === 'delete'}
        onClose={() => setSheet(null)}
        testID="settings.deleteSheet"
        title={t('settings.deleteTitle')}
        body={t('settings.deleteBody')}
        actions={
          <>
            <Button
              testID="settings.deleteConfirm"
              variant="danger"
              label={t('settings.deleteConfirm')}
              onPress={() => {
                setSheet(null);
                void deleteMyData(resetStores).then(() => router.replace('/'));
              }}
            />
            <Button variant="secondary" label={t('common.cancel')} onPress={() => setSheet(null)} />
          </>
        }
      />
    </Screen>
  );
}

/** Settings › Permissions (`122:8193`; notifications row removed). */
export function PermissionsScreen() {
  const t = useT();
  const p = usePermissions();
  const [oem, setOem] = useState<boolean | null>(null);
  const row = (
    k: 'accessibility' | 'usage' | 'battery',
    on: boolean,
    open: () => Promise<unknown>,
  ) => (
    <ListRow
      key={k}
      testID={`settings.perm.${k}`}
      title={t(`onboarding.permissions.${k}.title`)}
      subtitle={t(`onboarding.permissions.${k}.body`)}
      value={on ? t('settings.on') : t('settings.turnOn')}
      {...(on ? {} : { onPress: () => void open() })}
    />
  );
  return (
    <Screen
      testID="settings.permissionsScreen"
      gutter="tab"
      scroll
      header={<Header title={t('settings.permissions')} onBack={() => router.back()} />}>
      <View style={styles.body}>
        <ListGroup>
          {row('accessibility', p.accessibility, () => blocker.openAccessibilitySettings())}
          {row('usage', p.usage, () => blocker.openUsageAccessSettings())}
          {row('battery', p.battery, () => blocker.openBatteryOptimizationSettings())}
        </ListGroup>
        <ListGroup label={t('settings.oem')}>
          <ListRow
            testID="settings.oem"
            title={t('settings.oemRow')}
            subtitle={oem === false ? t('settings.oemSteps') : t('settings.oemSub')}
            onPress={() => void blocker.openOemAutostartSettings().then(setOem)}
          />
        </ListGroup>
        <Text variant="caption" tone="tertiary">
          {t('onboarding.permissions.footnote')}
        </Text>
      </View>
    </Screen>
  );
}

/** What Untangle sees (`122:8447`): the disclosure stays reachable here (Play policy). */
export function PrivacyScreen() {
  const t = useT();
  return (
    <Screen
      testID="settings.privacyScreen"
      gutter="tab"
      scroll
      header={<Header title={t('settings.sees')} onBack={() => router.back()} />}>
      <View style={styles.body}>
        {(['sees', 'never', 'stays'] as const).map((k) => (
          <Card key={k}>
            <Text variant="bodyStrong">{t(`settings.privacyPage.${k}.title`)}</Text>
            <Text variant="body" tone="secondary">
              {t(`settings.privacyPage.${k}.body`)}
            </Text>
          </Card>
        ))}
        <Button
          variant="secondary"
          label={t('settings.privacyPage.manage')}
          onPress={() => void blocker.openAccessibilitySettings()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: space.xl, marginTop: space.lg, paddingBottom: space['3xl'] },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  daysPill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    backgroundColor: color.signal.warningSoft,
  },
  planCta: { marginTop: space.md },
  options: { gap: space.sm, marginTop: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    minHeight: size.touch,
    borderRadius: radius.lg,
    backgroundColor: color.surface.control,
  },
});
