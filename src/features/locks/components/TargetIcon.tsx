import { AppIcon, SiteIcon } from '@/design/components';
import { size as sizes } from '@/design/tokens';

import { useAppIconUri } from '../hooks';
import type { LockTarget } from '../types';

/** App icon (real PNG when the phone gives one) or a site monogram. */
export function TargetIcon({
  target,
  size = sizes.appIcon.md,
}: {
  target: LockTarget;
  size?: number;
}) {
  const uri = useAppIconUri(target.kind === 'app' ? target.packageName : null);
  if (target.kind === 'site') return <SiteIcon domain={target.domain} size={size} />;
  return <AppIcon label={target.label} uri={uri} colorKey={target.packageName} size={size} />;
}

export function targetName(target: LockTarget): string {
  return target.kind === 'app' ? target.label : target.domain;
}
