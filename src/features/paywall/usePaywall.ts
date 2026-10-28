import { router } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useRulesStore } from '@/features/rules/store';
import { t } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';
import {
  purchases,
  useEntitlementStore,
  type Entitlement,
  type Plan,
  type PlanId,
} from '@/services/purchases';

import {
  ENTITLEMENT_WAIT_MS,
  loadReducer,
  purchaseDestination,
  purchaseReducer,
} from './paywallMachine';

/** Without NetInfo (not in the stack), offline retries run on foreground and on this timer. */
const OFFLINE_RETRY_MS = 15_000;
const TIMEOUT_CHECK_MS = 1000;

/** Pro arrived (purchase or restore): cache it, un-pause rules the plan paused. */
export function onProActivated(e: Entitlement) {
  useEntitlementStore.getState().set(e);
  useRulesStore.getState().upgrade();
}

/**
 * P03 / P13 / E03 / E04: offerings with an 8 s timeout, automatic retry, purchase outcomes
 * mapped 1:1 to edge screens (cancelled → nothing; failed → E05; pending → E06), and restore.
 */
export function usePaywall() {
  const [load, dispatchLoad] = useReducer(loadReducer, null, () => ({
    status: 'loading' as const,
    since: Date.now(),
  }));
  const [purchase, dispatchPurchase] = useReducer(purchaseReducer, { status: 'idle' });
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [isOnItsWay, setIsOnItsWay] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const attempt = useRef(0);

  const fetchOffering = () => {
    const id = ++attempt.current;
    dispatchLoad({ type: 'retry', now: Date.now() });
    void purchases.getOffering().then((r) => {
      if (id !== attempt.current) return;
      if (r.ok) dispatchLoad({ type: 'loaded', offering: r.value });
      else dispatchLoad({ type: 'failed', reason: r.error });
    });
  };

  useEffect(() => {
    fetchOffering();
  }, []);

  // E03 → E04 after 8 s.
  useEffect(() => {
    if (load.status !== 'loading') return;
    const timer = setInterval(
      () => dispatchLoad({ type: 'tick', now: Date.now() }),
      TIMEOUT_CHECK_MS,
    );
    return () => clearInterval(timer);
  }, [load.status]);

  // E04: retry on foreground and periodically while offline.
  useEffect(() => {
    if (load.status !== 'offline' && load.status !== 'error') return;
    const timer = setInterval(fetchOffering, OFFLINE_RETRY_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') fetchOffering();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [load.status]);

  const plans = load.status === 'ready' ? load.offering.plans : [];
  const plan = plans.find((p) => p.id === selected) ?? plans[0] ?? null;

  const finishSuccess = (p: Plan, e: Entitlement) => {
    onProActivated(e);
    haptics.success();
    router.replace({ pathname: '/pro/success', params: { plan: p.id } });
  };

  const buy = async () => {
    if (!plan || purchase.status === 'purchasing') return;
    dispatchPurchase({ type: 'start', plan: plan.id });
    const result = await purchases.purchase(plan);
    const outcome = result.ok ? 'success' : result.error;
    dispatchPurchase({ type: 'result', outcome });
    switch (purchaseDestination(outcome)) {
      case 'success': {
        if (result.ok && result.value.isActive) {
          finishSuccess(plan, result.value);
          return;
        }
        // Paid, but the entitlement hasn't synced yet: wait up to 10 s, then keep listening.
        const timer = setTimeout(() => setIsOnItsWay(true), ENTITLEMENT_WAIT_MS);
        const stop = purchases.onChange((e) => {
          if (!e.isActive) return;
          clearTimeout(timer);
          stop();
          finishSuccess(plan, e);
        });
        return;
      }
      case 'pendingScreen':
        router.replace('/paywall/pending');
        return;
      case 'failedSheet':
        haptics.warning();
        router.push('/paywall/failed');
        return;
      case 'stay':
        // User-cancelled: no message, no haptic.
        return;
    }
  };

  const restore = async () => {
    setIsRestoring(true);
    setRestoreError(null);
    const result = await purchases.restore();
    setIsRestoring(false);
    if (result.ok) {
      onProActivated(result.value);
      haptics.success();
      showToast({
        title: t('paywall.restore.okTitle'),
        sub: restoredLine(result.value),
        tone: 'success',
      });
      if (router.canGoBack()) router.back();
      return;
    }
    if (result.error === 'none') router.push('/paywall/restore-none');
    else setRestoreError(t('paywall.restore.offline'));
  };

  return {
    load,
    plans,
    plan,
    selected,
    setSelected,
    purchase,
    isOnItsWay,
    buy,
    retry: fetchOffering,
    restore,
    isRestoring,
    restoreError,
  };
}

/** "Yearly · renews 22 Oct 2027" (E08). */
export function restoredLine(e: Entitlement): string {
  const plan = e.plan ? t(`paywall.plans.${e.plan}.name`) : t('paywall.plans.pro');
  if (e.plan === 'lifetime' || e.expiresAt === null) return plan;
  return t('paywall.restore.okSub', { plan, date: formatLongDate(e.expiresAt) });
}
