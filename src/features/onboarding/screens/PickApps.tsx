import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  AppIcon,
  Button,
  ChoiceChip,
  Icon,
  PressableScale,
  Sheet,
  SiteIcon,
  Skeleton,
  Text,
  Toggle,
} from '@/design/components';
import { color, glow, radius, size, space, type } from '@/design/tokens';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';
import {
  DEFAULT_DAILY_MINUTES,
  FREE_LOCK_LIMIT,
  normalizeDomain,
  PRESELECTED,
  rankSuspects,
  useLocksStore,
  type LockTarget,
} from '@/features/locks';
import { usePro } from '@/features/paywall';
import { useSettingsStore } from '@/features/settings';
import { blocker, type InstalledApp } from '@/native';

import { OnboardingFrame } from '../components/OnboardingFrame';
import { hrefFor } from '../steps';

/** Allowance choices on Pick apps (minutes a day; 0 = blocked all day). */
export const ALLOWANCE_CHOICES = [0, 15, 30, 45, 60] as const;
const SKELETON_ROWS = 6;
const WEEK_DAYS = 7;

function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Minutes per package over the last 7 days, or null without Usage access. */
async function weekMinutes(): Promise<Record<string, number> | null> {
  if (!(await blocker.hasUsageAccess())) return null;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (WEEK_DAYS - 1));
  const days = await blocker.getUsageRange(localDate(from), localDate(to));
  const out: Record<string, number> = {};
  for (const d of days)
    for (const a of d.perApp) out[a.packageName] = (out[a.packageName] ?? 0) + a.ms / 60_000;
  return out;
}

type Loaded = {
  all: InstalledApp[];
  suspects: InstalledApp[];
  minutes: Record<string, number> | null;
};

function AppToggleRow({
  app,
  on,
  minutes,
  onChange,
}: {
  app: InstalledApp;
  on: boolean;
  minutes: number | null;
  onChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <View style={styles.row} testID={`onboarding.pickApps.app.${app.packageName}`}>
      <AppIcon label={app.label} colorKey={app.packageName} size={size.appIcon.sm} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {app.label}
        </Text>
        {minutes !== null && minutes > 0 ? (
          <Text variant="caption" tone="secondary">
            {t('onboarding.pickApps.minutesWeek', { minutes: Math.round(minutes / WEEK_DAYS) })}
          </Text>
        ) : null}
      </View>
      <Toggle
        value={on}
        onChange={onChange}
        accessibilityLabel={t('onboarding.pickApps.blockApp', { app: app.label })}
      />
    </View>
  );
}

function AddRow({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.row}>
      <View style={styles.plus}>
        <Icon name="plus" size={size.icon.sm} color={color.text.primary} />
      </View>
      <Text variant="bodyStrong" style={styles.rowText}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** §2.18 Pick apps: the usual suspects, top three on; one lock per pick. */
export function PickAppsScreen() {
  const t = useT();
  const { isPro } = usePro();
  const strictness = useSettingsStore((s) => s.defaultStrictness);
  const addLocks = useLocksStore((s) => s.addLocks);
  const [data, setData] = useState<Loaded | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<number>(DEFAULT_DAILY_MINUTES);
  const [sheet, setSheet] = useState<'apps' | 'sites' | 'allowance' | null>(null);
  const [capHit, setCapHit] = useState(false);
  const [siteInput, setSiteInput] = useState('');
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [all, mins] = await Promise.all([
        blocker.getInstalledApps(),
        weekMinutes().catch(() => null),
      ]);
      if (!alive) return;
      const suspects = rankSuspects(all, mins);
      setData({
        all: [...all].sort((a, b) => a.label.localeCompare(b.label)),
        suspects,
        minutes: mins,
      });
      setPicked(suspects.slice(0, PRESELECTED).map((a) => a.packageName));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const total = picked.length + sites.length;
  const cap = isPro ? Infinity : FREE_LOCK_LIMIT;

  const toggleApp = (pkg: string, on: boolean) => {
    if (on && total >= cap) {
      setCapHit(true);
      showToast({ title: t('onboarding.pickApps.cap'), tone: 'neutral' });
      return;
    }
    setCapHit(false);
    setPicked((p) => (on ? [...p, pkg] : p.filter((x) => x !== pkg)));
  };

  const addSite = () => {
    const d = normalizeDomain(siteInput);
    if (!d) {
      setSiteError(t('onboarding.pickApps.sites.invalid'));
      return;
    }
    if (sites.includes(d)) {
      setSiteError(t('onboarding.pickApps.sites.duplicate', { domain: d }));
      return;
    }
    if (total >= cap) {
      setCapHit(true);
      showToast({ title: t('onboarding.pickApps.cap'), tone: 'neutral' });
      setSheet(null);
      return;
    }
    setSites((s) => [...s, d]);
    setSiteInput('');
    setSiteError(null);
  };

  const byPkg = useMemo(() => new Map((data?.all ?? []).map((a) => [a.packageName, a])), [data]);
  const suspectSet = useMemo(
    () => new Set((data?.suspects ?? []).map((a) => a.packageName)),
    [data],
  );
  // Extra apps picked from the full list show under the suspects.
  const extra = picked
    .filter((p) => !suspectSet.has(p))
    .map((p) => byPkg.get(p))
    .filter((a): a is InstalledApp => !!a);
  const noSuspects = data !== null && data.suspects.length === 0;

  const block = () => {
    const targets: LockTarget[] = [
      ...picked.map((p) => ({
        kind: 'app' as const,
        packageName: p,
        label: byPkg.get(p)?.label ?? p,
      })),
      ...sites.map((domain) => ({ kind: 'site' as const, domain })),
    ];
    addLocks(targets, { dailyMinutes: minutes, dailyOpens: null }, strictness);
    router.push(hrefFor('all-set'));
  };

  const ctaText =
    total === 0
      ? t('onboarding.pickApps.cta.none')
      : sites.length === 0
        ? t('onboarding.pickApps.cta.apps', { count: picked.length })
        : picked.length === 0
          ? t('onboarding.pickApps.cta.sites', { count: sites.length })
          : t('onboarding.pickApps.cta.both', {
              apps: t('onboarding.pickApps.cta.appsPart', { count: picked.length }),
              sites: t('onboarding.pickApps.cta.sitesPart', { count: sites.length }),
            });

  const allowanceText =
    minutes === 0
      ? t('onboarding.pickApps.allowance.allDay')
      : t('onboarding.pickApps.allowance.minutes', { minutes });

  const fullList = (
    <View style={styles.list}>
      {(data?.all ?? []).map((a) => (
        <AppToggleRow
          key={a.packageName}
          app={a}
          on={picked.includes(a.packageName)}
          minutes={data?.minutes?.[a.packageName] ?? null}
          onChange={(v) => toggleApp(a.packageName, v)}
        />
      ))}
    </View>
  );

  return (
    <OnboardingFrame
      step="pick-apps"
      scroll
      glow={glow.pickApps}
      title={t('onboarding.pickApps.title')}
      body={t('onboarding.pickApps.body')}
      cta={{ label: ctaText, onPress: block, variant: 'brand', disabled: total === 0 }}>
      <View style={styles.list}>
        {data === null
          ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <Skeleton
                key={i}
                height={size.listRow}
                testID={`onboarding.pickApps.skeleton.${i}`}
              />
            ))
          : null}
        {noSuspects ? (
          <>
            <Text variant="bodyStrong" tone="body" testID="onboarding.pickApps.noSuspects">
              {t('onboarding.pickApps.noSuspects')}
            </Text>
            {fullList}
          </>
        ) : null}
        {data && !noSuspects
          ? [...data.suspects, ...extra].map((a) => (
              <AppToggleRow
                key={a.packageName}
                app={a}
                on={picked.includes(a.packageName)}
                minutes={data.minutes?.[a.packageName] ?? null}
                onChange={(v) => toggleApp(a.packageName, v)}
              />
            ))
          : null}
        {sites.map((d) => (
          <View key={d} style={styles.row} testID={`onboarding.pickApps.site.${d}`}>
            <SiteIcon domain={d} size={size.appIcon.sm} />
            <Text variant="bodyStrong" style={styles.rowText} numberOfLines={1}>
              {d}
            </Text>
            <Toggle
              value
              onChange={() => setSites((s) => s.filter((x) => x !== d))}
              accessibilityLabel={t('onboarding.pickApps.blockApp', { app: d })}
            />
          </View>
        ))}
        {data && !noSuspects ? (
          <AddRow
            testID="onboarding.pickApps.addApps"
            label={t('onboarding.pickApps.addApps')}
            onPress={() => setSheet('apps')}
          />
        ) : null}
        <AddRow
          testID="onboarding.pickApps.addSites"
          label={t('onboarding.pickApps.addSites')}
          onPress={() => setSheet('sites')}
        />
        <PressableScale
          testID="onboarding.pickApps.allowance"
          accessibilityRole="button"
          accessibilityLabel={`${t('onboarding.pickApps.allowance.label', { value: allowanceText })}, ${t('onboarding.pickApps.allowance.change')}`}
          onPress={() => setSheet('allowance')}
          style={styles.allowance}>
          <Text variant="body" tone="body" style={styles.rowText}>
            {t('onboarding.pickApps.allowance.label', { value: allowanceText })}
          </Text>
          <Text variant="bodyStrong" tone="violet">
            {t('onboarding.pickApps.allowance.change')}
          </Text>
        </PressableScale>
        {capHit ? (
          <View style={styles.cap} testID="onboarding.pickApps.cap">
            <Text variant="caption" tone="warning">
              {t('onboarding.pickApps.cap')}
            </Text>
          </View>
        ) : null}
      </View>

      <Sheet
        visible={sheet === 'apps'}
        onClose={() => setSheet(null)}
        title={t('onboarding.pickApps.appsSheet.title')}
        actions={<Button label={t('common.done')} onPress={() => setSheet(null)} />}>
        <ScrollView style={styles.sheetList}>{fullList}</ScrollView>
      </Sheet>

      <Sheet
        visible={sheet === 'sites'}
        onClose={() => setSheet(null)}
        title={t('onboarding.pickApps.sites.title')}
        body={t('onboarding.pickApps.sites.note')}
        actions={
          <>
            <Button
              label={t('onboarding.pickApps.sites.add')}
              onPress={addSite}
              testID="onboarding.pickApps.sites.add"
            />
            <Button
              variant="ghost"
              size="md"
              label={t('common.done')}
              onPress={() => setSheet(null)}
            />
          </>
        }>
        <TextInput
          testID="onboarding.pickApps.sites.input"
          value={siteInput}
          onChangeText={(v) => {
            setSiteInput(v);
            setSiteError(null);
          }}
          onSubmitEditing={addSite}
          placeholder={t('onboarding.pickApps.sites.placeholder')}
          placeholderTextColor={color.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel={t('onboarding.pickApps.sites.title')}
          style={styles.input}
        />
        {siteError ? (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {siteError}
          </Text>
        ) : null}
        <View style={styles.chips}>
          {sites.map((d) => (
            <ChoiceChip
              key={d}
              label={d}
              selected
              onPress={() => setSites((s) => s.filter((x) => x !== d))}
            />
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={sheet === 'allowance'}
        onClose={() => setSheet(null)}
        title={t('onboarding.pickApps.allowance.title')}
        actions={<Button label={t('common.done')} onPress={() => setSheet(null)} />}>
        <View style={styles.chips}>
          {ALLOWANCE_CHOICES.map((m) => (
            <ChoiceChip
              key={m}
              testID={`onboarding.pickApps.allowance.${m}`}
              label={
                m === 0
                  ? t('onboarding.pickApps.allowance.allDay')
                  : t('onboarding.pickApps.allowance.minutes', { minutes: m })
              }
              selected={minutes === m}
              onPress={() => setMinutes(m)}
            />
          ))}
        </View>
      </Sheet>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  row: {
    minHeight: size.listRow,
    borderRadius: radius.lg,
    backgroundColor: color.surface.option,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  rowText: { flex: 1, minWidth: 0 },
  plus: {
    width: size.appIcon.sm,
    height: size.appIcon.sm,
    borderRadius: radius.sm,
    backgroundColor: color.surface.controlStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.touch,
    paddingHorizontal: space.xs,
  },
  cap: {
    borderRadius: radius.md,
    padding: space.md,
    backgroundColor: color.signal.warningSoft,
    borderWidth: size.hairline,
    borderColor: color.signal.warningLine,
  },
  sheetList: { maxHeight: 360 },
  input: {
    ...type.body,
    color: color.text.primary,
    backgroundColor: color.surface.control,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: size.touch,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
