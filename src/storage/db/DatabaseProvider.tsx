import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/design/components';
import { color, space } from '@/design/tokens';

import migrations from '../../../drizzle/migrations';
import { db } from './client';

/** Applies pending drizzle migrations before rendering the app. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    // Developer-facing: only reachable when a migration is broken.
    return (
      <View style={styles.center}>
        <Text variant="headline">SQLite migration failed</Text>
        <Text variant="meta" tone="muted">
          {error.message}
        </Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.accent.primary} />
      </View>
    );
  }
  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: color.bg.canvas,
    padding: space.xl,
  },
});
