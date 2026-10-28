# Progress log

One entry per sub-batch: date, status, decisions, open issues.

## 2026-10-29 · 1.0 Safety commit — skipped (no git for now)

- **Status:** git steps not done. The owner doesn't want any git work yet ("I don't have any
  repo"), and git has no author identity on this machine. The repo still has nothing committed
  (everything staged on `master`).
- **Done:** `.gitignore` now ignores `/android`, `/ios`, `modules/*/android/build/`, `.cxx/`, so
  the eventual first commit won't pull in the 1.1 GB generated `android/` folder.
- **Decision:** sub-batch commits are skipped until git is wanted. Before 1.1 deletes anything,
  the legacy state is kept another way (see the 1.1 entry).
- **Open:** git author name/email, and when to start committing. When git starts, do 1.0 as
  written (legacy commit → `legacy` branch → `v1`).

## Open questions (from the Batch 1 read-through)

1. Welcome screen: B (3 slides, spec default) or A (one checklist)?
2. Pick apps default: 30 min a day, or blocked completely (0 min)?
3. Free tier: up to 3 locks + 3 daily training games, Pick apps capped at 3?
4. Unlock caps per day (3 Gentle, 2 Firm) and the "App unlocked" chip (needed by Batch 2).
5. Real package id (also the Kotlin namespace), before the first production-like build.
6. Figma access for icons and illustrations, or exported files from the owner.
7. OK to download Public Sans (OFL) from the official Google Fonts repository?
8. App icon: placeholder until the logo is decided?
9. Before 1.5: Play Console subscriptions, RevenueCat project, public Android key.
10. `BootReceiver.kt`: delete (spec says no `RECEIVE_BOOT_COMPLETED`)?
11. "Start my first round" in 1.4 goes to Home until a game exists?
12. "+ Add websites" on Pick apps: build the website sheet early in 1.4, or hide until Batch 2?
