import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, Icon, PressableScale, Screen, Text } from '@/design/components';
import { color, layout, radius, size, space } from '@/design/tokens';
import { FocusCard, FocusStartSheet } from '@/features/focus';
import { usePro } from '@/features/paywall';
import { useT } from '@/i18n';

import { lockStatus, pausedByPlan } from '../allowance';
import { LockRow } from '../components/LockParts';
import { useInstalledApps, useTodayCounters } from '../hooks';
import { FREE_LOCK_LIMIT, useLocksStore } from '../locksStore';
import { targetKey, type Lock } from '../types';
import { useLockChange } from './useLockChange';

const HIGHLIGHT_MS = 1500;

/** Free tier: the 4th lock opens the paywall (§6.1). */
export function openNewLock(isPro: boolean, count: number) {
  if (!isPro && count >= FREE_LOCK_LIMIT) router.push('/paywall');
  else router.push('/lock/new');
}

/** Block tab (20-phase2-core-app §6.6). */
export function BlockTab() {
  const t = useT();
  const { isPro } = usePro();
  const locks = useLocksStore((s) => s.locks);
  const keep = useLocksStore((s) => s.freeKeep);
  const counters = useTodayCounters();
  const apps = useInstalledApps();
  const [starting, setStarting] = useState(false);
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [lit, setLit] = useState<string[]>(() => (highlight ? highlight.split(',') : []));
  const change = useLockChange();

  useEffect(() => {
    if (!lit.length) return undefined;
    const id = setTimeout(() => setLit([]), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [lit]);

  const installed = new Set((apps ?? []).map((a) => a.packageName));
  const paused = pausedByPlan(locks, isPro, keep);
  const onCount = locks.filter((l) => l.enabled && !paused.has(l.id)).length;
  const appLocks = locks.filter((l) => l.target.kind === 'app');
  const siteLocks = locks.filter((l) => l.target.kind === 'site');

  const row = (l: Lock) => (
    <LockRow
      key={l.id}
      lock={l}
      counters={counters[targetKey(l.target)]}
      status={lockStatus(
        l,
        counters[targetKey(l.target)],
        apps === null || l.target.kind !== 'app' || installed.has(l.target.packageName),
      )}
      pausedByPlan={paused.has(l.id)}
      highlight={lit.includes(l.id)}
      onPress={() => router.push({ pathname: '/lock/[id]', params: { id: l.id } })}
      onToggle={(on) =>
        change.request(
          l,
          on ? { kind: 'enable' } : { kind: 'disable' },
          counters[targetKey(l.target)],
        )
      }
    />
  );

  return (
    <Screen testID="tab.block" gutter="tab" scroll edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="titleLg" accessibilityRole="header">
          {t('locks.tab.title')}
        </Text>
        <PressableScale
          testID="locks.new"
          accessibilityRole="button"
          accessibilityLabel={t('locks.tab.newLock')}
          onPress={() => openNewLock(isPro, locks.length)}
          style={styles.plus}>
          <Icon name="plus" size={size.icon.md} color={color.text.primary} />
        </PressableScale>
      </View>
      <FocusCard onStart={() => setStarting(true)} />
      <View style={styles.sectionHead}>
        <Text variant="heading">{t('locks.tab.yourLocks')}</Text>
        {locks.length ? (
          <Text variant="caption" tone="secondary">
            {t('locks.tab.onCount', { count: onCount })}
          </Text>
        ) : null}
      </View>
      {locks.length === 0 ? (
        <EmptyState
          icon="lock"
          title={t('locks.tab.emptyTitle')}
          body={t('locks.tab.emptyBody')}
          actionLabel={t('locks.tab.emptyAction')}
          onAction={() => router.push('/lock/new?kind=app')}
          testID="locks.empty"
        />
      ) : (
        <View style={styles.rows}>
          {appLocks.length ? (
            <Text variant="micro" tone="secondary">
              {t('locks.tab.apps')}
            </Text>
          ) : null}
          {appLocks.map(row)}
          {siteLocks.length ? (
            <Text variant="micro" tone="secondary" style={styles.subhead}>
              {t('locks.tab.websites')}
            </Text>
          ) : null}
          {siteLocks.map(row)}
          <Button
            testID="locks.newBottom"
            variant="secondary"
            icon="plus"
            label={t('locks.tab.newLock')}
            onPress={() => openNewLock(isPro, locks.length)}
          />
        </View>
      )}
      <View style={styles.clearance} />
      <FocusStartSheet visible={starting} onClose={() => setStarting(false)} />
      {change.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.headerTop + space.lg,
    marginBottom: space.lg,
  },
  plus: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.pill,
    backgroundColor: color.surface.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space['2xl'],
    marginBottom: space.md,
  },
  rows: { gap: space.sm },
  subhead: { marginTop: space.md },
  clearance: { height: layout.tabBarClearance },
});
