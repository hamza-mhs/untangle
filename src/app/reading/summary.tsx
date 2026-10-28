import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { GameShell, Icon, ListeningBar, PrimaryButton, Text } from '@/design/components';
import { color, layout, pill, size, space } from '@/design/tokens';
import { DevSkip } from '@/features/dev/DevSkip';
import { finishReading, type ReadingParams, READING_LANG } from '@/features/reading/finish';
import { keyIdeasHit } from '@/features/reading/match';
import { textById } from '@/features/reading/texts';
import { REPS } from '@/features/reps/catalog';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { type Listening, listen } from '@/native/speech';

const SUMMARY_MS = 30_000;
const TICK_MS = 250;
const DONE_MS = 1200;
/** The last few words of the live transcript are still settling: shown grey. */
const SETTLING_WORDS = 3;

/**
 * OxSummary · "Say it in your words": a 30-second spoken summary after the last page. Key ideas
 * are matched by on-device keyword overlap. Finding none never fails the reading: we finish
 * with the reading points and show what we were listening for.
 */
export default function ReadingSummary() {
  const t = useT();
  const params = useLocalSearchParams<{ text?: string; challenge?: string }>();
  const text = textById(params.text);
  const flow: ReadingParams = {
    ...(params.text ? { text: params.text } : {}),
    ...(params.challenge ? { challenge: params.challenge } : {}),
    mode: 'aloud',
  };
  const [startedAt] = useState(() => Date.now());
  const [left, setLeft] = useState(SUMMARY_MS);
  const [committed, setCommitted] = useState('');
  const [interim, setInterim] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const level = useSharedValue(0);
  const committedRef = useRef('');
  const transcript = `${committed} ${interim}`.trim();
  const hits = text ? keyIdeasHit(transcript, text.keyIdeas) : [];
  const hitCount = hits.filter(Boolean).length;
  /** 30 s, or every key idea found. */
  const ended = timedOut || (text !== undefined && hitCount === text.keyIdeas.length);

  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => {
      const remaining = SUMMARY_MS - (Date.now() - startedAt);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) setTimedOut(true);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ended, startedAt]);

  // Found something: finish on its own. Found nothing: show the ideas and let them continue.
  useEffect(() => {
    if (!ended || hitCount === 0) return;
    haptics.success();
    const id = setTimeout(() => finishReading(flow, startedAt), DONE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once when the summary ends
  }, [ended]);

  useEffect(() => {
    if (ended || !text) return;
    let session: Listening | null = null;
    let cancelled = false;
    const begin = async () => {
      session = await listen(
        READING_LANG,
        {
          onResult: (said, isFinal) => {
            if (isFinal) {
              committedRef.current = `${committedRef.current} ${said}`.trim();
              setCommitted(committedRef.current);
              setInterim('');
            } else setInterim(said);
          },
          onVolume: (v) => level.set(v),
          onEnd: () => {
            if (!cancelled) void begin();
          },
          onError: () => {},
        },
        text.keyIdeas.map((k) => k.label).join(' '),
      );
      if (cancelled) session.stop();
    };
    void begin();
    return () => {
      cancelled = true;
      session?.stop();
      level.set(0);
    };
  }, [ended, text, level]);

  if (!text) return <Redirect href="/challenges" />;

  const words = transcript.split(/\s+/).filter(Boolean);
  const settled = words.slice(0, Math.max(0, words.length - SETTLING_WORDS)).join(' ');
  const settling = words.slice(Math.max(0, words.length - SETTLING_WORDS)).join(' ');
  const missedAll = ended && hitCount === 0;

  return (
    <>
      <GameShell
        testID="reading.summary"
        title={t('reading.summary.title')}
        right={{ kind: 'points', value: REPS.read.points }}
        closeKind="close"
        onClose={() => finishReading(flow, startedAt)}
        footer={
          <>
            {missedAll ? (
              <PrimaryButton
                testID="reading.summary.continue"
                label={t('common.continue')}
                onPress={() => finishReading(flow, startedAt)}
              />
            ) : (
              <ListeningBar
                title={t('reading.summary.left', { seconds: Math.ceil(left / 1000) })}
                sub={t('reading.listening.title')}
                level={level}
                active={!ended}
              />
            )}
            <Text variant="meta" tone="muted" align="center">
              {t('reading.summary.note')}
            </Text>
          </>
        }>
        <View style={styles.content}>
          <Text variant="label" tone="muted">
            {t('reading.summary.after', { page: text.pages.length, seconds: SUMMARY_MS / 1000 })}
          </Text>
          <Text variant="title.l" accessibilityRole="header" style={styles.ask}>
            {missedAll ? t('reading.summary.missedTitle') : t('reading.summary.ask')}
          </Text>
          <Text variant="reading" style={styles.transcript} accessibilityLiveRegion="polite">
            {words.length > 0 ? '“' : ''}
            {settled}
            {settled && settling ? ' ' : ''}
            <Text variant="reading" tone="faint">
              {settling}
            </Text>
            {ended ? (
              ''
            ) : (
              <Text variant="reading" style={styles.caret}>
                |
              </Text>
            )}
          </Text>
          <View style={styles.ideasHead}>
            <Text variant="label" tone="muted">
              {t('reading.summary.ideas')}
            </Text>
            <Text variant="label" tone="muted">
              {t('reading.summary.ideasCount', { hit: hitCount, total: text.keyIdeas.length })}
            </Text>
          </View>
          <View style={styles.ideas}>
            {text.keyIdeas.map((idea, i) => (
              <View
                key={idea.label}
                style={[styles.idea, hits[i] ? styles.ideaHit : styles.ideaOpen]}>
                {hits[i] ? (
                  <Icon name="check" size={size.icon.sm} color={color.text.onAccent} />
                ) : null}
                <Text
                  variant="body.xl"
                  tone={hits[i] ? 'onAccent' : missedAll ? 'primary' : 'faint'}>
                  {idea.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </GameShell>
      <DevSkip label="DEV · Finish" onSkip={() => finishReading(flow, startedAt)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: layout.onboarding.titleX, paddingTop: space.lg },
  ask: { marginTop: space.sm },
  transcript: { marginTop: space.huge, minHeight: space.huge * 3 },
  caret: { color: color.read },
  ideasHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  ideas: { gap: space.sm, marginTop: space.sm, marginBottom: space.lg, alignItems: 'flex-start' },
  idea: {
    height: size.durationChip + space.md,
    ...pill(size.durationChip + space.md),
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  ideaHit: { backgroundColor: color.read },
  ideaOpen: {
    borderWidth: size.backButtonRing,
    borderStyle: 'dashed',
    borderColor: color.border.strong,
  },
});
