import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useT } from '@/i18n';

import { layout, space } from '../../tokens';
import { Card } from '../Card';
import { Screen } from '../Screen';
import { Text } from '../Text';

export type StubScreenProps = {
  /** Key under `stub.*` in en.json (title + note). */
  id: string;
  children?: ReactNode;
};

/** Scaffolding placeholder for routes whose design hasn't been built yet. */
export function StubScreen({ id, children }: StubScreenProps) {
  const t = useT();
  return (
    <Screen edges={['top', 'left', 'right']} contentStyle={styles.content}>
      <Text variant="title.l" accessibilityRole="header">
        {t(`stub.${id}.title`)}
      </Text>
      <Card>
        <Text variant="meta.strong" tone="accent">
          {t('common.stub')}
        </Text>
        <Text variant="body" tone="muted">
          {t(`stub.${id}.note`)}
        </Text>
      </Card>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.gutter + space.xs, gap: space.xl, paddingBottom: space.huge * 3 },
});
