import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTileRow, Banner, Icon, PrimaryButton, Segmented, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { isProNow } from '@/features/paywall/usePro';
import { useT } from '@/i18n';
import { dayKey, dayStart } from '@/lib/time';
import { blocking, type ShieldEvent } from '@/services/blocking';

import { fixBlockingAccess, useAccessStore } from '../accessStore';
import { appCount } from '../model';
import { scheduleLine, selectionTiles } from '../present';
import { canAddRule } from '../rules';
import { useRulesStore } from '../store';
import { RuleCard } from './RuleCard';

const S = layout.screen;

type Tab = 'rules' | 'apps';

/**
 * FBlock (SPEC §5): every rule at a glance. Rules | Apps. "+ New rule" opens the editor, or
 * P08 when the 2 free rules are in use. Blocking off: banner on top, whole list muted.
 */
export function BlockScreen() {
  const t = useT();
  const rules = useRulesStore((s) => s.rules);
  const setEnabled = useRulesStore((s) => s.setEnabled);
  const access = useAccessStore((s) => s.status);
  const [tab, setTab] = useState<Tab>('rules');
  const [events, setEvents] = useState<ShieldEvent[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const isOff = access !== 'approved';

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void blocking.getShieldEvents(dayStart(dayKey())).then((e) => alive && setEvents(e));
      return () => {
        alive = false;
      };
    }, []),
  );
  useEffect(() => {
    void blocking
      .listInstalledApps()
      .then((apps) => setNames(new Map(apps.map((a) => [a.packageName, a.label]))));
  }, []);

  const opensUsed = (ruleId: string) =>
    events.filter((e) => e.ruleId === ruleId && e.outcome === 'opened').length;

  const handleNewRule = () => {
    if (canAddRule(rules, isProNow())) router.push('/rule/new');
    else router.push('/paywall/limit');
  };

  const isOnlyBedtime = rules.length <= 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="title.page" accessibilityRole="header">
            {t('block.title')}
          </Text>
          <View
            style={styles.status}
            accessible
            accessibilityLabel={t(isOff ? 'block.statusOff' : 'block.statusOn')}>
            {/* DECIDED (SPEC FBlock): the last status dot became an icon, matching Home. */}
            <Icon
              name={isOff ? 'lockOpen' : 'lock'}
              size={size.icon.xs - 4}
              color={isOff ? color.status.dangerSoft : color.status.success}
            />
            <Text variant="caption.strong">{t(isOff ? 'block.statusOff' : 'block.statusOn')}</Text>
          </View>
        </View>
        {isOff ? (
          <View style={styles.block}>
            <Banner
              kind="blockingOff"
              title={t('home.banner.blockingOff.title')}
              sub={t('home.banner.blockingOff.sub')}
              actionLabel={t('home.banner.fix')}
              onAction={() => void fixBlockingAccess()}
            />
          </View>
        ) : null}
        <View style={styles.block}>
          <Segmented<Tab>
            testID="block.segmented"
            options={[
              { value: 'rules', label: t('block.rules') },
              { value: 'apps', label: t('block.apps') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
        {tab === 'rules' ? (
          <View style={[styles.block, styles.list]}>
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                scheduleLine={scheduleLine(rule)}
                apps={selectionTiles(rule, names)}
                appsTotal={appCount(rule.apps)}
                opensUsed={opensUsed(rule.id)}
                isMuted={isOff}
                onToggle={(on) => setEnabled(rule.id, on)}
                onPress={() => router.push({ pathname: '/rule/[id]', params: { id: rule.id } })}
              />
            ))}
            {isOnlyBedtime ? (
              <Text variant="meta" tone="muted" align="center" style={styles.hint}>
                {t('block.emptyHint')}
              </Text>
            ) : null}
            <PrimaryButton
              testID="block.newRule"
              label={t('block.newRule')}
              variant="outline"
              icon="plus"
              compact
              onPress={handleNewRule}
            />
          </View>
        ) : (
          <View style={[styles.block, styles.list]}>
            {rules.map((rule) => (
              <View key={rule.id} style={styles.appsRow}>
                <Text variant="body.strong">{rule.name}</Text>
                <Text variant="meta" tone="muted">
                  {t('block.appsCount', { count: appCount(rule.apps) })}
                </Text>
                <View style={styles.appsTiles}>
                  <AppTileRow
                    apps={selectionTiles(rule, names)}
                    total={appCount(rule.apps)}
                    max={8}
                    size="m"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { paddingHorizontal: S.x, paddingTop: S.top, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: {
    height: size.statusPill,
    ...pill(size.statusPill),
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.bg.raised,
  },
  block: { marginTop: S.blockGap },
  list: { gap: S.listGap },
  hint: { marginVertical: space.sm },
  appsRow: {
    backgroundColor: color.bg.raised,
    ...rounded(radius.m),
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
  },
  appsTiles: { marginTop: space.sm + 2 },
});
