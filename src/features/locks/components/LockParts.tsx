import { StyleSheet, View } from 'react-native';

import {
  ChoiceChip,
  Icon,
  PressableScale,
  RadioDot,
  Ring,
  Sheet,
  Stepper,
  Text,
  Toggle,
} from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { t, useT } from '@/i18n';
import type { TargetCounters } from '@/native';

import {
  clampMinutes,
  clampOpens,
  DEFAULT_MINUTES,
  OPEN_CHOICES,
  setMinutes,
  TIME_CHOICES,
  usedFraction,
  type AllowanceDraft,
  type LockStatus,
} from '../allowance';
import type { Lock, Strictness } from '../types';
import { TargetIcon, targetName } from './TargetIcon';

/** "30 min a day", "5 opens a day", "30 min · 5 opens", "Blocked all day". */
export function allowanceText(a: AllowanceDraft): string {
  if (a.dailyMinutes === 0) return t('locks.allowance.allDay');
  if (a.dailyMinutes !== null && a.dailyOpens !== null)
    return t('locks.allowance.both', { minutes: a.dailyMinutes, opens: a.dailyOpens });
  if (a.dailyMinutes !== null) return t('locks.allowance.minutes', { minutes: a.dailyMinutes });
  if (a.dailyOpens !== null) return t('locks.allowance.opens', { count: a.dailyOpens });
  return '';
}

/** Block tab status line for a row. */
export function statusText(s: LockStatus): string {
  switch (s.kind) {
    case 'off':
      return t('locks.status.off');
    case 'notInstalled':
      return t('locks.status.notInstalled');
    case 'allDay':
      return t('locks.status.allDay');
    case 'over':
      return t('locks.status.over');
    case 'allowed': {
      const parts: string[] = [];
      if (s.minutes !== null)
        parts.push(
          t('locks.status.used', { used: Math.min(s.usedMin, s.minutes), minutes: s.minutes }),
        );
      if (s.maxOpens !== null)
        parts.push(t('locks.status.opens', { opens: s.opens, max: s.maxOpens }));
      if (!parts.length) parts.push(t('locks.status.opensNoMax', { count: s.opens }));
      return parts.join(' · ');
    }
  }
}

export function LockRow({
  lock,
  status,
  counters,
  pausedByPlan,
  highlight,
  onPress,
  onToggle,
}: {
  lock: Lock;
  status: LockStatus;
  counters: TargetCounters | undefined;
  pausedByPlan: boolean;
  highlight: boolean;
  onPress: () => void;
  onToggle: (on: boolean) => void;
}) {
  const tr = useT();
  const name = targetName(lock.target);
  const line = pausedByPlan ? tr('locks.tab.pausedPlan') : statusText(status);
  const red = status.kind === 'over';
  const dim = status.kind === 'off' || status.kind === 'notInstalled' || pausedByPlan;
  return (
    <PressableScale
      testID={`locks.row.${lock.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${line}`}
      onPress={onPress}
      style={[styles.row, highlight ? styles.rowHighlight : null, dim ? styles.dim : null]}>
      <TargetIcon target={lock.target} size={size.appIcon.md} />
      <View style={styles.rowText}>
        <Text variant="bodyLg" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" tone={red ? 'danger' : 'secondary'} numberOfLines={2}>
          {line}
        </Text>
      </View>
      {status.kind === 'allowed' && !pausedByPlan ? (
        <Ring
          progress={usedFraction(lock, counters)}
          size={RING}
          stroke={3}
          color={color.signal.success}
        />
      ) : null}
      <Toggle
        testID={`locks.row.${lock.id}.toggle`}
        value={lock.enabled && !pausedByPlan}
        disabled={pausedByPlan}
        onChange={onToggle}
        accessibilityLabel={tr('locks.detail.lockOn')}
      />
    </PressableScale>
  );
}

type TimeChoice = (typeof TIME_CHOICES)[number] | 'custom' | 'none';
type OpenChoice = (typeof OPEN_CHOICES)[number] | 'custom' | 'none';

function timeChoiceOf(m: number | null): TimeChoice {
  if (m === null) return 'none';
  return (TIME_CHOICES as readonly number[]).includes(m) ? (m as TimeChoice) : 'custom';
}
function openChoiceOf(n: number | null): OpenChoice {
  if (n === null) return 'none';
  return (OPEN_CHOICES as readonly number[]).includes(n) ? (n as OpenChoice) : 'custom';
}

/** Step 3 "How much a day?" (§6.4): time chips, opens chips, custom steppers. */
export function AllowanceEditor({
  value,
  onChange,
}: {
  value: AllowanceDraft;
  onChange: (a: AllowanceDraft) => void;
}) {
  const tr = useT();
  const time = timeChoiceOf(value.dailyMinutes);
  const opens = openChoiceOf(value.dailyOpens);
  const timeLabel = (c: TimeChoice) =>
    c === 0
      ? tr('locks.flow.chipAllDay')
      : c === 60
        ? tr('locks.flow.chipHour')
        : c === 'custom'
          ? tr('locks.flow.chipCustom')
          : c === 'none'
            ? tr('locks.flow.chipNoTime')
            : tr('locks.flow.chipMinutes', { minutes: c });
  return (
    <View style={styles.editor}>
      <Text variant="micro" tone="secondary">
        {tr('locks.flow.time')}
      </Text>
      <View style={styles.chips}>
        {([...TIME_CHOICES, 'custom', 'none'] as TimeChoice[]).map((c) => (
          <ChoiceChip
            key={String(c)}
            testID={`locks.allowance.time.${c}`}
            label={timeLabel(c)}
            selected={time === c}
            onPress={() =>
              onChange(
                c === 'custom'
                  ? setMinutes(
                      value,
                      value.dailyMinutes && value.dailyMinutes > 0
                        ? clampMinutes(value.dailyMinutes)
                        : DEFAULT_MINUTES + 5,
                    )
                  : setMinutes(value, c === 'none' ? null : c),
              )
            }
          />
        ))}
      </View>
      {time === 'custom' && value.dailyMinutes !== null ? (
        <View style={styles.stepRow}>
          <Text variant="body" style={styles.flex}>
            {tr('locks.flow.customMinutes')}
          </Text>
          <Stepper
            value={value.dailyMinutes}
            min={5}
            max={240}
            onChange={(m) => onChange({ ...value, dailyMinutes: clampMinutes(m) })}
            accessibilityLabel={tr('locks.flow.customMinutes')}
          />
        </View>
      ) : null}
      {value.dailyMinutes === 0 ? null : (
        <>
          <Text variant="micro" tone="secondary" style={styles.section}>
            {tr('locks.flow.opens')}
          </Text>
          <View style={styles.chips}>
            {(['none', ...OPEN_CHOICES, 'custom'] as OpenChoice[]).map((c) => (
              <ChoiceChip
                key={String(c)}
                testID={`locks.allowance.opens.${c}`}
                label={
                  c === 'none'
                    ? tr('locks.flow.chipNoLimit')
                    : c === 'custom'
                      ? tr('locks.flow.chipCustom')
                      : String(c)
                }
                selected={opens === c}
                onPress={() =>
                  onChange({
                    ...value,
                    dailyOpens:
                      c === 'none' ? null : c === 'custom' ? clampOpens(value.dailyOpens ?? 2) : c,
                  })
                }
              />
            ))}
          </View>
          {opens === 'custom' && value.dailyOpens !== null ? (
            <View style={styles.stepRow}>
              <Text variant="body" style={styles.flex}>
                {tr('locks.flow.customOpens')}
              </Text>
              <Stepper
                value={value.dailyOpens}
                min={1}
                max={50}
                onChange={(n) => onChange({ ...value, dailyOpens: clampOpens(n) })}
                accessibilityLabel={tr('locks.flow.customOpens')}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export const STRICTNESS: readonly Strictness[] = ['gentle', 'firm', 'locked'];

export function StrictnessSheet({
  visible,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: Strictness;
  onPick: (s: Strictness) => void;
  onClose: () => void;
}) {
  const tr = useT();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr('locks.strictness.title')}
      testID="locks.strictness">
      <View style={styles.options}>
        {STRICTNESS.map((s) => (
          <PressableScale
            key={s}
            testID={`locks.strictness.${s}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === s }}
            accessibilityLabel={`${tr(`locks.strictness.${s}`)}, ${tr(`locks.strictness.${s}Sub`)}`}
            onPress={() => onPick(s)}
            style={styles.option}>
            <RadioDot selected={value === s} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{tr(`locks.strictness.${s}`)}</Text>
              <Text variant="caption" tone="secondary">
                {tr(`locks.strictness.${s}Sub`)}
              </Text>
            </View>
          </PressableScale>
        ))}
      </View>
    </Sheet>
  );
}

/** "Your locks" mini row on Home (icon + minutes + ring). */
export function LockChip({
  lock,
  counters,
  blocked,
}: {
  lock: Lock;
  counters: TargetCounters | undefined;
  blocked: boolean;
}) {
  return (
    <View style={styles.chip} accessible accessibilityLabel={targetName(lock.target)}>
      <Ring
        progress={usedFraction(lock, counters)}
        size={CHIP_RING}
        stroke={3}
        color={blocked ? color.signal.danger : color.signal.success}>
        <TargetIcon target={lock.target} size={size.appIcon.sm} />
      </Ring>
      {blocked ? (
        <View style={styles.badge}>
          <Icon name="lock" size={size.icon.xs} color={color.text.primary} />
        </View>
      ) : null}
      <Text variant="caption" tone="secondary">
        {Math.floor((counters?.usedMs ?? 0) / 60_000)}m
      </Text>
    </View>
  );
}

const RING = 26;
const CHIP_RING = 48;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.listRow + space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: color.surface.card,
    borderWidth: size.hairline,
    borderColor: color.surface.line,
  },
  rowHighlight: { borderColor: color.signal.success },
  dim: { opacity: 0.55 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  editor: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { marginTop: space.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
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
  chip: { alignItems: 'center', gap: space.xs },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: space.lg,
    height: space.lg,
    borderRadius: radius.pill,
    backgroundColor: color.signal.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
