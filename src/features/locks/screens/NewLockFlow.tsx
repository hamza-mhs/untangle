import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, TextInput, View } from 'react-native';

import {
  AppIcon,
  Button,
  ChoiceChip,
  Header,
  Icon,
  PressableScale,
  Screen,
  Sheet,
  Skeleton,
  Text,
} from '@/design/components';
import { color, radius, size, space, type } from '@/design/tokens';
import { usePro } from '@/features/paywall';
import { useSettingsStore } from '@/features/settings';
import { useT } from '@/i18n';
import { blocker } from '@/native';

import { DEFAULT_MINUTES, hasLimit, summaryOf, type AllowanceDraft } from '../allowance';
import { allowanceText, AllowanceEditor } from '../components/LockParts';
import { TargetIcon, targetName } from '../components/TargetIcon';
import { normalizeDomain } from '../domain';
import { useAppIconUri, useInstalledApps } from '../hooks';
import { FREE_LOCK_LIMIT, useLocksStore } from '../locksStore';
import { targetKey, type Lock, type LockTarget } from '../types';

export const POPULAR_SITES = [
  'reddit.com',
  'youtube.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'news.ycombinator.com',
  '9gag.com',
] as const;

type Step = 'kind' | 'apps' | 'site' | 'allowance';

function AppPickRow({
  packageName,
  label,
  sub,
  picked,
  disabled,
  onPress,
}: {
  packageName: string;
  label: string;
  sub: string | null;
  picked: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const uri = useAppIconUri(packageName);
  return (
    <PressableScale
      testID={`lockflow.app.${packageName}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: picked, disabled }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.appRow, disabled ? styles.dim : null]}>
      <AppIcon label={label} uri={uri} colorKey={packageName} size={size.appIcon.sm} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text variant="caption" tone="secondary">
            {sub}
          </Text>
        ) : null}
      </View>
      <View style={[styles.box, picked ? styles.boxOn : null]}>
        {picked ? <Icon name="check" size={size.icon.xs} color={color.text.onLight} /> : null}
      </View>
    </PressableScale>
  );
}

/** New lock (20-phase2-core-app §6.2–6.5): kind → pick → how much a day → done. */
export function NewLockFlow() {
  const t = useT();
  const { isPro } = usePro();
  const params = useLocalSearchParams<{ kind?: string; app?: string }>();
  const startKind = params.kind === 'app' || params.kind === 'site' ? params.kind : null;
  const [step, setStep] = useState<Step>(
    params.app
      ? 'allowance'
      : startKind === 'app'
        ? 'apps'
        : startKind === 'site'
          ? 'site'
          : 'kind',
  );
  const [kind, setKind] = useState<'app' | 'site'>(startKind ?? 'app');
  const locks = useLocksStore((s) => s.locks);
  const addLocks = useLocksStore((s) => s.addLocks);
  const strictness = useSettingsStore((s) => s.defaultStrictness);
  const apps = useInstalledApps();
  const [minutesToday, setMinutesToday] = useState<Record<string, number> | null>(null);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>(params.app ? [params.app] : []);
  const [sites, setSites] = useState<string[]>([]);
  const [siteInput, setSiteInput] = useState('');
  const [siteError, setSiteError] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<AllowanceDraft>({
    dailyMinutes: DEFAULT_MINUTES,
    dailyOpens: null,
  });
  const [created, setCreated] = useState<Lock[] | null>(null);

  const room = isPro ? Infinity : Math.max(0, FREE_LOCK_LIMIT - locks.length);
  const locked = useMemo(() => new Map(locks.map((l) => [targetKey(l.target), l])), [locks]);

  useEffect(() => {
    void blocker
      .getUsageToday()
      .then((u) =>
        setMinutesToday(
          Object.fromEntries(u.perApp.map((a) => [a.packageName, Math.round(a.ms / 60_000)])),
        ),
      )
      .catch(() => setMinutesToday(null));
  }, []);

  const back = () => {
    if (step === 'allowance') setStep(kind === 'app' ? 'apps' : 'site');
    else if ((step === 'apps' || step === 'site') && !startKind) setStep('kind');
    else router.back();
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  });

  const toggleApp = (pkg: string) =>
    setPicked((p) =>
      p.includes(pkg) ? p.filter((x) => x !== pkg) : p.length >= room ? p : [...p, pkg],
    );

  const addSite = (raw: string) => {
    const d = normalizeDomain(raw);
    if (!d) return setSiteError(t('locks.flow.siteInvalid'));
    if (locked.has(`site:${d}`) || sites.includes(d))
      return setSiteError(t('locks.flow.siteDuplicate', { domain: d }));
    if (sites.length >= room) return setSiteError(t('locks.flow.freeCap'));
    setSites((s) => [...s, d]);
    setSiteInput('');
    setSiteError(null);
  };

  const targets: LockTarget[] =
    kind === 'app'
      ? picked.map((p) => ({
          kind: 'app',
          packageName: p,
          label: apps?.find((a) => a.packageName === p)?.label ?? p,
        }))
      : sites.map((domain) => ({ kind: 'site', domain }));
  const firstName = targets[0] ? targetName(targets[0]) : '';
  const nameOrCount =
    targets.length === 1
      ? firstName
      : t(kind === 'site' ? 'locks.flow.eachSite' : 'locks.flow.eachApp');

  const create = () => {
    const added = addLocks(targets, allowance, strictness);
    setCreated(added);
  };

  const finishDone = () => {
    const ids = (created ?? []).map((l) => l.id).join(',');
    setCreated(null);
    router.dismissTo({ pathname: '/block', params: { highlight: ids } });
  };

  const progressDone = step === 'kind' ? 1 : step === 'allowance' ? 3 : 2;
  const header = (
    <Header onBack={back} progress={{ total: 3, done: progressDone }} testID="lockflow.header" />
  );

  if (step === 'kind') {
    return (
      <Screen testID="lockflow.kind" header={header}>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('locks.flow.kindTitle')}
        </Text>
        <View style={styles.kinds}>
          {(['app', 'site'] as const).map((k) => (
            <PressableScale
              key={k}
              testID={`lockflow.kind.${k}`}
              accessibilityRole="button"
              accessibilityLabel={`${t(`locks.flow.${k}`)}, ${t(`locks.flow.${k}Sub`)}`}
              onPress={() => {
                setKind(k);
                setStep(k === 'app' ? 'apps' : 'site');
              }}
              style={styles.kindCard}>
              <Icon
                name={k === 'app' ? 'apps' : 'globe'}
                size={size.icon.lg}
                color={color.text.primary}
              />
              <Text variant="heading">{t(`locks.flow.${k}`)}</Text>
              <Text variant="body" tone="secondary">
                {t(`locks.flow.${k}Sub`)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </Screen>
    );
  }

  if (step === 'apps') {
    const q = query.trim().toLowerCase();
    const list = (apps ?? [])
      .filter((a) => !q || a.label.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label));
    const used = minutesToday
      ? list
          .filter((a) => (minutesToday[a.packageName] ?? 0) > 0)
          .sort((a, b) => (minutesToday[b.packageName] ?? 0) - (minutesToday[a.packageName] ?? 0))
          .slice(0, 5)
      : [];
    const row = (a: { packageName: string; label: string }) => {
      const existing = locked.get(`app:${a.packageName}`);
      const mins = minutesToday?.[a.packageName];
      return (
        <AppPickRow
          key={a.packageName}
          packageName={a.packageName}
          label={a.label}
          sub={
            existing
              ? t('locks.flow.alreadyLocked', { allowance: allowanceText(existing) })
              : mins
                ? t('locks.flow.minutesToday', { minutes: mins })
                : null
          }
          picked={picked.includes(a.packageName)}
          disabled={!!existing}
          onPress={() => toggleApp(a.packageName)}
        />
      );
    };
    return (
      <Screen
        testID="lockflow.apps"
        scroll
        header={header}
        footer={
          <Button
            testID="lockflow.apps.next"
            label={
              picked.length
                ? t('locks.flow.nextApps', { count: picked.length })
                : t('locks.flow.nextNone')
            }
            disabled={!picked.length}
            onPress={() => setStep('allowance')}
          />
        }>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('locks.flow.appsTitle')}
        </Text>
        <View style={styles.search}>
          <Icon name="search" size={size.icon.sm} color={color.text.tertiary} />
          <TextInput
            testID="lockflow.search"
            value={query}
            onChangeText={setQuery}
            placeholder={t('locks.flow.search')}
            placeholderTextColor={color.text.tertiary}
            accessibilityLabel={t('locks.flow.search')}
            style={styles.input}
          />
        </View>
        {!isPro && picked.length >= room ? (
          <Text variant="caption" tone="warning">
            {t('locks.flow.freeCap')}
          </Text>
        ) : null}
        {apps === null ? (
          <View style={styles.list}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={size.listRow} />
            ))}
          </View>
        ) : (
          <>
            {used.length && !q ? (
              <>
                <Text variant="micro" tone="secondary" style={styles.section}>
                  {t('locks.flow.mostUsed')}
                </Text>
                <View style={styles.list}>{used.map(row)}</View>
              </>
            ) : null}
            <Text variant="micro" tone="secondary" style={styles.section}>
              {t('locks.flow.allApps')}
            </Text>
            <View style={styles.list}>{list.map(row)}</View>
            {!list.length ? (
              <Text variant="body" tone="secondary">
                {t('locks.flow.noResults', { q: query })}
              </Text>
            ) : null}
          </>
        )}
      </Screen>
    );
  }

  if (step === 'site') {
    return (
      <Screen
        testID="lockflow.site"
        scroll
        header={header}
        footer={
          <Button
            testID="lockflow.site.next"
            label={
              sites.length
                ? t('locks.flow.nextSites', { count: sites.length })
                : t('locks.flow.nextNone')
            }
            disabled={!sites.length}
            onPress={() => setStep('allowance')}
          />
        }>
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {t('locks.flow.siteTitle')}
        </Text>
        <View style={styles.search}>
          <Icon name="globe" size={size.icon.sm} color={color.text.tertiary} />
          <TextInput
            testID="lockflow.site.input"
            value={siteInput}
            onChangeText={(v) => {
              setSiteInput(v);
              setSiteError(null);
            }}
            onSubmitEditing={() => addSite(siteInput)}
            placeholder={t('locks.flow.sitePlaceholder')}
            placeholderTextColor={color.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            accessibilityLabel={t('locks.flow.siteTitle')}
            style={styles.input}
          />
          <Button
            testID="lockflow.site.add"
            size="md"
            variant="secondary"
            label={t('locks.flow.siteAdd')}
            onPress={() => addSite(siteInput)}
          />
        </View>
        {siteError ? (
          <Text
            variant="caption"
            tone="danger"
            accessibilityLiveRegion="polite"
            testID="lockflow.site.error">
            {siteError}
          </Text>
        ) : null}
        {sites.length ? (
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
        ) : null}
        <Text variant="micro" tone="secondary" style={styles.section}>
          {t('locks.flow.popular')}
        </Text>
        <View style={styles.chips}>
          {POPULAR_SITES.filter((d) => !locked.has(`site:${d}`)).map((d) => (
            <ChoiceChip
              key={d}
              testID={`lockflow.popular.${d}`}
              label={d}
              selected={sites.includes(d)}
              onPress={() =>
                sites.includes(d) ? setSites((s) => s.filter((x) => x !== d)) : addSite(d)
              }
            />
          ))}
        </View>
        <Text variant="caption" tone="tertiary" style={styles.section}>
          {t('locks.flow.siteNote')}
        </Text>
      </Screen>
    );
  }

  // step === 'allowance'
  const summary = summaryOf(allowance);
  const can = hasLimit(allowance);
  const ctaLabel = !can
    ? t('locks.flow.needLimit')
    : targets.length === 1
      ? t('locks.flow.lockOne', { name: firstName })
      : kind === 'site'
        ? t('locks.flow.lockSites', { count: targets.length })
        : t('locks.flow.lockMany', { count: targets.length });
  const doneBody =
    allowance.dailyMinutes === 0
      ? t('locks.flow.doneBodyAllDay')
      : allowance.dailyMinutes !== null
        ? t('locks.flow.doneBodyMinutes', { minutes: allowance.dailyMinutes })
        : t('locks.flow.doneBodyOpens', { opens: allowance.dailyOpens ?? 0 });

  return (
    <Screen
      testID="lockflow.allowance"
      scroll
      header={header}
      footer={
        <Button testID="lockflow.create" label={ctaLabel} disabled={!can} onPress={create} />
      }>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {t('locks.flow.howMuch')}
      </Text>
      <AllowanceEditor value={allowance} onChange={setAllowance} />
      <Text
        variant="body"
        tone="body"
        style={styles.section}
        accessibilityLiveRegion="polite"
        testID="lockflow.summary">
        {summary.key === 'none'
          ? t('locks.flow.summary.none')
          : t(`locks.flow.summary.${summary.key}`, { name: nameOrCount, ...summary })}
      </Text>
      <Sheet
        visible={created !== null}
        onClose={finishDone}
        testID="lockflow.done"
        title={
          (created ?? []).length === 1
            ? t('locks.flow.doneOne', { name: created?.[0] ? targetName(created[0].target) : '' })
            : t('locks.flow.doneMany', { count: (created ?? []).length })
        }
        body={doneBody}
        actions={
          <>
            <Button testID="lockflow.done.ok" label={t('locks.flow.done')} onPress={finishDone} />
            <Button
              variant="ghost"
              size="md"
              label={t('locks.flow.preview')}
              onPress={() => {
                const l = created?.[0];
                finishDone();
                if (l) router.push({ pathname: '/pause', params: previewParams(l) });
              }}
            />
          </>
        }>
        <View style={styles.doneIcons}>
          {(created ?? []).slice(0, 5).map((l) => (
            <TargetIcon key={l.id} target={l.target} size={size.appIcon.md} />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

/** Deep-link params that open the pause screen in preview mode for a lock. */
export function previewParams(l: Lock): Record<string, string> {
  return {
    targetKey: targetKey(l.target),
    reason: l.dailyMinutes === 0 ? 'always' : 'time',
    label: targetName(l.target),
    lockId: l.id,
    strictness: l.strictness,
    opensToday: '0',
    usedMs: '0',
    minutesAllowed: l.dailyMinutes === null ? '' : String(l.dailyMinutes),
    opensAllowed: l.dailyOpens === null ? '' : String(l.dailyOpens),
    unlocksUsed: '0',
    preview: '1',
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.lg, marginBottom: space.lg },
  kinds: { gap: space.md },
  kindCard: {
    gap: space.sm,
    padding: space.xl,
    borderRadius: radius.card,
    backgroundColor: color.surface.card,
    borderWidth: size.hairline,
    borderColor: color.surface.line,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface.control,
    minHeight: size.touch + space.xs,
  },
  input: { ...type.body, flex: 1, color: color.text.primary, minHeight: size.touch },
  section: { marginTop: space.xl, marginBottom: space.sm },
  list: { gap: space.xs },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.listRow,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface.card,
  },
  dim: { opacity: 0.5 },
  box: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: color.surface.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: color.text.primary, borderColor: color.text.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  doneIcons: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});
