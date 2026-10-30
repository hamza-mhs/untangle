import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Header,
  HourChart,
  ListGroup,
  ListRow,
  Screen,
  Sheet,
  StatTile,
  Text,
} from '@/design/components';
import { space } from '@/design/tokens';
import { TargetIcon, targetKey, useInstalledApps, useLocksStore } from '@/features/locks';
import { detourHoursToday } from '@/features/pause';
import { useT } from '@/i18n';
import { formatDuration } from '@/lib/format';
import { blocker } from '@/native';

import { useToday } from './data';

const MOST_USED = 8;

/** Screen time detail (20-phase2-core-app §3). */
export function ScreenTimeScreen() {
  const t = useT();
  const data = useToday();
  const locks = useLocksStore((s) => s.locks);
  const apps = useInstalledApps();
  const [hours, setHours] = useState<number[]>(() => Array.from({ length: 24 }, () => 0));
  const [limit, setLimit] = useState<{ pkg: string; label: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.resolve()
      .then(() => detourHoursToday())
      .then((h) => {
        if (alive) setHours(h);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [data.loaded]);

  const header = <Header title={t('home.detail.title')} onBack={() => router.back()} />;

  if (data.loaded && !data.hasUsage) {
    return (
      <Screen testID="screenTime.noAccess" gutter="tab" header={header}>
        <EmptyState
          icon="chart"
          title={t('home.detail.noAccessTitle')}
          body={t('home.detail.noAccessBody')}
          actionLabel={t('home.detail.noAccessCta')}
          onAction={() => void blocker.openUsageAccessSettings().then(data.refresh)}
        />
      </Screen>
    );
  }

  const usage = data.usage;
  const delta =
    data.usualScreenMs !== null && usage ? usage.screenTimeMs - data.usualScreenMs : null;
  const pickDelta =
    data.usualPickups !== null && usage?.pickups != null
      ? Math.round(usage.pickups - data.usualPickups)
      : null;
  const lockedKeys = new Set(locks.map((l) => targetKey(l.target)));
  const label = (pkg: string) => apps?.find((a) => a.packageName === pkg)?.label ?? pkg;
  const detoursToday = hours.reduce((s, h) => s + h, 0);

  return (
    <Screen testID="screenTime" gutter="tab" scroll header={header}>
      <View style={styles.body}>
        <Card>
          <Text variant="body" tone="secondary">
            {t('home.detail.today')}
          </Text>
          <Text variant="statLg">{formatDuration((usage?.screenTimeMs ?? 0) / 60_000)}</Text>
          {delta !== null && Math.abs(delta) >= 60_000 ? (
            <Text variant="caption" tone={delta < 0 ? 'success' : 'secondary'}>
              {delta < 0
                ? t('home.screen.less', { time: formatDuration(-delta / 60_000) })
                : t('home.screen.more', { time: formatDuration(delta / 60_000) })}
            </Text>
          ) : null}
          <Text variant="caption" tone="secondary" style={styles.chartLabel}>
            {t('home.detail.pickupsByHour')}
          </Text>
          <HourChart
            values={
              usage?.pickupsByHour.length
                ? usage.pickupsByHour
                : Array.from({ length: 24 }, () => 0)
            }
            highlight={hours.map((h, i) => (h > 0 ? i : -1)).filter((i) => i >= 0)}
            axis={[
              t('home.detail.axis.h0'),
              t('home.detail.axis.h6'),
              t('home.detail.axis.h12'),
              t('home.detail.axis.h18'),
            ]}
            accessibilityLabel={t('home.detail.pickupsA11y')}
          />
        </Card>
        <View style={styles.tiles}>
          <View style={styles.flex}>
            <StatTile
              label={t('home.detail.pickups')}
              value={usage?.pickups == null ? '—' : String(usage.pickups)}
              {...(pickDelta !== null && pickDelta !== 0
                ? {
                    delta: {
                      text: t(
                        pickDelta < 0
                          ? 'home.detail.pickupsDelta_less'
                          : 'home.detail.pickupsDelta_more',
                        { count: Math.abs(pickDelta) },
                      ),
                      tone: pickDelta < 0 ? ('good' as const) : ('neutral' as const),
                    },
                  }
                : {})}
            />
          </View>
          <View style={styles.flex}>
            <StatTile
              label={t('home.detail.detours')}
              value={String(detoursToday)}
              delta={{ text: t('home.detail.detoursSub'), tone: 'neutral' }}
            />
          </View>
        </View>
        <ListGroup label={t('home.detail.mostUsed')}>
          {(usage?.perApp ?? []).slice(0, MOST_USED).map((a) => {
            const isLocked = lockedKeys.has(`app:${a.packageName}`);
            const name = label(a.packageName);
            return (
              <ListRow
                key={a.packageName}
                testID={`screenTime.app.${a.packageName}`}
                title={name}
                subtitle={t(isLocked ? 'home.detail.inLock' : 'home.detail.notBlocked')}
                value={formatDuration(a.ms / 60_000)}
                {...(isLocked
                  ? {}
                  : { onPress: () => setLimit({ pkg: a.packageName, label: name }) })}
              />
            );
          })}
        </ListGroup>
        <Text variant="caption" tone="tertiary">
          {t('home.detail.footnote')}
        </Text>
      </View>
      <Sheet
        visible={limit !== null}
        onClose={() => setLimit(null)}
        title={t('home.detail.limitTitle', { name: limit?.label ?? '' })}
        body={t('home.detail.limitBody')}
        actions={
          <Button
            label={t('home.detail.limitCta')}
            onPress={() => {
              const l = limit;
              setLimit(null);
              if (l) router.push({ pathname: '/lock/new', params: { kind: 'app', app: l.pkg } });
            }}
          />
        }>
        {limit ? (
          <View style={styles.limitIcon}>
            <TargetIcon target={{ kind: 'app', packageName: limit.pkg, label: limit.label }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: space.lg, marginTop: space.lg, paddingBottom: space['3xl'] },
  chartLabel: { marginTop: space.lg },
  tiles: { flexDirection: 'row', gap: space.md },
  limitIcon: { alignItems: 'center', marginTop: space.md },
});
