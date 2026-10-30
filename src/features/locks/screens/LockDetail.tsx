import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Header,
  ListGroup,
  ListRow,
  Ring,
  Screen,
  Sheet,
  Text,
  Toggle,
} from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import { lockStatus, usedFraction, type AllowanceDraft } from '../allowance';
import {
  allowanceText,
  AllowanceEditor,
  statusText,
  StrictnessSheet,
} from '../components/LockParts';
import { TargetIcon, targetName } from '../components/TargetIcon';
import { useInstalledApps, useTodayCounters } from '../hooks';
import { useLocksStore } from '../locksStore';
import { targetKey } from '../types';
import { previewParams } from './NewLockFlow';
import { useLockChange } from './useLockChange';

const BIG_ICON = 72;

/** Lock detail (20-phase2-core-app §6.7, reworked: no schedule). */
export function LockDetail() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lock = useLocksStore((s) => s.locks.find((l) => l.id === id));
  const counters = useTodayCounters();
  const apps = useInstalledApps();
  const change = useLockChange();
  const [sheet, setSheet] = useState<'allowance' | 'strictness' | 'delete' | null>(null);
  const [draft, setDraft] = useState<AllowanceDraft | null>(null);

  if (!lock) {
    return (
      <Screen header={<Header onBack={() => router.back()} />}>
        <View />
      </Screen>
    );
  }
  const c = counters[targetKey(lock.target)];
  const installed =
    lock.target.kind !== 'app' ||
    apps === null ||
    apps.some((a) => lock.target.kind === 'app' && a.packageName === lock.target.packageName);
  const status = lockStatus(lock, c, installed);
  const name = targetName(lock.target);
  const unlocks = t('locks.detail.unlocks', { count: c?.unlocksUsed ?? 0 });

  return (
    <Screen
      testID="lock.detail"
      scroll
      gutter="tab"
      header={<Header onBack={() => router.back()} />}>
      <View style={styles.hero}>
        <TargetIcon target={lock.target} size={BIG_ICON} />
        <Text variant="titleLg" align="center">
          {name}
        </Text>
        <View style={[styles.pill, lock.enabled ? styles.pillOn : null]}>
          <Text variant="caption" tone={lock.enabled ? 'success' : 'secondary'}>
            {lock.enabled
              ? t('locks.detail.onNow', { status: statusText(status) })
              : t('locks.detail.offNow')}
          </Text>
        </View>
      </View>
      <View style={styles.groups}>
        <ListGroup>
          <ListRow
            testID="lock.detail.toggle"
            title={t('locks.detail.lockOn')}
            trailing={
              <Toggle
                value={lock.enabled}
                onChange={(on) =>
                  change.request(lock, on ? { kind: 'enable' } : { kind: 'disable' }, c)
                }
                accessibilityLabel={t('locks.detail.lockOn')}
              />
            }
          />
        </ListGroup>
        <ListGroup label={t('locks.detail.today')}>
          <ListRow
            title={statusText(status)}
            subtitle={unlocks}
            trailing={
              <Ring
                progress={usedFraction(lock, c)}
                size={size.appIcon.sm}
                stroke={3}
                color={color.signal.success}
              />
            }
          />
        </ListGroup>
        <ListGroup>
          <ListRow
            testID="lock.detail.allowance"
            icon="timer"
            title={t('locks.detail.allowance')}
            value={allowanceText(lock)}
            onPress={() => {
              setDraft({ dailyMinutes: lock.dailyMinutes, dailyOpens: lock.dailyOpens });
              setSheet('allowance');
            }}
          />
          <ListRow
            testID="lock.detail.strictness"
            icon="shield"
            title={t('locks.detail.strictness')}
            value={t(`locks.strictness.${lock.strictness}`)}
            onPress={() => setSheet('strictness')}
          />
          <ListRow
            testID="lock.detail.preview"
            icon="eye"
            title={t('locks.detail.preview')}
            onPress={() => router.push({ pathname: '/pause', params: previewParams(lock) })}
          />
        </ListGroup>
        <ListGroup>
          <ListRow
            testID="lock.detail.delete"
            icon="trash"
            danger
            title={t('locks.detail.delete')}
            onPress={() => setSheet('delete')}
          />
        </ListGroup>
      </View>

      <Sheet
        visible={sheet === 'allowance'}
        onClose={() => setSheet(null)}
        title={t('locks.flow.howMuch')}
        actions={
          <Button
            testID="lock.detail.saveAllowance"
            label={t('locks.detail.saveAllowance')}
            disabled={!draft || (draft.dailyMinutes === null && draft.dailyOpens === null)}
            onPress={() => {
              setSheet(null);
              if (draft) change.request(lock, { kind: 'allowance', next: draft }, c);
            }}
          />
        }>
        {draft ? <AllowanceEditor value={draft} onChange={setDraft} /> : null}
      </Sheet>
      <StrictnessSheet
        visible={sheet === 'strictness'}
        value={lock.strictness}
        onClose={() => setSheet(null)}
        onPick={(s) => {
          setSheet(null);
          change.request(lock, { kind: 'strictness', next: s }, c);
        }}
      />
      <Sheet
        visible={sheet === 'delete'}
        onClose={() => setSheet(null)}
        testID="lock.detail.deleteSheet"
        title={t('locks.detail.deleteTitle', { name })}
        body={t('locks.detail.deleteBody')}
        actions={
          <>
            <Button
              testID="lock.detail.deleteConfirm"
              variant="danger"
              label={t('locks.detail.deleteConfirm')}
              onPress={() => {
                setSheet(null);
                change.request(lock, { kind: 'delete' }, c, () => router.back());
              }}
            />
            <Button
              variant="secondary"
              label={t('locks.detail.keep')}
              onPress={() => setSheet(null)}
            />
          </>
        }
      />
      {change.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.md, marginTop: space.lg },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: color.surface.control,
  },
  pillOn: { backgroundColor: color.signal.successSoft },
  groups: { gap: space.xl, marginTop: space['2xl'], paddingBottom: space['3xl'] },
});
