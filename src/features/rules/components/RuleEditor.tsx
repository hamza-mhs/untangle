import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppTileRow,
  PressableScale,
  PrimaryButton,
  StrengthOption,
  Text,
  TextLink,
} from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { isProNow } from '@/features/paywall/usePro';
import { useT } from '@/i18n';
import { formatWeekdayInitial } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { blocking } from '@/services/blocking';

import { draftToRule, useRuleDraftStore } from '../draftStore';
import { appCount, type Weekday } from '../model';
import { selectionTiles } from '../present';
import { validateRule, WEEK_ORDER } from '../rules';
import { useRulesStore } from '../store';
import { STRENGTH_ORDER, STRENGTH_RULES } from '../strengths';
import { TimePill } from './TimePill';

const S = layout.screen;

/**
 * FRuleEdit (rule/new, rule/[id]): Apps (native picker), When (weekday circles + From/To),
 * Strength. Save is disabled until valid: ≥1 app, ≥1 day, From ≠ To (overnight is fine).
 * Picking Locked on free opens P07 instead of selecting it.
 */
export function RuleEditor() {
  const t = useT();
  const draft = useRuleDraftStore((s) => s.draft);
  const patch = useRuleDraftStore((s) => s.patch);
  const upsertRule = useRulesStore((s) => s.upsertRule);
  const removeRule = useRulesStore((s) => s.removeRule);
  const [isPicking, setIsPicking] = useState(false);
  const isNew = draft.id === null;
  const problems = validateRule({
    name: draft.name,
    strength: draft.strength,
    apps: draft.apps,
    schedule: { days: draft.days, start: draft.start, end: draft.end },
  });
  const canSave = problems.length === 0;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/block'));

  const handleChoose = async () => {
    setIsPicking(true);
    const result = await blocking.pickApps(draft.apps);
    setIsPicking(false);
    if (result.ok) patch({ apps: result.value });
  };

  const toggleDay = (day: Weekday) => {
    haptics.select();
    patch({
      days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day],
    });
  };

  const pickStrength = (s: (typeof STRENGTH_ORDER)[number]) => {
    if (STRENGTH_RULES[s].isProOnly && !isProNow()) {
      router.push('/paywall/gate');
      return;
    }
    patch({ strength: s });
  };

  const handleSave = () => {
    const rule = draftToRule(draft, Date.now());
    if (!rule || !canSave) {
      haptics.warning();
      return;
    }
    upsertRule(rule);
    haptics.success();
    close();
  };

  const count = draft.apps ? appCount(draft.apps) : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.nav}>
        <TextLink testID="rule.cancel" label={t('common.cancel')} tone="muted" onPress={close} />
        <Text variant="label.chip" accessibilityRole="header">
          {t(isNew ? 'rules.edit.newTitle' : 'rules.edit.editTitle')}
        </Text>
        <PressableScale
          testID="rule.saveTop"
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          hitSlop={space.md}
          onPress={handleSave}>
          <Text variant="label.chip" tone={canSave ? 'accent' : 'faint'}>
            {t('common.save')}
          </Text>
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="label" tone="muted" style={styles.label}>
          {t('rules.edit.apps')}
        </Text>
        <View style={styles.card}>
          {count > 0 && draft.apps ? (
            <AppTileRow
              apps={selectionTiles({ id: 'draft', apps: draft.apps })}
              total={count}
              max={6}
              size="xl"
            />
          ) : null}
          <View style={[styles.appsLine, count > 0 && styles.appsLineSpaced]}>
            <Text variant="label" tone={problems.includes('noApps') ? 'warning' : 'muted'}>
              {count > 0 ? t('rules.edit.appsCount', { count }) : t('rules.edit.noApps')}
            </Text>
            <PressableScale
              testID="rule.choose"
              accessibilityRole="button"
              accessibilityLabel={t('rules.edit.choose')}
              disabled={isPicking}
              hitSlop={space.md}
              onPress={() => void handleChoose()}>
              <Text variant="label.strong" tone="accent">
                {isPicking ? t('common.loading') : t('rules.edit.choose')}
              </Text>
            </PressableScale>
          </View>
        </View>

        <Text variant="label" tone="muted" style={styles.label}>
          {t('rules.edit.when')}
        </Text>
        <View style={styles.card}>
          <View style={styles.days}>
            {WEEK_ORDER.map((day) => {
              const isOn = draft.days.includes(day);
              return (
                <PressableScale
                  key={day}
                  testID={`rule.day.${day}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={t(`rules.weekday.${day}`)}
                  onPress={() => toggleDay(day)}
                  style={[styles.day, isOn ? styles.dayOn : styles.dayOff]}>
                  <Text variant="label.strong" tone={isOn ? 'onAccent' : 'primary'}>
                    {formatWeekdayInitial(day)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.times}>
            <TimePill
              testID="rule.from"
              label={t('rules.edit.from')}
              value={draft.start}
              onChange={(start) => patch({ start })}
            />
            <TimePill
              testID="rule.to"
              label={t('rules.edit.to')}
              value={draft.end}
              onChange={(end) => patch({ end })}
            />
          </View>
          {problems.includes('sameTimes') ? (
            <Text variant="meta" tone="warning" style={styles.problem}>
              {t('rules.edit.sameTimes')}
            </Text>
          ) : null}
          {problems.includes('noDays') ? (
            <Text variant="meta" tone="warning" style={styles.problem}>
              {t('rules.edit.noDays')}
            </Text>
          ) : null}
        </View>

        <Text variant="label" tone="muted" style={styles.label}>
          {t('rules.edit.strength')}
        </Text>
        <View style={styles.strengths}>
          {STRENGTH_ORDER.map((s) => (
            <StrengthOption
              key={s}
              testID={`rule.strength.${s}`}
              variant="row"
              strength={s}
              locked={STRENGTH_RULES[s].isProOnly}
              selected={draft.strength === s}
              onPress={() => pickStrength(s)}
            />
          ))}
        </View>
        {!isNew && !draft.isDefault ? (
          <View style={styles.delete}>
            <TextLink
              testID="rule.delete"
              label={t('rules.edit.delete')}
              tone="danger"
              onPress={() => {
                if (draft.id) removeRule(draft.id);
                close();
              }}
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="rule.save"
          label={t('rules.edit.saveRule')}
          icon="arrowRight"
          compact
          disabled={!canSave}
          onPress={handleSave}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.x,
    paddingTop: S.top,
  },
  content: { paddingHorizontal: S.x, paddingBottom: space.xxl },
  label: { marginTop: space.xl, marginBottom: space.sm, paddingHorizontal: S.labelX - S.x },
  card: {
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
  },
  appsLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appsLineSpaced: { marginTop: space.md },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: size.weekday,
    height: size.weekday,
    ...pill(size.weekday),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: color.accent.primary },
  dayOff: { backgroundColor: color.bg.raisedHigh },
  times: { flexDirection: 'row', gap: space.sm, marginTop: space.md + 2 },
  problem: { marginTop: space.sm },
  strengths: { gap: S.listGap },
  delete: { marginTop: space.xl },
  footer: {
    paddingHorizontal: S.x,
    paddingTop: space.sm,
    paddingBottom: layout.onboarding.footerBottom,
  },
});
