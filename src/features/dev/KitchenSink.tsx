import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppIcon,
  Banner,
  BarChart,
  Button,
  type ButtonVariant,
  Card,
  CategoryChip,
  ChoiceChip,
  Countdown,
  EmptyState,
  GameCard,
  GameIcon,
  Header,
  HourChart,
  Icon,
  ListGroup,
  ListRow,
  OptionRow,
  ProgressDots,
  RadioDot,
  Ring,
  Screen,
  Segmented,
  Sheet,
  SiteIcon,
  Skeleton,
  StatsGrid,
  StatTile,
  StepProgress,
  Stepper,
  Text,
  Toggle,
} from '@/design/components';
import { ICON_NAMES } from '@/design/icons';
import { color, space, type, type TypeRole } from '@/design/tokens';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';

const VARIANTS: readonly ButtonVariant[] = ['primary', 'brand', 'secondary', 'ghost', 'danger'];
const ROLES = Object.keys(type) as TypeRole[];
const WEEK = ['M', 'T', 'W', 'T2', 'F', 'S', 'S2'] as const;
const WEEK_DATA = WEEK.map((label, i) => ({
  label: label.replace('2', ''),
  blocked: 20 + ((i * 13) % 40),
  other: 60 + ((i * 29) % 50),
  isToday: i === WEEK.length - 1,
  a11y: label,
}));
const HOURS = Array.from({ length: 24 }, (_, h) => (h < 7 ? 1 : 3 + ((h * 7) % 9)));
const SAMPLE_APPS = ['Instagram', 'TikTok', 'YouTube', 'X', 'Reddit'];

/**
 * Every design-system component in every variant and state (1.2 acceptance), for visual
 * checks against design/screens. Dev builds only.
 */
export function KitchenSink() {
  const t = useT();
  const [single, setSingle] = useState(1);
  const [multi, setMulti] = useState<number[]>([0]);
  const [chip, setChip] = useState(0);
  const [on, setOn] = useState(true);
  const [goal, setGoal] = useState(3);
  const [seg, setSeg] = useState<'week' | 'month'>('week');
  const [sheet, setSheet] = useState(false);
  const [endsAt] = useState(() => Date.now() + 5 * 60 * 1000);

  return (
    <Screen
      scroll
      gutter="tab"
      testID="dev.kitchenSink"
      header={<Header title={t('dev.sink.title')} onBack={() => router.back()} />}>
      <Section title={t('dev.sink.text')}>
        {ROLES.map((r) => (
          <Text key={r} variant={r} numberOfLines={1}>
            {`${r} · ${t('dev.sink.sample')}`}
          </Text>
        ))}
      </Section>

      <Section title={t('dev.sink.buttons')}>
        {VARIANTS.map((v) => (
          <Button key={v} variant={v} label={t(`dev.sink.variants.${v}`)} onPress={() => {}} />
        ))}
        <Button
          size="md"
          label={t('dev.sink.variants.primary')}
          icon="arrowRight"
          onPress={() => {}}
        />
        <Button label={t('dev.sink.loading')} loading onPress={() => {}} />
        <Button label={t('dev.sink.disabled')} disabled onPress={() => {}} />
      </Section>

      <Section title={t('dev.sink.options')}>
        {['🧒', '🎓', '💼'].map((e, i) => (
          <OptionRow
            key={e}
            emoji={e}
            label={`${t('dev.sink.sampleLabel')} ${i + 1}`}
            selected={single === i}
            onPress={() => setSingle(i)}
          />
        ))}
        {[0, 1].map((i) => (
          <OptionRow
            key={`m${i}`}
            multi
            label={`${t('dev.sink.sampleLabel')} ${i + 1}`}
            sublabel={t('dev.sink.sampleSub')}
            selected={multi.includes(i)}
            onPress={() =>
              setMulti(multi.includes(i) ? multi.filter((x) => x !== i) : [...multi, i])
            }
          />
        ))}
      </Section>

      <Section title={t('dev.sink.chips')}>
        <View style={styles.wrap}>
          {['15 min', '30 min', '1 h', '2 h'].map((l, i) => (
            <ChoiceChip key={l} label={l} selected={chip === i} onPress={() => setChip(i)} />
          ))}
        </View>
        <View style={styles.wrap}>
          <CategoryChip group="memory" label={t('dev.sink.category')} />
          <CategoryChip group="attention" label="Attention" />
          <CategoryChip group="selfControl" label="Self-control" />
          <CategoryChip group="calm" label="Calm" />
        </View>
      </Section>

      <Section title={t('dev.sink.cards')}>
        <Card>
          <Text variant="heading">{t('dev.sink.sampleLabel')}</Text>
          <Text variant="body" tone="secondary">
            {t('dev.sink.sampleSub')}
          </Text>
        </Card>
        <Card onPress={() => {}} accessibilityLabel={t('dev.sink.sampleLabel')}>
          <Text variant="bodyLg">{t('dev.sink.sampleLabel')}</Text>
        </Card>
      </Section>

      <Section title={t('dev.sink.lists')}>
        <ListGroup label={t('dev.sink.sampleLabel')}>
          <ListRow
            icon="shield"
            title={t('dev.sink.sampleLabel')}
            subtitle={t('dev.sink.sampleSub')}
            onPress={() => {}}
          />
          <ListRow
            icon="timer"
            title={t('dev.sink.sampleLabel')}
            value="5 min"
            onPress={() => {}}
          />
          <ListRow
            icon="speaker"
            title={t('dev.sink.sampleLabel')}
            trailing={
              <Toggle value={on} onChange={setOn} accessibilityLabel={t('dev.sink.sampleLabel')} />
            }
          />
          <ListRow
            icon="flame"
            title={t('dev.sink.sampleLabel')}
            trailing={
              <Stepper
                value={goal}
                onChange={setGoal}
                min={1}
                max={5}
                accessibilityLabel={t('dev.sink.sampleLabel')}
              />
            }
          />
          <ListRow icon="trash" title={t('dev.sink.sampleLabel')} danger onPress={() => {}} />
        </ListGroup>
      </Section>

      <Section title={t('dev.sink.controls')}>
        <Segmented
          options={[
            { value: 'week', label: t('dev.sink.week') },
            { value: 'month', label: t('dev.sink.month') },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <View style={styles.row}>
          <Toggle value={on} onChange={setOn} accessibilityLabel={t('dev.sink.sampleLabel')} />
          <Toggle
            value={false}
            onChange={() => {}}
            disabled
            accessibilityLabel={t('dev.sink.disabled')}
          />
          <RadioDot selected />
          <RadioDot selected={false} />
        </View>
        <Button
          variant="secondary"
          label={t('dev.sink.openSheet')}
          onPress={() => setSheet(true)}
        />
        <Button
          variant="secondary"
          label={t('dev.sink.showToast')}
          onPress={() => showToast({ title: t('dev.sink.toastTitle'), tone: 'success' })}
        />
      </Section>

      <Section title={t('dev.sink.progress')}>
        {[0, 1, 3, 5].map((d) => (
          <View key={d} style={styles.progress}>
            <StepProgress total={5} done={d} />
          </View>
        ))}
        <ProgressDots count={3} index={1} />
        <View style={styles.row}>
          <Ring progress={0.66} size={64}>
            <Text variant="statMd">40</Text>
          </Ring>
          <Ring progress={0.3} size={64} color={color.signal.warning} />
          <Ring progress={0.1} size={64} color={color.signal.danger} />
        </View>
        <Countdown endsAt={endsAt} />
      </Section>

      <Section title={t('dev.sink.icons')}>
        <View style={styles.wrap}>
          {ICON_NAMES.map((n) => (
            <View key={n} style={styles.icon}>
              <Icon name={n} color={color.text.primary} />
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {n}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={t('dev.sink.apps')}>
        <View style={styles.row}>
          {SAMPLE_APPS.map((a) => (
            <AppIcon key={a} label={a} />
          ))}
          <SiteIcon domain="reddit.com" />
        </View>
      </Section>

      <Section title={t('dev.sink.stats')}>
        <StatsGrid>
          <StatTile
            label={t('dev.sink.statLabel')}
            value="71"
            delta={{ text: t('dev.sink.statDelta'), tone: 'good' }}
          />
          <StatTile
            label={t('dev.sink.statLabel')}
            value="1h 42m"
            delta={{ text: t('dev.sink.statDelta'), tone: 'bad' }}
          />
        </StatsGrid>
        <Card>
          <BarChart
            data={WEEK_DATA}
            legend={{ blocked: t('dev.sink.legendBlocked'), other: t('dev.sink.legendOther') }}
          />
        </Card>
        <Card>
          <HourChart
            values={HOURS}
            highlight={[8, 13, 20, 21]}
            axis={['12 AM', '6 AM', '12 PM', '6 PM']}
            accessibilityLabel={t('dev.sink.hourA11y')}
          />
        </Card>
      </Section>

      <Section title={t('dev.sink.feedback')}>
        <Banner
          title={t('dev.sink.bannerTitle')}
          body={t('dev.sink.bannerBody')}
          actionLabel={t('dev.sink.bannerAction')}
          onPress={() => {}}
        />
        <Card>
          <EmptyState
            icon="lockOutline"
            title={t('dev.sink.emptyTitle')}
            body={t('dev.sink.emptyBody')}
            actionLabel={t('dev.sink.emptyAction')}
            onAction={() => {}}
          />
        </Card>
        <Skeleton height={50} />
        <Skeleton height={50} width="70%" />
      </Section>

      <Section title={t('dev.sink.games')}>
        <View style={styles.row}>
          <GameIcon color={color.game.sun} glyph="timer" />
          <GameIcon color={color.game.sky} glyph="bolt" />
          <GameIcon color={color.game.mint} />
          <GameIcon color={color.game.pink} />
        </View>
        <View style={styles.row}>
          <GameCard
            name="Stack tower"
            meta={t('dev.sink.gameMeta')}
            gameColor={color.game.sun}
            glyph="timer"
            isNew
            onPress={() => {}}
          />
          <GameCard
            name="Rocket hop"
            meta={t('dev.sink.gameMeta')}
            gameColor={color.game.sky}
            glyph="bolt"
            isLocked
            onPress={() => {}}
          />
        </View>
      </Section>

      <Sheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={t('dev.sink.sheetTitle')}
        body={t('dev.sink.sheetBody')}
        actions={
          <>
            <Button
              variant="danger"
              label={t('dev.sink.variants.danger')}
              onPress={() => setSheet(false)}
            />
            <Button variant="ghost" label={t('common.cancel')} onPress={() => setSheet(false)} />
          </>
        }
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="micro" tone="tertiary">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginTop: space['3xl'] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progress: { flexDirection: 'row' },
  icon: { width: space['5xl'] - space.sm, alignItems: 'center', gap: space.xs },
});
