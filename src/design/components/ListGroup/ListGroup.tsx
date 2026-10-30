import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, radius, space } from '../../tokens';
import { Text } from '../Text';

export type ListGroupProps = { label?: string; children: ReactNode; testID?: string };

/** A card of rows with hairlines between them (never after the last), plus an optional micro label. */
export function ListGroup({ label, children, testID }: ListGroupProps) {
  const rows = Children.toArray(children);
  return (
    <View testID={testID} style={styles.wrap}>
      {label ? (
        <Text variant="micro" tone="tertiary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.group}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.sep} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { marginHorizontal: space.xs },
  group: {
    backgroundColor: color.surface.card,
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    overflow: 'hidden',
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.surface.line, marginLeft: 14 },
});
