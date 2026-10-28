import * as Application from 'expo-application';
import { reloadAppAsync } from 'expo';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ErrorBoundary,
  Icon,
  IconButton,
  ListGroup,
  ListRow,
  Text,
  Toggle,
} from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { restoreBackup } from '@/features/backup/backup';
import { exportBackup, pickBackup, saveAutoBackup } from '@/features/backup/files';
import { authenticate, lockSupport } from '@/features/lock/AppLockGate';
import { trialDaysLeft } from '@/features/paywall/trial';
import { useTrialStore } from '@/features/paywall/trialStore';
import { usePro } from '@/features/paywall/usePro';
import {
  type BlockingAccessStatus,
  fixBlockingAccess,
  refreshBlockingAccess,
} from '@/features/rules/accessStore';
import { useRulesStore } from '@/features/rules/store';
import { GUIDES } from '@/features/settings/guides';
import { useSettingsStore } from '@/features/settings/store';
import { useT } from '@/i18n';
import { LINKS } from '@/lib/links';
import { notifications, type NotificationStatus } from '@/services/notifications';

/**
 * FSettings. Privacy (no account, app lock, discreet notifications), Backup, Guides and Plan
 * from the render, plus the rows SPEC lists as missing: notifications, Screen Time access,
 * morning draw time, bedtime hours, restore, and About.
 */
export default function Settings() {
  const t = useT();
  const s = useSettingsStore();
  const pro = usePro();
  const trialStartedAt = useTrialStore((x) => x.startedAt);
  const trialStartDay = useTrialStore((x) => x.startDay);
  const bedtime = useRulesStore((x) => x.rules.find((r) => r.isDefault) ?? null);
  const [now] = useState(() => Date.now());
  const [notif, setNotif] = useState<NotificationStatus>('undetermined');
  const [access, setAccess] = useState<BlockingAccessStatus>('approved');
  const [isBusy, setIsBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void notifications.getStatus().then((v) => alive && setNotif(v));
      void refreshBlockingAccess().then((v) => alive && setAccess(v));
      return () => {
        alive = false;
      };
    }, []),
  );

  const chevron = <Icon name="chevronRight" size={size.icon.sm} color={color.text.muted} />;
  const value = (text: string) => (
    <View style={styles.value}>
      <Text variant="body" tone="muted">
        {text}
      </Text>
      {chevron}
    </View>
  );

  const toggleLock = async (on: boolean) => {
    if (!on) {
      if (await authenticate()) s.setAppLock(false);
      return;
    }
    const support = await lockSupport();
    if (support !== 'ok') {
      Alert.alert(t('settings.lock.unavailableTitle'), t(`settings.lock.${support}`));
      return;
    }
    if (await authenticate()) s.setAppLock(true);
  };

  const runExport = async () => {
    setIsBusy(true);
    try {
      await exportBackup(t('settings.backup.export'));
    } catch {
      Alert.alert(t('settings.backup.failedTitle'), t('settings.backup.failedBody'));
    } finally {
      setIsBusy(false);
    }
  };

  const runImport = async () => {
    const picked = await pickBackup();
    if (!picked.ok) {
      if (picked.reason === 'cancelled') return;
      Alert.alert(t('settings.backup.importTitle'), t(`settings.backup.${picked.reason}`));
      return;
    }
    const date = new Date(picked.backup.exportedAt).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    Alert.alert(t('settings.backup.replaceTitle'), t('settings.backup.replaceBody', { date }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.backup.replace'),
        style: 'destructive',
        onPress: () => {
          try {
            saveAutoBackup();
            restoreBackup(picked.backup);
          } catch {
            Alert.alert(t('settings.backup.failedTitle'), t('settings.backup.failedBody'));
            return;
          }
          Alert.alert(t('settings.backup.doneTitle'), t('settings.backup.doneBody'), [
            { text: t('common.continue'), onPress: () => void reloadAppAsync() },
          ]);
        },
      },
    ]);
  };

  const planTitle = pro.hasPurchased
    ? t('settings.plan.pro')
    : pro.trial === 'active' || pro.trial === 'ending'
      ? t('settings.plan.trial')
      : t('settings.plan.free');
  const planValue =
    !pro.hasPurchased && (pro.trial === 'active' || pro.trial === 'ending')
      ? t('settings.plan.daysLeft', {
          count: trialDaysLeft(
            {
              startedAt: trialStartedAt,
              startDay: trialStartDay ?? null,
              expiryPaywallSeen: false,
            },
            now,
          ),
        })
      : '';

  return (
    <ErrorBoundary name="settings">
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text variant="title.l" accessibilityRole="header">
            {t('settings.title')}
          </Text>
          <IconButton
            icon="close"
            accessibilityLabel={t('common.close')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <ListGroup header={t('settings.sections.privacy')}>
            <ListRow
              title={t('settings.privacy.noAccount')}
              subtitle={t('settings.privacy.noAccountSub')}
            />
            <ListRow
              title={t('settings.privacy.appLock')}
              trailing={
                <Toggle
                  testID="settings.appLock"
                  value={s.appLock}
                  onChange={(v) => void toggleLock(v)}
                  accessibilityLabel={t('settings.privacy.appLock')}
                />
              }
            />
            <ListRow
              title={t('settings.privacy.discreet')}
              subtitle={t('settings.privacy.discreetSub')}
              trailing={
                <Toggle
                  value={s.discreetNotifications}
                  onChange={s.setDiscreetNotifications}
                  accessibilityLabel={t('settings.privacy.discreet')}
                />
              }
            />
          </ListGroup>

          <ListGroup header={t('settings.sections.phone')}>
            <ListRow
              title={t('settings.notifications')}
              subtitle={
                notif === 'granted' ? t('settings.notificationsOn') : t('settings.notificationsOff')
              }
              {...(notif === 'granted'
                ? {}
                : { onPress: () => void notifications.openSettings(), trailing: chevron })}
            />
            <ListRow
              title={t('settings.access.title')}
              subtitle={access === 'approved' ? t('settings.access.on') : t('settings.access.off')}
              {...(access === 'approved'
                ? {}
                : {
                    onPress: () => void fixBlockingAccess().then(setAccess),
                    trailing: value(t('settings.access.fix')),
                  })}
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

          <ListGroup header={t('settings.sections.schedule')}>
            <ListRow
              title={t('settings.schedule.draw')}
              onPress={() => router.push('/settings/draw-time')}
              trailing={value(s.drawTime)}
            />
            {bedtime ? (
              <ListRow
                title={t('settings.schedule.bedtime')}
                onPress={() => router.push({ pathname: '/rule/[id]', params: { id: bedtime.id } })}
                trailing={value(`${bedtime.schedule.start}–${bedtime.schedule.end}`)}
              />
            ) : null}
          </ListGroup>

          <ListGroup header={t('settings.sections.backup')}>
            <ListRow
              title={t('settings.backup.export')}
              onPress={() => !isBusy && void runExport()}
              trailing={chevron}
            />
            <ListRow
              title={t('settings.backup.import')}
              onPress={() => void runImport()}
              trailing={chevron}
            />
          </ListGroup>

          <ListGroup header={t('settings.sections.guides')}>
            {GUIDES.map((g) => (
              <ListRow
                key={g}
                title={t(`settings.guides.${g}.title`)}
                onPress={() => router.push({ pathname: '/settings/guide/[id]', params: { id: g } })}
                trailing={chevron}
              />
            ))}
            <ListRow
              title={t('settings.guides.points')}
              onPress={() => router.push('/challenges/points')}
              trailing={chevron}
            />
          </ListGroup>

          <ListGroup header={t('settings.sections.plan')}>
            <ListRow
              title={planTitle}
              subtitle={t('settings.plan.sub')}
              onPress={() => router.push('/settings/billing')}
              trailing={value(planValue)}
            />
            <ListRow
              title={t('settings.plan.restore')}
              onPress={() => router.push('/settings/billing')}
              trailing={chevron}
            />
          </ListGroup>

          <ListGroup header={t('settings.sections.about')}>
            <ListRow
              title={t('settings.about.privacy')}
              onPress={() => void Linking.openURL(LINKS.privacy)}
              trailing={chevron}
            />
            <ListRow
              title={t('settings.about.terms')}
              onPress={() => void Linking.openURL(LINKS.terms)}
              trailing={chevron}
            />
            <ListRow
              title={t('settings.about.contact')}
              onPress={() => void Linking.openURL(LINKS.contact)}
              trailing={chevron}
            />
            <ListRow
              title={t('settings.about.version')}
              trailing={
                <Text variant="body" tone="muted">
                  {`${Application.nativeApplicationVersion ?? '—'} (${Application.nativeBuildVersion ?? '—'})`}
                </Text>
              }
            />
          </ListGroup>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screen.titleX,
    paddingTop: layout.screen.top,
  },
  content: { padding: layout.gutter, gap: space.xl, paddingBottom: space.huge },
  value: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
