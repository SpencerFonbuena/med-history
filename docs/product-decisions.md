# MedHistory — Product & Architecture Decisions

> Living record of the foundational decisions for MedHistory. Updated as direction firms up.
> Last updated: 2026-06-13

## What it is

MedHistory is an iOS-style mobile app for tracking personal medical history, organized
by **profile → body region → records** (visits, notes, prescriptions). A single phone can
hold multiple profiles (e.g. a caregiver managing their own and an older parent's history).

## Decisions

### 1. Platform: Expo / React Native
Real native mobile app (iOS first), built with Expo. The existing HTML/CSS mockups in
`docs/mockups/` are the visual reference, to be rebuilt as React Native components.

### 2. Data lives on-device only — no backend
All medical data stays on the phone. No server, no database we operate, no cloud copy.

**Why:**
- **No breach surface.** No central store of medical data means no honeypot to breach,
  and it sidesteps a large class of compliance/liability risk for a small team.
- **Privacy is the pitch.** "Your medical history never leaves your phone" is an honest,
  strong selling point for this category.
- **Simpler to build.** No auth, no API, no sync conflicts.

**Storage mechanism:**
- **SQLite** for structured records (profiles, visits, notes, prescriptions) — text, dates,
  structured fields.
- **Filesystem** (Expo `FileSystem`) for any large binary attachments added later
  (e.g. a photo of a prescription or a scanned lab result); SQLite stores the metadata and
  file path, not the bytes. (Same split apps like Spotify use for downloaded media.)
- Both live in the app's private sandbox, are included in the device's encrypted backup,
  and are wiped on uninstall.

### 3. Monetization: paid subscription via StoreKit — still no auth, no backend
Charge a recurring fee through **Apple's in-app purchase (StoreKit)**, not our own billing.

**Why this needs no backend or user accounts:**
- The subscription is tied to the user's **Apple ID** — we never create, see, or store a
  user identity.
- **StoreKit 2 verifies the entitlement on-device** (cryptographically signed by Apple),
  so there's no receipt-validation server to run.
- "Restore purchases" works across the user's devices automatically via Apple ID.

**Things to keep in mind:**
- Digital subscriptions **must** use Apple IAP (no Stripe); Apple takes 15% (small-business
  program, <$1M/yr) to 30%.
- **Pricing model is still open** — subscription vs. one-time unlock vs. freemium. A monthly
  fee for an app holding the user's *own* data can feel like rent; needs deliberate recurring
  value. Revisit before committing.
- **Never hold data hostage.** If a subscription lapses, gate features but never delete or
  lock users out of their own records. Export (below) is the guarantee.

### 4. Export / Import
Let users export all their data to a single file they control (save to Files/iCloud Drive/
email), and import it back.

**Does triple duty:**
- **Portability** — move a profile between phones; caregiver scenario.
- **Durability/backup** — solves "lost phone = lost data" with no server.
- **Paywall safety valve** — enforces the "you always own your data" guarantee and smooths
  App Store review.

Design as one file (encryption TBD), exported via the share sheet and imported via the file
picker. No infrastructure required.

## Open questions
- Pricing model: subscription vs. one-time vs. freemium.
- Whether the export file is encrypted, and if so how the key is handled.

## Repo structure
pnpm workspace monorepo:
- `apps/mobile` — the Expo app (UI).
- `packages/core` — data model, SQLite storage, business logic. **No UI, no React Native
  dependency**, so it can be unit-tested in plain Node. The data layer is the product, so it
  lives apart from the screen.
