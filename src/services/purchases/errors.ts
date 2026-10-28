/**
 * RevenueCat error → our outcome, 1:1 with the edge screens (CODE_STANDARDS › Services):
 *   cancelled → nothing at all · failed → E05 · pending → E06 · offline → E04.
 */
export type PurchaseFailure = 'cancelled' | 'failed' | 'pending' | 'offline';

/** RevenueCat `PURCHASES_ERROR_CODE` values (strings in the SDK). */
const CANCELLED = '1';
const NETWORK = '10';
const PAYMENT_PENDING = '20';
const OFFLINE_CONNECTION = '35';
const PRODUCT_REQUEST_TIMED_OUT = '32';

export class PurchaseError extends Error {
  constructor(
    readonly outcome: PurchaseFailure,
    readonly code: string | null,
    message?: string,
  ) {
    super(message ?? outcome);
    this.name = 'PurchaseError';
  }
}

function codeOf(e: unknown): string | null {
  if (!e || typeof e !== 'object') return null;
  const code = (e as { code?: unknown }).code;
  return typeof code === 'string' || typeof code === 'number' ? String(code) : null;
}

function isUserCancelled(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as { userCancelled?: unknown }).userCancelled === true;
}

export function mapPurchaseError(e: unknown): PurchaseFailure {
  const code = codeOf(e);
  if (code === CANCELLED || isUserCancelled(e)) return 'cancelled';
  if (code === PAYMENT_PENDING) return 'pending';
  if (code === NETWORK || code === OFFLINE_CONNECTION || code === PRODUCT_REQUEST_TIMED_OUT) {
    return 'offline';
  }
  return 'failed';
}

/** Loading offerings: only "offline" vs "error" matter (E04 shows for both). */
export function mapOfferingsError(e: unknown): 'offline' | 'error' {
  return mapPurchaseError(e) === 'offline' ? 'offline' : 'error';
}
