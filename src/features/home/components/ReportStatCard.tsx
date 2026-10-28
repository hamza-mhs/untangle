import { StatCard } from '@/design/components';
import { useT } from '@/i18n';

/**
 * iOS: screen time and pickups can only be *displayed* by a DeviceActivityReport extension view
 * embedded in the screen (the app process never sees the numbers). SPEC VERIFY item: confirm
 * against the current DeviceActivity docs before Phase 5. The native view ships with Phase 5 (targets/device-activity-report); until then
 * this stub keeps the grid's shape with the same label and sub-line.
 */
export function ReportStatCard({ kind }: { kind: 'screenTime' | 'pickups' }) {
  const t = useT();
  return (
    <StatCard
      label={t(kind === 'screenTime' ? 'home.stats.screenTime' : 'home.stats.pickups')}
      value="—"
      sub={t(kind === 'screenTime' ? 'home.stats.vsYesterday' : 'home.stats.aDay')}
      testID={`home.stats.report.${kind}`}
    />
  );
}
