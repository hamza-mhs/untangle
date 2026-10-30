import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { Button, Sheet } from '@/design/components';
import { DEFAULT_PAUSE_GAME, useAfterGameStore } from '@/features/games';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';
import type { TargetCounters } from '@/native';

import { needsGameFirst, type LockChange } from '../allowance';
import { targetName } from '../components/TargetIcon';
import { useLocksStore } from '../locksStore';
import type { Lock } from '../types';

function apply(lock: Lock, change: LockChange) {
  const s = useLocksStore.getState();
  switch (change.kind) {
    case 'enable':
      return s.updateLock(lock.id, { enabled: true });
    case 'disable':
      return s.updateLock(lock.id, { enabled: false });
    case 'delete':
      return s.removeLock(lock.id);
    case 'allowance':
      return s.updateLock(lock.id, change.next);
    case 'strictness':
      return s.updateLock(lock.id, { strictness: change.next });
  }
}

/**
 * Lock edits with the loosening rule (20-phase2-core-app §6.7): loosening while the lock is
 * blocking right now asks for one game first; the change applies once the game is completed.
 * Tightening (and anything while not blocking) applies at once.
 */
export function useLockChange(): {
  request: (
    lock: Lock,
    change: LockChange,
    counters: TargetCounters | undefined,
    after?: () => void,
  ) => void;
  sheet: ReactNode;
} {
  const t = useT();
  const [gate, setGate] = useState<{
    lock: Lock;
    change: LockChange;
    after?: (() => void) | undefined;
  } | null>(null);

  const request = (
    lock: Lock,
    change: LockChange,
    counters: TargetCounters | undefined,
    after?: () => void,
  ) => {
    if (needsGameFirst(lock, change, counters)) {
      setGate({ lock, change, after });
      return;
    }
    apply(lock, change);
    after?.();
  };

  const play = () => {
    if (!gate) return;
    const { lock, change, after } = gate;
    setGate(null);
    useAfterGameStore.getState().set({
      kind: 'lockChange',
      lockId: lock.id,
      apply: () => {
        apply(lock, change);
        showToast({ title: t('locks.detail.changed'), tone: 'success' });
        after?.();
      },
    });
    router.push({
      pathname: '/game/[gameId]',
      params: { gameId: DEFAULT_PAUSE_GAME, source: 'browse' },
    });
  };

  const name = gate ? targetName(gate.lock.target) : '';
  const title = !gate
    ? ''
    : gate.change.kind === 'disable'
      ? t('locks.detail.gateTitle', { name })
      : gate.change.kind === 'delete'
        ? t('locks.detail.gateTitleDelete', { name })
        : t('locks.detail.gateTitleChange', { name });

  const sheet = (
    <Sheet
      visible={gate !== null}
      onClose={() => setGate(null)}
      testID="locks.gate"
      title={title}
      body={t('locks.detail.gateBody')}
      actions={
        <>
          <Button testID="locks.gate.play" label={t('locks.detail.gatePlay')} onPress={play} />
          <Button
            variant="secondary"
            label={t('locks.detail.gateKeep')}
            onPress={() => setGate(null)}
          />
        </>
      }
    />
  );
  return { request, sheet };
}
