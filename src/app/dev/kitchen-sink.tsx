import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Card,
  ChoiceChip,
  ChoiceRow,
  Icon,
  ListGroup,
  ListRow,
  OnboardingHeader,
  PrimaryButton,
  Screen,
  Text,
  type IconName,
} from '@/design/components';
import { color, layout, space, typeScale, type TypeVariant } from '@/design/tokens';

const ICON_NAMES: IconName[] = [
  'chevronLeft',
  'chevronRight',
  'arrowRight',
  'check',
  'bellOff',
  'lock',
  'flame',
];

/** Hidden dev route (/dev/kitchen-sink): every shared component in its states. Dev text only. */
export default function KitchenSink() {
  const [isOn, setOn] = useState(true);
  const [chip, setChip] = useState(true);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="title.l">Kitchen sink</Text>

      <Section title="Type">
        {(Object.keys(typeScale) as TypeVariant[]).map((v) => (
          <Text key={v} variant={v} numberOfLines={1}>
            {v} 0123
          </Text>
        ))}
      </Section>

      <Section title="Colour">
        <View style={styles.row}>
          {Object.entries(color.mood).map(([k, v]) => (
            <View key={k} style={[styles.swatch, { backgroundColor: v }]} />
          ))}
          <View style={[styles.swatch, styles.swatchAccent]} />
          <View style={[styles.swatch, styles.swatchRaised]} />
        </View>
      </Section>

      <Section title="PrimaryButton">
        <PrimaryButton label="Accent" icon="arrowRight" onPress={() => {}} />
        <PrimaryButton label="Light" variant="light" icon="arrowRight" onPress={() => {}} />
        <PrimaryButton label="Outline" variant="outline" onPress={() => {}} />
        <PrimaryButton label="Ghost" variant="ghost" onPress={() => {}} />
        <PrimaryButton label="Loading" loading onPress={() => {}} />
        <PrimaryButton label="Disabled light" variant="light" disabled onPress={() => {}} />
        <PrimaryButton label="Compact outline" variant="outline" compact onPress={() => {}} />
      </Section>

      <Section title="OnboardingHeader">
        <OnboardingHeader step={4} total={15} onBack={() => {}} />
      </Section>

      <Section title="ChoiceRow / ChoiceChip">
        <ChoiceRow
          label="Single, selected"
          mode="single"
          accent="pink"
          selected={isOn}
          onPress={() => setOn(!isOn)}
        />
        <ChoiceRow
          label="With sub-line"
          sub="Shown when selected"
          mode="multi"
          accent="green"
          selected
          onPress={() => {}}
        />
        <View style={styles.grid}>
          <ChoiceChip label="Chip" accent="sky" selected={chip} onPress={() => setChip(!chip)} />
          <ChoiceChip label="Chip" accent="sky" selected={false} onPress={() => {}} />
        </View>
      </Section>

      <Section title="Card / ListGroup">
        <Card>
          <Text variant="body">Raised card</Text>
        </Card>
        <Card tone="surface">
          <Text variant="body">Surface card</Text>
        </Card>
        <ListGroup header="Group">
          <ListRow title="Row" subtitle="Subtitle" />
          <ListRow title="Pressable row" onPress={() => {}} />
        </ListGroup>
      </Section>

      <Section title="Icon">
        <View style={styles.row}>
          {ICON_NAMES.map((n) => (
            <Icon key={n} name={n} size={22} color={color.text.primary} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="micro" tone="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.gutter, gap: space.xxl },
  section: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  grid: { flexDirection: 'row', gap: space.sm },
  swatch: { width: 40, height: 40, borderRadius: 8 },
  swatchAccent: { backgroundColor: color.accent.primary },
  swatchRaised: { backgroundColor: color.bg.raised },
});
