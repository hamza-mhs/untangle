import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { PrimaryButton, Sheet } from '@/design/components';
import { readingParams } from '@/features/reading/finish';
import { useT } from '@/i18n';

/**
 * Mic denied / on-device speech unavailable (pack 2 EDGE_CASES). Never falls back to server
 * recognition. "Read silently instead" counts as Your word (capped points).
 */
export default function ReadingMic() {
  const t = useT();
  const { reason, text, challenge } = useLocalSearchParams<{
    reason?: string;
    text?: string;
    challenge?: string;
  }>();
  const isDenied = reason === 'denied';
  const silent = () =>
    router.replace({
      pathname: '/reading/read',
      params: readingParams({
        ...(text ? { text } : {}),
        ...(challenge ? { challenge } : {}),
        mode: 'silent',
      }),
    });
  return (
    <Sheet
      testID="reading.mic"
      title={t('reading.mic.title')}
      body={t(isDenied ? 'reading.mic.bodyDenied' : 'reading.mic.bodyUnavailable')}
      actions={
        <>
          {isDenied ? (
            <PrimaryButton
              testID="reading.mic.settings"
              label={t('reading.mic.settings')}
              compact
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          <PrimaryButton
            testID="reading.mic.silent"
            label={t('reading.mic.silent')}
            variant={isDenied ? 'outline' : 'accent'}
            compact
            onPress={silent}
          />
        </>
      }
    />
  );
}
