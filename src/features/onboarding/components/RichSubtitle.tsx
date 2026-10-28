import { Text } from '@/design/components';

/**
 * Subtitle runs with white bold emphasis ("Tap **Continue** on the next pop-up"). Rendered
 * inside OnboardingScreen's subtitle <Text>, so the parts flow as one paragraph.
 */
export function RichSubtitle({ parts }: { parts: readonly (string | { strong: string })[] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <Text key={i} variant="body.lead.strong">
            {part.strong}
          </Text>
        ),
      )}
    </>
  );
}
