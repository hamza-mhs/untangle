import { StyleSheet, View } from 'react-native';

import type { IconName } from '../../icons';
import { color, radius, space } from '../../tokens';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** No locks yet, no history yet: icon, title, body and one action. */
export function EmptyState({ icon, title, body, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View testID={testID} style={styles.root}>
      <View style={styles.icon}>
        <Icon name={icon} size={space['2xl']} color={color.text.primary} />
      </View>
      <Text variant="heading" align="center" accessibilityRole="header">
        {title}
      </Text>
      {body ? (
        <Text variant="body" tone="secondary" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.sm, paddingVertical: space['3xl'], paddingHorizontal: space.xl },
  icon: {
    width: space['4xl'] + space.sm,
    height: space['4xl'] + space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  action: { alignSelf: 'stretch', marginTop: space.lg },
});
