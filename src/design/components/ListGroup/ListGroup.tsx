import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, rounded, size, space } from '../../tokens';
import { Text } from '../Text';

export type ListGroupProps = { header?: string; footer?: string; children: ReactNode };

/** Inset grouped list: 0.5 pt hairlines between rows, never after the last (SPEC §3). */
export function ListGroup({ header, footer, children }: ListGroupProps) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.wrap}>
      {header ? (
        <Text variant="meta" tone="muted" style={styles.inset}>
          {header.toUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.group, rounded(radius.m)]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.separator} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="meta" tone="muted" style={styles.inset}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, leading, trailing, onPress }: ListRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {leading}
      <View style={styles.texts}>
        <Text variant="body">{title}</Text>
        {subtitle ? (
          <Text variant="meta" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  inset: { paddingHorizontal: space.lg },
  group: { backgroundColor: color.bg.raised, overflow: 'hidden' },
  separator: {
    height: size.hairline,
    backgroundColor: color.border.hairline,
    marginLeft: space.lg,
  },
  row: {
    minHeight: size.listRow,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  pressed: { backgroundColor: color.bg.raisedHigh },
  texts: { flex: 1 },
});
