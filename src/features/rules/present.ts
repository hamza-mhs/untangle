import type { AppTileApp } from '@/design/components';
import { t } from '@/i18n';
import { formatRuleTime, formatWeekday } from '@/lib/format';

import { appCount, type Rule } from './model';
import { daysKind, WEEK_ORDER } from './rules';

/** "Every day · 23:00 – 07:00", "Mon – Fri · until 12:00", "Mon, Wed · 09:00 – 17:00". */
export function scheduleLine(rule: Pick<Rule, 'schedule'>): string {
  const { days, start, end } = rule.schedule;
  const kind = daysKind(days);
  const dayLabel =
    kind === 'custom'
      ? WEEK_ORDER.filter((d) => days.includes(d))
          .map((d) => formatWeekday(new Date(2023, 0, 1 + d)))
          .join(', ')
      : t(`rules.days.${kind}`);
  // Morning rules that start at midnight read as "until 12:00".
  const range =
    start === '00:00'
      ? t('rules.until', { time: formatRuleTime(end) })
      : t('rules.range', { start: formatRuleTime(start), end: formatRuleTime(end) });
  return `${dayLabel} · ${range}`;
}

/**
 * Tiles for a selection. iOS selections are opaque (no names or icons in JS), so these are
 * placeholders sized to the count; Phase 5 swaps in native `Label(token)` views.
 */
export function selectionTiles(
  rule: Pick<Rule, 'apps' | 'id'>,
  names?: Map<string, string>,
): AppTileApp[] {
  if (rule.apps.platform === 'android') {
    return rule.apps.packages.map((p) => {
      const name = names?.get(p);
      return {
        id: p,
        initials: initialsOf(name ?? p.split('.').pop() ?? p),
        ...(name ? { name } : {}),
      };
    });
  }
  return Array.from({ length: appCount(rule.apps) }, (_, i) => ({
    id: `${rule.id}-${i}`,
    initials: '',
  }));
}

export function initialsOf(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/);
  const first = words[0] ?? '';
  return (words.length > 1 ? first[0]! + words[1]![0]! : first.slice(0, 2)).toUpperCase();
}
