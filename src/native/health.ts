import { Platform } from 'react-native';

import { useMocks } from './env';

/**
 * Daily step count (aggregate only) for "Verified" walk challenges.
 *   iOS     → HealthKit via @kingstinct/react-native-healthkit (read-only)
 *   Android → Health Connect via react-native-health-connect (read Steps only)
 * Libraries are required lazily so simulators / tests never touch native code.
 */

export type HealthAvailability = 'available' | 'unavailable' | 'needs-install';

function dayRange(day: Date) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function requestStepsAccess(): Promise<boolean> {
  if (useMocks) return true;
  if (Platform.OS === 'ios') {
    const hk = await import('@kingstinct/react-native-healthkit');
    if (!hk.isHealthDataAvailable()) return false;
    return hk.requestAuthorization({ toRead: ['HKQuantityTypeIdentifierStepCount'] });
  }
  const hc = await import('react-native-health-connect');
  if (!(await hc.initialize())) return false;
  const granted = await hc.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
  return granted.some((p) => 'recordType' in p && p.recordType === 'Steps');
}

export async function getStepsForDay(day = new Date()): Promise<number> {
  if (useMocks) return 4321;
  const { start, end } = dayRange(day);
  if (Platform.OS === 'ios') {
    const hk = await import('@kingstinct/react-native-healthkit');
    const res = await hk.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierStepCount',
      ['cumulativeSum'],
      { filter: { date: { startDate: start, endDate: end } }, unit: 'count' },
    );
    return Math.round(res.sumQuantity?.quantity ?? 0);
  }
  const hc = await import('react-native-health-connect');
  await hc.initialize();
  const res = await hc.aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });
  return res.COUNT_TOTAL;
}
