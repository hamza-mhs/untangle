import { iconRadius, size as sizes } from '../../tokens';
import { Monogram } from './AppIcon';

export type SiteIconProps = { domain: string; size?: number; testID?: string };

/** Websites: favicons are never fetched (offline), so always a monogram tile from the domain. */
export function SiteIcon({ domain, size = sizes.appIcon.md, testID }: SiteIconProps) {
  return (
    <Monogram
      label={domain}
      keyFor={domain}
      tile={{ width: size, height: size, borderRadius: iconRadius(size) }}
      testID={testID}
    />
  );
}
