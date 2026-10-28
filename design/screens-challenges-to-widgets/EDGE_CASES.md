# Edge cases · pack 2

These rows add to `design/screens-06-to-block-focus/EDGE_CASES.md`. The same rule applies: a row with no screen means its behaviour is specified in words and no new design is needed.

## Challenges and reps

| Condition | Behaviour | Screen |
|---|---|---|
| Opened before the morning draw time | The tab shows "Draw at 07:30". Drawing early is allowed; the time is only for the notification. | — |
| Draw skipped, day ended | No penalty. The next day draws fresh. Unfinished challenges just expire. | — |
| Redraw used | The button is disabled: "No redraws left". | FDrawReveal variant |
| All three done | Today's list is all struck through, and the header reads "3 of 3 · +50 bonus". Home switches to the evening state after 20:00. | — |
| Rep already played today | The daily-done screen. | R7 |
| Time ran out | Time's up, with one retry. | FTimeUp |
| Retry used and failed again | Time's up with the retry button disabled ("No tries left today"). | FTimeUp variant |
| App backgrounded mid-game | The clock pauses, and a paused screen shows on return. | R5 |
| Phone call or alarm mid-game | Same as backgrounded. | R5 |
| Close × mid-game | System alert "Quit? No points" with Quit / Keep playing. | — |
| Reduce Motion on | Card flips become cross-fades, countdowns don't pulse, the waveform is a static level bar. | — |

## Read aloud and summary

| Condition | Behaviour |
|---|---|
| Mic permission not yet asked | Ask on "Start reading" (that's why the detail screen says "Mic is on only on the next screen"). |
| Mic denied | Sheet: "Reading aloud needs the mic · Audio never leaves your phone." Buttons: Open Settings / "Read silently instead". Reading silently counts as **Your word** (capped points). |
| On-device speech unavailable (language or old device) | Same sheet, with the body changed to "Your phone can't listen offline in this language yet." Never fall back to server speech recognition. |
| Noisy room, or words not recognised | After 10 s with no progress: "Can't hear you clearly · move somewhere quieter, or tap a word to skip it". Skipped words stay grey and count against the 80%. |
| Summary: no key idea found | Still finish with points for reading. Show the key ideas afterwards ("Here's what we were listening for"). Never fail the whole challenge on the summary. |

## Verified challenges (Health)

| Condition | Behaviour |
|---|---|
| Health permission not granted | Asked the first time a verified challenge is drawn. If denied, that challenge becomes **Your word** and the card label changes. |
| No Health data (no wearable, Android without Health Connect) | Same: fall back to Your word. |

## Rewards

| Condition | Behaviour |
|---|---|
| Vault empty | Dashed "Add something…" card. |
| Not enough points | "Redeem" is hidden; the item shows "{n} to go". |
| Redeem tapped by mistake | The redeem screen has "Undo" for 5 s (a toast), then commits. |
| Photo picker cancelled | Nothing happens. |
| Points from a day that was later found invalid (e.g. clock tampering) | Never deduct silently. Ignore it. Points are motivational, not money. |

## Evening

| Condition | Behaviour |
|---|---|
| Receipt opened before 18:00 | Title "So far today". The same receipt, partial. |
| No screen-time data (iOS report empty, or permission off) | The receipt omits those lines and shows our own counts only. |
| Lights out after bedtime has already started | CTA "Good night", which closes the app. |

## Settings, backup and import

| Condition | Behaviour |
|---|---|
| Export cancelled from the share sheet | Nothing happens. |
| Import file is from a newer app version | "This backup is from a newer version of Untangle. Update the app, then try again." Nothing is changed. |
| Import file invalid or corrupted | "This file isn't an Untangle backup." Nothing is changed. |
| Import over existing data | Confirm sheet: "Replace everything on this phone with the backup from {date}?" Replace / Cancel. Take an automatic export first, and keep it. |
| After import | Prompt to re-pick the blocked apps (selection tokens don't move between devices; VERIFY). |
| App lock on, biometrics fail | Fall back to the device passcode (`disableDeviceFallback: false`). |

## Outside the app

| Condition | Behaviour |
|---|---|
| Widget before onboarding | "Open Untangle to start". |
| Live Activities turned off by the user | The session runs normally; just no activity. Don't nag. |
| Widget data stale (app not opened today) | Show yesterday's values with a "Yesterday" label. Never show an old day's "1 of 3" as today. |
| Android notification permission denied (13+) | The foreground service still runs, but the notification is hidden. Use the in-app focus screen only. |
