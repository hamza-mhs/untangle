import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ListGroup, ListRow, PressableScale, PrimaryButton, Text } from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { useChallengesStore } from '@/features/challenges/store';
import { appCount } from '@/features/rules/model';
import { isScheduleActive } from '@/features/rules/schedule';
import { useRulesStore } from '@/features/rules/store';
import { useSettingsStore } from '@/features/settings/store';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { dayKey, dayStart, parseClock } from '@/lib/time';
import { blocking, type ShieldEvent } from '@/services/blocking';

const FALLBACK_END = '07:00';
const OFF_MS = 700;
const LAMP = size.lamp;
const GLOW = LAMP * 2.6;
const WEEK = 7 * 24 * 60 * 60 * 1000;

/** The next time the clock reads `hhmm` (tonight's bedtime end, usually tomorrow morning). */
function nextAt(hhmm: string, now: number): number {
  const d = new Date(now);
  const minutes = parseClock(hhmm);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** "Bored · after 22:00": the commonest shield reason and the hour most opens happen after. */
function mostOpens(
  events: readonly ShieldEvent[],
): { reason: ShieldEvent['reason']; hour: number } | null {
  if (events.length === 0) return null;
  const reasons = new Map<string, number>();
  const hours = new Map<number, number>();
  for (const e of events) {
    if (e.reason) reasons.set(e.reason, (reasons.get(e.reason) ?? 0) + 1);
    const h = new Date(e.at).getHours();
    hours.set(h, (hours.get(h) ?? 0) + 1);
  }
  const top = <K,>(m: Map<K, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { reason: top(reasons) as ShieldEvent['reason'], hour: top(hours) ?? 22 };
}

/**
 * FLightsOut · tap the lamp (or the CTA) and the bedtime lock starts now, even if it's earlier
 * than scheduled; the lamp switches off as the animation. If bedtime is already on, the CTA is
 * "Good night" and just closes the app.
 */
export default function LightsOut() {
  const t = useT();
  const [now] = useState(() => Date.now());
  const bedtime = useRulesStore((s) => s.rules.find((r) => r.isDefault) ?? null);
  const drawTime = useSettingsStore((s) => s.drawTime);
  const lightsOutUntil = useSettingsStore((s) => s.lightsOutUntil);
  const draw = useChallengesStore((s) => s.draw);
  const [events, setEvents] = useState<ShieldEvent[]>([]);
  const [isOff, setIsOff] = useState(
    () =>
      (lightsOutUntil !== null && lightsOutUntil > now) ||
      (bedtime?.enabled === true && isScheduleActive(bedtime.schedule, new Date(now))),
  );
  const glow = useSharedValue(isOff ? 0 : 1);

  useEffect(() => {
    let alive = true;
    void blocking.getShieldEvents(now - WEEK).then((e) => alive && setEvents(e));
    return () => {
      alive = false;
    };
  }, [now]);

  const end = bedtime?.schedule.end ?? FALLBACK_END;
  const today = dayKey(now);
  const resisted = events.filter((e) => e.at >= dayStart(today) && e.outcome === 'closed').length;
  const top = mostOpens(events);
  const done = draw?.day === today ? draw.done.length : 0;

  const lightsOut = () => {
    if (isOff) {
      if (Platform.OS === 'android') BackHandler.exitApp();
      else router.back();
      return;
    }
    haptics.success();
    const endsAt = nextAt(end, Date.now());
    blocking.startFocus(endsAt, bedtime ? appCount(bedtime.apps) : 0);
    useSettingsStore.getState().setLightsOutUntil(endsAt);
    glow.set(withTiming(0, { duration: OFF_MS }));
    setIsOff(true);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <PressableScale
          testID="lightsOut.lamp"
          accessibilityRole="button"
          accessibilityLabel={isOff ? t('lightsOut.lampOff') : t('lightsOut.lampA11y')}
          onPress={lightsOut}
          style={styles.lamp}>
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
            <Svg width={GLOW} height={GLOW}>
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={color.accent.primary} stopOpacity={0.16} />
                  <Stop offset="1" stopColor={color.accent.primary} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#glow)" />
            </Svg>
          </Animated.View>
          <Svg width={LAMP} height={LAMP * 2.1} viewBox="0 0 150 315">
            <Path d="M28 30 L122 30 L105 15 L45 15 Z" fill={color.text.faint} />
            <Path
              d="M45 70 L105 70 L122 120 L28 120 Z"
              fill={isOff ? color.bg.raisedHigh : color.accent.primary}
            />
            <Rect x={71} y={120} width={8} height={95} fill={color.bg.raisedHigh} />
            <Rect x={74} y={128} width={2} height={50} fill={color.text.faint} />
            <Circle cx={75} cy={186} r={4} fill={color.text.muted} />
            <Rect x={45} y={210} width={60} height={10} rx={5} fill={color.bg.raisedHigh} />
          </Svg>
        </PressableScale>
        <Text variant="title.xl" align="center" accessibilityRole="header">
          {isOff ? t('lightsOut.goodNightTitle') : t('lightsOut.title')}
        </Text>
        <Text variant="body.xl.regular" tone="secondary" align="center" style={styles.body}>
          {isOff ? t('lightsOut.offBody', { time: end }) : t('lightsOut.body')}
        </Text>
        <View style={styles.list}>
          <ListGroup>
            <ListRow
              title={t('lightsOut.challenges')}
              trailing={<Value text={t('lightsOut.challengesValue', { done, total: 3 })} />}
            />
            <ListRow title={t('lightsOut.resisted')} trailing={<Value text={String(resisted)} />} />
            <ListRow
              title={t('lightsOut.mostOpens')}
              trailing={
                <Value
                  text={
                    top
                      ? top.reason
                        ? t('lightsOut.mostOpensValue', {
                            reason: t(`lightsOut.reasons.${top.reason}`),
                            time: `${String(top.hour).padStart(2, '0')}:00`,
                          })
                        : t('lightsOut.mostOpensHour', {
                            time: `${String(top.hour).padStart(2, '0')}:00`,
                          })
                      : t('lightsOut.none')
                  }
                />
              }
            />
            <ListRow title={t('lightsOut.draw')} trailing={<Value text={drawTime} />} />
          </ListGroup>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          testID="lightsOut.cta"
          label={isOff ? t('lightsOut.goodNight') : t('lightsOut.cta', { time: end })}
          onPress={lightsOut}
        />
        <PrimaryButton
          testID="lightsOut.receipt"
          label={t('lightsOut.receipt')}
          variant="ghost"
          onPress={() => router.push('/receipt')}
        />
      </View>
    </SafeAreaView>
  );
}

function Value({ text }: { text: string }) {
  return <Text variant="body.strong">{text}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  content: { flex: 1, paddingHorizontal: layout.onboarding.optionsX },
  lamp: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.huge,
    width: LAMP,
    height: LAMP * 2.1,
  },
  glow: { position: 'absolute', width: GLOW, height: GLOW },
  body: { marginTop: space.md, paddingHorizontal: space.lg },
  list: { marginTop: space.xxl },
  footer: {
    paddingHorizontal: layout.onboarding.optionsX,
    paddingBottom: layout.onboarding.footerBottom,
    gap: space.sm,
  },
});
