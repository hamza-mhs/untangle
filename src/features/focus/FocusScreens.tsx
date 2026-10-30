import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  ChoiceChip,
  Icon,
  PressableScale,
  Ring,
  Screen,
  Sheet,
  Text,
} from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useLocksStore, TargetIcon, targetKey, targetName, type Lock } from '@/features/locks';
import { detoursBetween } from '@/features/pause';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';

import {
  DEFAULT_FOCUS_MINUTES,
  FOCUS_DURATIONS,
  formatCountdown,
  isActive,
  minutesLeft,
  useFocusStore,
} from './session';

/** Start sheet (§7): duration chips, which locked targets, Start. */
export function FocusStartSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const locks = useLocksStore((s) => s.locks);
  const [minutes, setMinutes] = useState<number>(DEFAULT_FOCUS_MINUTES);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [choosing, setChoosing] = useState(false);
  const all = locks.map((l) => targetKey(l.target));
  const chosen = picked ?? all;
  const names = locks
    .filter((l) => chosen.includes(targetKey(l.target)))
    .map((l) => targetName(l.target));
  const list =
    names.length > 3
      ? t('focus.start.namesMore', { a: names[0], b: names[1], count: names.length - 2 })
      : names.join(', ');

  const start = async () => {
    const r = await useFocusStore.getState().start(minutes, chosen);
    onClose();
    if (r === 'alreadyRunning') showToast({ title: t('focus.start.already'), tone: 'neutral' });
    router.push('/focus');
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      testID="focus.start"
      title={t('focus.start.title')}
      body={chosen.length ? t('focus.start.body', { list }) : t('focus.start.bodyNone')}
      actions={
        <Button
          testID="focus.start.cta"
          label={t('focus.start.cta', { minutes })}
          disabled={!chosen.length}
          onPress={() => void start()}
        />
      }>
      <View style={styles.chips}>
        {FOCUS_DURATIONS.map((m) => (
          <ChoiceChip
            key={m}
            testID={`focus.start.${m}`}
            label={t('focus.start.minutes', { minutes: m })}
            selected={minutes === m}
            onPress={() => setMinutes(m)}
          />
        ))}
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('focus.start.apps', { count: chosen.length })}
        onPress={() => setChoosing((c) => !c)}
        style={styles.appsRow}>
        <Text variant="bodyStrong" style={styles.flex}>
          {t('focus.start.apps', { count: chosen.length })}
        </Text>
        <Icon
          name={choosing ? 'chevronDown' : 'chevronRight'}
          size={size.icon.sm}
          color={color.text.secondary}
        />
      </PressableScale>
      {choosing ? (
        <View style={styles.chips}>
          {locks.map((l) => {
            const k = targetKey(l.target);
            const on = chosen.includes(k);
            return (
              <ChoiceChip
                key={l.id}
                label={targetName(l.target)}
                selected={on}
                onPress={() => setPicked(on ? chosen.filter((x) => x !== k) : [...chosen, k])}
              />
            );
          })}
        </View>
      ) : null}
    </Sheet>
  );
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Running session (§7), the end-early sheet and the completion card. */
export function FocusScreen() {
  const t = useT();
  const session = useFocusStore((s) => s.session);
  const finished = useFocusStore((s) => s.finished);
  const locks = useLocksStore((s) => s.locks);
  const now = useNow();
  const [ending, setEnding] = useState(false);
  const active = isActive(session, now);

  // Ran out while open: record it and show the completion.
  useEffect(() => {
    if (session && !active) {
      void useFocusStore.getState().end(false, detoursBetween(session.startedAt, session.endAt));
    }
  }, [active, session]);

  const done = () => {
    useFocusStore.getState().clearFinished();
    if (router.canGoBack()) router.back();
    else router.replace('/block');
  };

  if (!session || !active) {
    if (!finished) {
      return (
        <Screen testID="focus.none" footer={<Button label={t('common.done')} onPress={done} />}>
          <View style={styles.center}>
            <Text variant="title">{t('focus.none')}</Text>
          </View>
        </Screen>
      );
    }
    return (
      <Screen
        testID="focus.complete"
        footer={<Button testID="focus.done" label={t('common.done')} onPress={done} />}>
        <View style={styles.center}>
          <Icon name="check" size={size.icon.lg} color={color.signal.success} />
          <Text variant="titleLg" align="center" accessibilityRole="header">
            {t(finished.endedEarly ? 'focus.complete.titleEarly' : 'focus.complete.title')}
          </Text>
          <Text variant="body" tone="body" align="center">
            {finished.detours === 0
              ? t('focus.complete.noDetours', { minutes: finished.minutes })
              : t('focus.complete.detours', { minutes: finished.minutes, count: finished.detours })}
          </Text>
        </View>
      </Screen>
    );
  }

  const targets: Lock[] = locks.filter((l) => session.targetKeys.includes(targetKey(l.target)));
  const left = session.endAt - now;
  const end = async () => {
    setEnding(false);
    await useFocusStore.getState().end(true, detoursBetween(session.startedAt, Date.now()));
  };

  return (
    <Screen
      testID="focus.running"
      footer={
        <Button
          testID="focus.endEarly"
          variant="ghost"
          label={t('focus.running.endEarly')}
          onPress={() => setEnding(true)}
        />
      }>
      <View style={styles.running}>
        <Ring
          progress={1 - left / session.plannedMs}
          size={RING}
          stroke={size.ring.stroke * 2}
          color={color.brand.violetLight}
          accessibilityLabel={t('focus.running.a11y', { minutes: minutesLeft(session, now) })}>
          <Text variant="statXl">{formatCountdown(left)}</Text>
          <Text variant="caption" tone="secondary">
            {t('focus.running.of', { minutes: Math.round(session.plannedMs / 60_000) })}
          </Text>
        </Ring>
        <View style={styles.icons}>
          {targets.slice(0, 6).map((l) => (
            <TargetIcon key={l.id} target={l.target} size={size.appIcon.sm} />
          ))}
        </View>
        <Card
          style={styles.stretch}
          onPress={() => router.push('/game/breathCount?source=browse')}
          accessibilityLabel={t('focus.running.breather')}>
          <View style={styles.cardRow}>
            <Icon name="wind" size={size.icon.md} color={color.text.primary} />
            <Text variant="body" style={styles.flex}>
              {t('focus.running.breather')}
            </Text>
            <Icon name="chevronRight" size={size.icon.sm} color={color.text.quiet} />
          </View>
        </Card>
      </View>
      <Sheet
        visible={ending}
        onClose={() => setEnding(false)}
        testID="focus.endSheet"
        title={t('focus.end.title')}
        body={t('focus.end.body')}
        actions={
          <>
            <Button
              label={t('focus.end.play')}
              onPress={() => {
                setEnding(false);
                router.push('/game/stackTower?source=browse');
              }}
            />
            <Button
              variant="secondary"
              label={t('focus.end.keep')}
              onPress={() => setEnding(false)}
            />
            <Button
              testID="focus.end.confirm"
              variant="danger"
              size="md"
              label={t('focus.end.end')}
              onPress={() => void end()}
            />
          </>
        }
      />
    </Screen>
  );
}

/** Block tab card: start, or the running session. */
export function FocusCard({ onStart }: { onStart: () => void }) {
  const t = useT();
  const session = useFocusStore((s) => s.session);
  const now = useNow(30_000);
  const running = isActive(session, now);
  return (
    <View style={styles.focusCard} testID="focus.card">
      <Text variant="title">{t('locks.tab.focusTitle')}</Text>
      <Text variant="body" tone="body">
        {running && session
          ? t('locks.tab.focusRunning', { minutes: minutesLeft(session, now) })
          : t('locks.tab.focusBody')}
      </Text>
      <Button
        testID="focus.card.cta"
        icon="bolt"
        label={running ? t('locks.tab.focusOpen') : t('locks.tab.focusCta')}
        onPress={running ? () => router.push('/focus') : onStart}
      />
    </View>
  );
}

const RING = 240;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  appsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.touch,
    marginTop: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface.control,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  running: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space['2xl'] },
  icons: { flexDirection: 'row', gap: space.sm },
  stretch: { alignSelf: 'stretch' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'stretch' },
  focusCard: {
    gap: space.md,
    padding: space.xl,
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: size.hairline,
    borderColor: color.brand.violetSoft,
  },
});
