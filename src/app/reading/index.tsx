import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GameShell, Icon, PressableScale, Text } from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { challengeById } from '@/features/challenges/library';
import { POINTS } from '@/features/challenges/rules';
import { readingParams, READING_LANG } from '@/features/reading/finish';
import { GENRES, type Genre, minutesAloud, textsFor } from '@/features/reading/texts';
import { REPS } from '@/features/reps/catalog';
import { peekRound } from '@/features/reps/repsStore';
import { roundAccess } from '@/features/reps/rules';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { dayKey } from '@/lib/time';
import { prepareSpeech } from '@/native/speech';
import { createRng, hashSeed } from '@/features/reps/rng';

/**
 * OvChallengeDetail · read aloud. Pick a genre and today's public-domain text, then "Start
 * reading": the mic is asked for only now (it's on only on the next screen).
 */
export default function ReadingDetail() {
  const t = useT();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const def = challenge ? challengeById(challenge) : undefined;
  const [genre, setGenre] = useState<Genre>('stoic');
  const [offset, setOffset] = useState(() => createRng(hashSeed(dayKey())).int(0, 9));
  const [isStarting, setIsStarting] = useState(false);
  const pool = textsFor(genre);
  const text = pool[offset % pool.length]!;
  const isRep = !challenge;
  const repDone = isRep && roundAccess(peekRound('read')).kind === 'doneToday';
  const points = def ? POINTS[def.difficulty] : REPS.read.points;

  const start = async () => {
    if (repDone) return;
    setIsStarting(true);
    const availability = await prepareSpeech(READING_LANG);
    setIsStarting(false);
    const params = readingParams({ text: text.id, ...(challenge ? { challenge } : {}) });
    if (availability === 'ok') {
      router.push({ pathname: '/reading/read', params: { ...params, mode: 'aloud' } });
    } else {
      router.push({ pathname: '/reading/mic', params: { ...params, reason: availability } });
    }
  };

  return (
    <GameShell
      testID="reading.detail"
      title=""
      closeKind="back"
      right={{ kind: 'pill', label: t('reading.detail.points', { points }), bg: color.read }}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/challenges'))}
      footer={
        <>
          <Text variant="meta" tone="muted" align="center">
            {t('reading.detail.micNote')}
          </Text>
          <PressableScale
            testID="reading.start"
            accessibilityRole="button"
            accessibilityLabel={repDone ? t('reading.detail.doneToday') : t('reading.detail.start')}
            accessibilityState={{ disabled: repDone || isStarting, busy: isStarting }}
            disabled={repDone || isStarting}
            onPress={() => void start()}
            style={[styles.cta, repDone && styles.ctaOff]}>
            <Text variant="body.l" tone="onAccent">
              {repDone
                ? t('reading.detail.doneToday')
                : isStarting
                  ? t('common.loading')
                  : t('reading.detail.start')}
            </Text>
            {repDone ? null : <Icon name="mic" size={size.icon.lg} color={color.text.onAccent} />}
          </PressableScale>
        </>
      }>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title.l" accessibilityRole="header" style={styles.inset}>
          {t('reading.detail.title', { count: text.pages.length })}
        </Text>
        <Text variant="body.lead" tone="secondary" style={[styles.inset, styles.body]}>
          {t('reading.detail.body')}
        </Text>
        <Text variant="label" tone="muted" style={styles.label}>
          {t('reading.detail.genre')}
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {GENRES.map((g) => (
            <PressableScale
              key={g}
              testID={`reading.genre.${g}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: g === genre }}
              onPress={() => {
                haptics.select();
                setGenre(g);
              }}
              style={[styles.chip, g === genre && styles.chipOn]}>
              <Text variant="body.l" tone={g === genre ? 'onAccent' : 'primary'}>
                {t(`reading.genres.${g}`)}
              </Text>
            </PressableScale>
          ))}
        </View>
        <View style={styles.cardHead}>
          <Text variant="label" tone="muted">
            {t('reading.detail.today')}
          </Text>
          <Text variant="label" tone="muted">
            {t('reading.detail.publicDomain')}
          </Text>
        </View>
        <View style={styles.card}>
          <Text variant="meta.strong" tone="muted">
            {text.source}
          </Text>
          <Text variant="headline" style={styles.author}>
            {text.author}
          </Text>
          <Text variant="body.lead" tone="faint" numberOfLines={3} style={styles.excerpt}>
            {`${text.pages[0]}…`}
          </Text>
          <View style={styles.cardFoot}>
            <Text variant="label.strong" tone="muted" style={styles.flex}>
              {t('reading.detail.length', {
                minutes: minutesAloud(text),
                count: text.pages.length,
              })}
            </Text>
            {pool.length > 1 ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('reading.detail.another')}
                onPress={() => setOffset(offset + 1)}
                style={styles.another}>
                <Icon name="redraw" size={size.icon.sm} color={color.text.primary} />
                <Text variant="label.strong">{t('reading.detail.another')}</Text>
              </PressableScale>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.onboarding.optionsX - space.sm,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  inset: { paddingHorizontal: layout.onboarding.titleX - layout.onboarding.optionsX + space.sm },
  body: { marginTop: space.lg },
  label: {
    marginTop: space.xl,
    paddingHorizontal: layout.onboarding.subtitleX - layout.onboarding.optionsX + space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: {
    height: size.durationChip + space.sm,
    ...pill(size.durationChip + space.sm),
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    backgroundColor: color.bg.raised,
  },
  chipOn: { backgroundColor: color.read },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xl,
    paddingHorizontal: layout.onboarding.subtitleX - layout.onboarding.optionsX + space.sm,
  },
  card: {
    marginTop: space.sm,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    padding: space.xl,
  },
  author: { marginTop: space.xs },
  excerpt: { marginTop: space.sm },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  flex: { flex: 1 },
  another: {
    height: size.pillButton + space.xs,
    ...pill(size.pillButton + space.xs),
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.bg.raisedHigh,
  },
  cta: {
    height: size.button,
    ...pill(size.button),
    backgroundColor: color.read,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm + 2,
  },
  ctaOff: { backgroundColor: color.bg.raisedHigh },
});
