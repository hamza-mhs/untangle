# Edge-case matrix

**Rule:** every async thing has four states: loading, success, empty and error. Every permission has three: granted, denied and revoked later. If a row below has no screen, the behaviour is specified in words and needs no new design.

## Connectivity

The app is offline-first. Blocking, focus, challenges, Clarity and stats are all on-device.

| Condition | Where | Behaviour | Screen |
|---|---|---|---|
| Offline at launch | anywhere | Nothing changes. No global offline banner (it would be noise in an offline app). | — |
| Offline on paywall | P03, P13 | Skeleton for up to 8 s, then the offline card. "Continue free" always works. Retry automatically on reconnect. | E03 → E04 |
| Offline on restore | P09 Restore | Inline error under the row: "Can't reach the App Store. Check your connection." | — |
| Offline when the win-back or day-5 sheet is due | Home | Show the sheet. Its buttons go to the paywall, which handles offline itself (E04). | — |
| Offline while purchasing | store sheet | The store shows its own error. On return, treat it as E05 if an error came back. | E05 |

## Purchases and billing

| Condition | Behaviour | Screen |
|---|---|---|
| Prices loading | Skeleton. The CTA shows "Loading prices…", disabled. | E03 |
| Purchase cancelled by the user | **Nothing.** Back on the paywall, no message, no haptic. | — |
| Purchase failed (payment declined, store error) | Sheet: "You haven't been charged." Try again, or check the payment method. | E05 |
| Purchase pending (Ask to Buy, SCA or bank approval) | Info screen. Pro activates later through the customer-info listener, then show P05 on the next foreground. | E06 |
| Purchase succeeded but the entitlement hasn't arrived yet | Keep the CTA spinner for up to 10 s while RevenueCat syncs, then P05. If it times out, show "Pro is on its way. It can take a minute" and keep listening. | (copy only) |
| Already subscribed (different product) | Upgrade or crossgrade goes through the store. P09 shows the new plan after the next renewal (Apple handles the proration). | P09 |
| Renewal failed, in grace or billing retry | Banner on Home. Pro stays on. "Fix" opens the store's manage page. | P11 |
| Grace ended, still unpaid | Entitlement inactive, so the went-free sheet appears once. | P06 |
| Refunded / revoked by the store | Same as expired: P06 once. No accusatory copy. | P06 |
| Restore, nothing found | Sheet with the Apple ID hint. | E07 |
| Restore succeeded | Toast. | E08 |
| Family Sharing member | Entitlement active and shown as "Pro · via Family". Hide Cancel; the organiser manages it. | P09 (variant) |
| Lifetime | P09 shows "Pro · Lifetime", no renewal line, no Cancel. | P09 (variant) |
| Payment card entry or display | **Never in our UI.** The store sheet owns it. We never see or store card data. | P04 (reference only) |

## Permissions

| Condition | Behaviour | Screen |
|---|---|---|
| Screen Time denied in onboarding | Explain, then Try again or continue without blocking. | E01 |
| Screen Time revoked later (in Settings) | Check on every foreground (`AuthorizationCenter.shared.authorizationStatus`). Home banner and the apps card switch to "Not blocking"; Clarity freezes (it doesn't drop). | HomeBOff |
| Start focus while revoked | Sheet: fix it, or a timer only. | E09 |
| Notifications denied | Continue. One sheet on the first Home open, never again. Settings shows "Notifications: off · Turn on". | E02 |
| Picker returned nothing | Stay on OB10 with the warning subtitle. | (copy only) |
| **Android: Usage Access / overlay / Accessibility denied** | **Not designed yet.** Android needs its own OB09 to OB11 variants: one Settings deep-link screen per permission, with a "Back here when done" check on resume. | **GAP** |

## Blocking and focus

| Condition | Behaviour | Screen |
|---|---|---|
| App killed during focus | The lock persists (OS-level). On relaunch, rehydrate the countdown from `endsAt`. | FFocusRun |
| Focus ended while the app was closed | Notification "Focus done · +15 min earned" deep-links to Focus done. Show it on the next open if it hasn't been seen. | FFocusDone |
| Phone rebooted mid-lock | iOS: ManagedSettings persist. Android: the foreground service restarts on `BOOT_COMPLETED`. **VERIFY** on both. | — |
| No emergency passes left | Sheet. The passes reset Monday 00:00 local. | E10 |
| Editing an active Locked rule | Sheet: "locked until {end}". | (copy only) |
| Overlapping rules | The strictest wins (Locked > Earn > Pause). The shield names the rule that's blocking. | — |
| Earn with 0 earned minutes | Shield secondary disabled: "No minutes earned yet". | FShield variant |
| Timezone or clock change | Reschedule all schedules. Countdowns use absolute `endsAt`. | — |
| Day 1 to 7 (no baseline) | Stats card shows the baseline state. | HomeBDay1 |

## Data and lifecycle (no account)

| Condition | Behaviour |
|---|---|
| Reinstall or new phone | Purchases restore from the store account. App data comes back only from an OS backup (iCloud / Google backup of MMKV and SQLite; **VERIFY** that your storage paths are included) or the in-app export file (Settings › Export). |
| Trial already used, then reinstall | The trial date sits in local storage, so it resets. **DECIDE** whether to use the Keychain on iOS to survive reinstalls. |
| Storage full or write failure | Log it, keep running from memory, retry on the next foreground. Never block the UI. |
| Schema migration | Versioned MMKV keys plus SQLite migrations in `services/storage/migrations/`. Test that upgrading from every shipped version works. |
