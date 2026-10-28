import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { fixBlockingAccess } from '@/features/rules/accessStore';

/** `untangle://fix-access` (HomeBOff banner, widgets): ask for Screen Time access again. */
export default function FixAccess() {
  useEffect(() => {
    void fixBlockingAccess();
  }, []);
  return <Redirect href="/today" />;
}
