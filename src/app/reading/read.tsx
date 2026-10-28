import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { GameShell, ListeningBar, PrimaryButton, Text } from '@/design/components';
import { color, layout, space } from '@/design/tokens';
import { DevSkip } from '@/features/dev/DevSkip';
import {
  finishReading,
  type ReadingParams,
  readingParams,
  READING_LANG,
} from '@/features/reading/finish';
import {
  alignHeard,
  emptyProgress,
  heardWords,
  type PageProgress,
  pageDone,
  pagePassed,
  pageWords,
  saidCount,
} from '@/features/reading/match';
import { textById } from '@/features/reading/texts';
import { REPS } from '@/features/reps/catalog';
import { useRepsStore } from '@/features/reps/repsStore';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { type Listening, listen } from '@/native/speech';

const NEXT_PAGE_MS = 600;
/** Reading silently: the next page unlocks after a reading pace, not instantly. */
const SILENT_MS_PER_WORD = 180;
const BENIGN_ERRORS = new Set(['no-speech', 'speech-timeout', 'aborted', 'client']);

/**
 * OvReading · read aloud, page by page. Each word lights up as it's heard (on-device speech);
 * skipped words stay grey. A page passes at ≥ 80 % of its words. Silent mode (mic denied or no
 * offline speech) shows a "Next page" button instead and counts as Your word.
 */
export default function ReadingRead() {
  const t = useT();
  const params = useLocalSearchParams<{ text?: string; challenge?: string; mode?: string }>();
  const text = textById(params.text);
  const flow: ReadingParams = {
    ...(params.text ? { text: params.text } : {}),
    ...(params.challenge ? { challenge: params.challenge } : {}),
    mode: params.mode === 'silent' ? 'silent' : 'aloud',
  };
  const isSilent = flow.mode === 'silent';
  const [startedAt] = useState(() => {
    if (!flow.challenge) useRepsStore.getState().start('read');
    return Date.now();
  });
  const [page, setPage] = useState(0);
  const words = text ? pageWords(text.pages[page]!) : [];
  const [progress, setProgress] = useState<PageProgress>(() => emptyProgress(words));
  const [isListening, setIsListening] = useState(!isSilent);
  const [retryNote, setRetryNote] = useState<number | null>(null);
  const [silentReady, setSilentReady] = useState(false);
  /** Bumped when a page is read again, so the recogniser starts a fresh transcript. */
  const [pass, setPass] = useState(0);
  const level = useSharedValue(0);
  /** Progress when the current recogniser segment began (interim results re-align from here). */
  const segmentStart = useRef<PageProgress>(progress);
  const latest = useRef<PageProgress>(progress);

  const points = REPS.read.points;
  const pageCount = text?.pages.length ?? 0;

  const nextPage = () => {
    if (!text) return;
    if (page + 1 >= pageCount) {
      if (isSilent) finishReading(flow, startedAt);
      else router.replace({ pathname: '/reading/summary', params: readingParams(flow) });
      return;
    }
    const nextWords = pageWords(text.pages[page + 1]!);
    const fresh = emptyProgress(nextWords);
    segmentStart.current = fresh;
    latest.current = fresh;
    setProgress(fresh);
    setRetryNote(null);
    setSilentReady(false);
    setPage(page + 1);
  };

  /** New words heard: a finished page below 80 % is read again from the top. */
  const applyProgress = (next: PageProgress) => {
    latest.current = next;
    setProgress(next);
    if (!pageDone(next)) return;
    if (pagePassed(next)) {
      haptics.success();
      return;
    }
    haptics.warning();
    setRetryNote(Math.round((saidCount(next) / next.states.length) * 100));
    const fresh = emptyProgress(words);
    segmentStart.current = fresh;
    latest.current = fresh;
    setProgress(fresh);
    setPass((p) => p + 1);
  };

  // A passed page moves on after a beat.
  useEffect(() => {
    if (isSilent || !pageDone(progress) || !pagePassed(progress)) return;
    const id = setTimeout(nextPage, NEXT_PAGE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per progress change only
  }, [progress, isSilent]);

  // The recogniser: restarted when it stops by itself while we're still listening.
  useEffect(() => {
    if (isSilent || !isListening || !text) return;
    let session: Listening | null = null;
    let cancelled = false;
    const begin = async () => {
      segmentStart.current = latest.current;
      session = await listen(
        READING_LANG,
        {
          onResult: (transcript, isFinal) => {
            const next = alignHeard(words, segmentStart.current, heardWords(transcript));
            if (isFinal) segmentStart.current = next;
            applyProgress(next);
          },
          onVolume: (v) => level.set(v),
          onEnd: () => {
            if (!cancelled) void begin();
          },
          onError: (code) => {
            if (BENIGN_ERRORS.has(code)) return;
            cancelled = true;
            router.replace({
              pathname: '/reading/mic',
              params: { ...readingParams(flow), reason: 'unavailable' },
            });
          },
        },
        text.pages[page],
      );
      if (cancelled) session.stop();
    };
    void begin();
    return () => {
      cancelled = true;
      session?.stop();
      level.set(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one session per page / listening toggle
  }, [isSilent, isListening, page, pass, text]);

  // Silent mode: unlock "Next page" after a reading pace.
  useEffect(() => {
    if (!isSilent) return;
    const id = setTimeout(() => setSilentReady(true), words.length * SILENT_MS_PER_WORD);
    return () => clearTimeout(id);
  }, [isSilent, page, words.length]);

  if (!text) return <Redirect href="/challenges" />;

  return (
    <>
      <GameShell
        testID="reading.read"
        title={t('reading.read.page', { page: page + 1, total: pageCount })}
        right={{ kind: 'points', value: points }}
        closeKind="quit"
        onClose={() => router.back()}
        progress={{ total: pageCount, done: page, color: color.read }}
        footer={
          <>
            {isSilent ? (
              <PrimaryButton
                testID="reading.next"
                label={page + 1 >= pageCount ? t('reading.read.finish') : t('reading.read.next')}
                disabled={!silentReady}
                onPress={nextPage}
              />
            ) : (
              <ListeningBar
                testID="reading.listening"
                title={isListening ? t('reading.listening.title') : t('reading.listening.paused')}
                sub={t('reading.listening.words', {
                  said: saidCount(progress),
                  total: words.length,
                })}
                level={level}
                active={isListening}
                onMicPress={() => setIsListening(!isListening)}
              />
            )}
            <Text variant="meta" tone="muted" align="center">
              {isSilent ? t('reading.read.silentNote') : t('reading.read.note')}
            </Text>
          </>
        }>
        <ScrollView contentContainerStyle={styles.content}>
          {retryNote !== null ? (
            <Text
              variant="body.l"
              tone="warning"
              style={styles.retry}
              accessibilityLiveRegion="polite">
              {t('reading.read.retry', { percent: retryNote })}
            </Text>
          ) : null}
          <Text variant="reading" accessibilityLabel={text.pages[page]}>
            {words.map((w, i) => (
              <Text
                key={i}
                variant="reading"
                style={
                  isSilent || progress.states[i] === 'said'
                    ? styles.said
                    : progress.states[i] === 'skipped'
                      ? styles.skipped
                      : styles.pending
                }>
                {`${w.display}${w.display.endsWith('-') ? '' : ' '}`}
              </Text>
            ))}
          </Text>
        </ScrollView>
      </GameShell>
      <DevSkip
        label="DEV · Pass page"
        onSkip={() =>
          isSilent
            ? nextPage()
            : applyProgress({ states: words.map(() => 'said'), cursor: words.length })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.onboarding.titleX,
    paddingTop: space.xl,
    paddingBottom: space.xl,
  },
  retry: { marginBottom: space.lg },
  said: { color: color.text.primary },
  skipped: { color: color.reading.unsure },
  pending: { color: color.reading.pending },
});
