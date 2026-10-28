import { Switch } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color } from '../../tokens';

export type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
};

/** The native Switch with the accent track (SPEC §3: don't hand-roll it). */
export function Toggle({ value, onChange, accessibilityLabel, disabled, testID }: ToggleProps) {
  return (
    <Switch
      testID={testID}
      value={value}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onValueChange={(v) => {
        haptics.select();
        onChange(v);
      }}
      trackColor={{ false: color.border.control, true: color.accent.primary }}
      thumbColor={value ? color.text.onAccent : color.text.primary}
      ios_backgroundColor={color.border.control}
    />
  );
}
