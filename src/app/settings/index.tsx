import { useToday } from '@/features/home';
import { resetAllStores } from '@/lib/resetStores';
import { detoursBetween } from '@/features/pause';
import { SettingsScreen } from '@/features/settings';

/** Settings: the screen gets Home's streak and this week's detours from here. */
export default function Settings() {
  const { streak } = useToday();
  let detoursWeek = 0;
  try {
    detoursWeek = detoursBetween(Date.now() - 7 * 86_400_000, Date.now());
  } catch {
    // No history.
  }
  return <SettingsScreen streak={streak} detoursWeek={detoursWeek} resetStores={resetAllStores} />;
}
