import { makeImageFromView } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { type HostInstance, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, PressableScale, Text } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { useChallengesStore } from '@/features/challenges/store';
import { useFocusStore } from '@/features/focus/store';
import {
  barcode,
  buildReceipt,
  EVENING_HOUR,
  type ReceiptData,
  receiptDuration,
  workdays,
} from '@/features/receipt/model';
import { hashSeed } from '@/features/reps/rng';
import { useT } from '@/i18n';
import { addDays, dayKey, dayStart } from '@/lib/time';
import { blocking } from '@/services/blocking';
import { ledgerForDay } from '@/storage/ledgerRepo';

const WEEK_DAYS = 7;

/**
 * FReceipt · today's receipt on paper, in mono. Android renders the view to a PNG for Share
 * (Skia snapshot, no extra dependency). Before 18:00 it reads "So far today".
 */
export default function Receipt() {
  const t = useT();
  const ref = useRef<HostInstance>(null);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    const today = dayKey(now);
    const days = (from: number) =>
      Array.from({ length: WEEK_DAYS }, (_, i) => addDays(today, -(from + i)));
    void Promise.all([
      blocking.getUsageSummary(today),
      Promise.all(days(0).map((d) => blocking.getUsageSummary(d))),
      Promise.all(days(WEEK_DAYS).map((d) => blocking.getUsageSummary(d))),
      blocking.getShieldEvents(dayStart(today)),
    ]).then(([usage, week, lastWeek, events]) => {
      if (!alive) return;
      const draw = useChallengesStore.getState().draw;
      const focus = useFocusStore
        .getState()
        .history.filter((s) => !s.isTimerOnly && dayKey(s.endedAt) === today);
      setData(
        buildReceipt({
          at: now,
          today: usage,
          week,
          lastWeek,
          events,
          focusMinutesToday: focus.reduce((n, s) => n + s.minutes, 0),
          challengesDone: draw?.day === today ? draw.done.length : 0,
          challengesTotal: draw?.cards.length ?? 3,
          pointsToday: ledgerForDay(today).reduce((n, e) => n + Math.max(0, e.points), 0),
        }),
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const share = async () => {
    if (!ref.current) return;
    setIsSharing(true);
    try {
      // Skia types the ref as a class component; a host view instance is what it actually reads.
      const image = await makeImageFromView(ref as unknown as RefObject<number>);
      const base64 = image?.encodeToBase64();
      if (!base64) return;
      const file = new File(Paths.cache, `untangle-receipt-${dayKey()}.png`);
      if (file.exists) file.delete();
      file.write(base64, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/png',
        dialogTitle: t('receipt.share'),
      });
    } catch {
      // Share sheet dismissed or snapshot failed: nothing to do.
    } finally {
      setIsSharing(false);
    }
  };

  const isEvening = new Date(data?.at ?? 0).getHours() >= EVENING_HOUR;
  const date = data ? new Date(data.at) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
        />
        <Text variant="title.l" accessibilityRole="header" style={styles.title}>
          {isEvening ? t('receipt.title') : t('receipt.titleSoFar')}
        </Text>
        <PressableScale
          testID="receipt.share"
          accessibilityRole="button"
          disabled={!data || isSharing}
          onPress={() => void share()}
          style={styles.share}>
          <Text variant="body.strong">{t('receipt.share')}</Text>
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {data && date ? (
          <View
            ref={ref}
            collapsable={false}
            style={styles.paper}
            accessible
            accessibilityLabel={t('receipt.a11y')}>
            <Text variant="receipt" tone="ink" align="center" style={styles.brand}>
              {t('receipt.brand')}
            </Text>
            <Text variant="receipt.small" tone="ink" align="center">
              {`${date
                .toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                .replace(/,/g, '')
                .toUpperCase()} · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
            </Text>
            <Rule />
            {data.screenTimeMinutes !== null ? (
              <Line
                label={t('receipt.screenTime')}
                value={receiptDuration(data.screenTimeMinutes)}
              />
            ) : null}
            <Line label={t('receipt.opens')} value={String(data.opens)} />
            <Line label={t('receipt.resisted')} value={String(data.resisted)} />
            <Line label={t('receipt.offline')} value={receiptDuration(data.offlineMinutes)} />
            {data.weekMinutes !== null ? (
              <>
                <Rule />
                <Line label={t('receipt.week')} value={receiptDuration(data.weekMinutes)} bold />
                <Line label={t('receipt.workdays', { n: workdays(data.weekMinutes) })} value="" />
                {data.lastWeekMinutes !== null ? (
                  <Line
                    label={t('receipt.vsLast')}
                    value={receiptDuration(data.weekMinutes - data.lastWeekMinutes)}
                    bold
                  />
                ) : null}
              </>
            ) : null}
            <Rule />
            <Text variant="receipt.small" tone="ink" align="center">
              {t('receipt.challenges', {
                done: data.challengesDone,
                total: data.challengesTotal,
                points: data.pointsToday,
              })}
            </Text>
            <Text variant="receipt.small" tone="ink" align="center" style={styles.thanks}>
              {t('receipt.thanks')}
            </Text>
            <View
              style={styles.barcode}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              {barcode(hashSeed(dayKey(data.at))).map((w, i) => (
                <View key={i} style={[styles.bar, { width: w }]} />
              ))}
            </View>
          </View>
        ) : null}
        {Platform.OS === 'ios' ? (
          <Text variant="meta" tone="muted" align="center" style={styles.note}>
            {t('receipt.iosNote')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.line}>
      <Text variant="receipt" tone="ink" style={bold && styles.bold}>
        {label}
      </Text>
      <Text variant="receipt" tone="ink" style={bold && styles.bold}>
        {value}
      </Text>
    </View>
  );
}

function Rule() {
  return <View style={styles.rule} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: layout.gutter,
    paddingTop: layout.screen.top,
  },
  title: { flex: 1 },
  share: {
    height: size.button - space.lg,
    ...pill(size.button - space.lg),
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    backgroundColor: color.bg.raised,
  },
  content: { paddingHorizontal: layout.gutter * 2.5, paddingVertical: space.xl },
  paper: {
    backgroundColor: color.paper,
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    gap: space.sm,
  },
  brand: { fontWeight: '700', letterSpacing: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontWeight: '700' },
  rule: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.ink,
    marginVertical: space.sm,
  },
  thanks: { marginTop: space.xs },
  barcode: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: space.huge,
    marginTop: space.md,
  },
  bar: { height: '100%', backgroundColor: color.ink },
  note: { marginTop: space.xl },
});
