import type { Offering, PlanId, PurchaseFailure } from '@/services/purchases';

/**
 * Paywall load and purchase states as discriminated unions (CODE_STANDARDS › State).
 * Render them with an exhaustive switch.
 */

/** E03 skeleton for up to 8 s, then E04. */
export const OFFERINGS_TIMEOUT_MS = 8000;
/** "Purchase succeeded but the entitlement hasn't arrived": keep the spinner up to 10 s. */
export const ENTITLEMENT_WAIT_MS = 10_000;

export type LoadState =
  | { status: 'loading'; since: number }
  | { status: 'ready'; offering: Offering }
  | { status: 'offline' }
  | { status: 'error' };

export type LoadEvent =
  | { type: 'retry'; now: number }
  | { type: 'loaded'; offering: Offering }
  | { type: 'failed'; reason: 'offline' | 'error' }
  | { type: 'tick'; now: number };

export function loadReducer(state: LoadState, e: LoadEvent): LoadState {
  switch (e.type) {
    case 'retry':
      return state.status === 'ready' ? state : { status: 'loading', since: e.now };
    case 'loaded':
      return { status: 'ready', offering: e.offering };
    case 'failed':
      return state.status === 'ready' ? state : { status: e.reason };
    case 'tick':
      return state.status === 'loading' && e.now - state.since >= OFFERINGS_TIMEOUT_MS
        ? { status: 'offline' }
        : state;
  }
}

export type PurchaseState =
  | { status: 'idle' }
  | { status: 'purchasing'; plan: PlanId }
  | { status: 'pending' }
  | { status: 'failed'; plan: PlanId }
  | { status: 'success'; plan: PlanId };

export type PurchaseEvent =
  | { type: 'start'; plan: PlanId }
  | { type: 'result'; outcome: 'success' | PurchaseFailure }
  | { type: 'reset' };

/** cancelled → back to idle with no UI at all (EDGE_CASES: no message, no haptic). */
export function purchaseReducer(state: PurchaseState, e: PurchaseEvent): PurchaseState {
  switch (e.type) {
    case 'start':
      return state.status === 'purchasing' ? state : { status: 'purchasing', plan: e.plan };
    case 'result': {
      if (state.status !== 'purchasing') return state;
      switch (e.outcome) {
        case 'success':
          return { status: 'success', plan: state.plan };
        case 'cancelled':
          return { status: 'idle' };
        case 'pending':
          return { status: 'pending' };
        case 'failed':
        case 'offline':
          return { status: 'failed', plan: state.plan };
      }
      return state;
    }
    case 'reset':
      return { status: 'idle' };
  }
}

/** Where a purchase outcome sends the user. */
export function purchaseDestination(
  outcome: 'success' | PurchaseFailure,
): 'success' | 'failedSheet' | 'pendingScreen' | 'stay' {
  switch (outcome) {
    case 'success':
      return 'success';
    case 'pending':
      return 'pendingScreen';
    case 'failed':
    case 'offline':
      return 'failedSheet';
    case 'cancelled':
      return 'stay';
  }
}
