# Act of Kindness — Donation & Pledge Tracker

Mobile-first donor, donation, pledge, and reminder tracker.

## Current state

The app is wired to Supabase — donors, donations, pledges, and reminders are all
read from and written to a real Postgres database, gated behind a minimal
email/password login. There's no more mock data.

## Design

- **Palette**: purple ink (`#4B2264`) on white/warm-white paper (`#FFFFFF` /
  `#FAF7F0`), with a gold accent (`#C9A233`) for primary buttons, active nav
  state, amounts, and progress bars
- **Logo**: `/public/logo-mark.svg` (icon) — not supplied yet, drop it in and it'll
  show up in the sidebar automatically. The login page currently uses
  `Asset 19.svg` as a placeholder.
- **Type**: Fraunces (headings/display), Inter (UI text), IBM Plex Mono (all
  amounts — tabular figures so numbers line up like a ledger column)
- **Layout**: bottom tab bar on mobile / left sidebar at desktop (Donors /
  Donations / Pledges / Reminders), mobile-first, responsive at ~768px

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — resize to a phone width (or open dev tools device
mode) to see it as intended.

## Wire up Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (Table Editor → SQL, or `supabase db push`).
   If you already ran an earlier version of this file against a live project, don't
   run it from the top — jump to the `MIGRATION` block near the bottom instead; it's
   additive-only and safe to re-run.
3. Copy `.env.local.example` to `.env.local` and fill in your project URL and anon key.
4. Create one admin user in Supabase Auth (Authentication → Users → Add user) — that's
   the account you'll sign in with at `/login`.

## Pages

- `/login` — email/password sign-in, gates every other route
- `/` — dashboard: this month's total, pending reminders, active pledges, recent gifts
- `/donors` — searchable, paginated (50/page) donor list
- `/donors/[id]` — donor detail: lifetime total, active pledge progress, notes, giving
  history with receipt thumbnails
- `/donors/new` — add donor form, with type-aware fields (contact person / registration
  ID) for Organization/Government/Foundation/Church donors
- `/donations` — all donations, sortable (date/amount/donor, re-queried from Supabase
  per sort, not sorted client-side), paginated at 30 with infinite scroll — cards on
  mobile, a data table at desktop. Tap/click a row to jump to that donor's giving
  history. The "Add donation" dialog has a donor `<select>` (with an inline "Add new
  donor…" option), amount/method/purpose, an optional pledge-installment toggle when
  the donor has an active pledge, and an optional receipt photo.
- `/pledges` — all pledges with progress bars, flags pledges that are behind. "Add
  pledge" creates a pledge and, if a next due date is set, its first "Pledge due"
  reminder automatically.
- `/reminders` — pending/done reminders, tap to toggle. "Add reminder" covers the
  manual types (Follow-up, Report deadline, Thank-you); "Pledge due" reminders are
  fully automatic (see below) and aren't created from this dialog.

## Pledge-driven reminders

`src/lib/data/pledge-reminders.ts` holds this logic, used by both the pledges and
donations data layers:

- Creating a pledge with a next due date creates a linked "Pledge due" reminder.
- Recording a donation as a pledge installment (via the pledge toggle in "Add
  donation") marks that pledge's pending reminder Done.
- For Monthly/Quarterly/Annual pledges, completing a reminder advances the pledge's
  next due date by one interval and schedules the next "Pledge due" reminder
  automatically — so the cycle repeats without manual bookkeeping. One-time pledges
  don't get a follow-up reminder.

## Data & caching notes

- The donor list is fetched once per session into a React Context
  (`src/lib/donors-context.tsx`) and cached — every page/form that needs donors shares
  it instead of each re-fetching.
- Donor search is debounced ~350ms and queries Supabase directly (`ilike`), separate
  from the cached paginated list.
- Inserting a donor, donation, pledge, or reminder updates the relevant cache/list
  optimistically — no full refetch.
- No realtime subscriptions; everything is deliberately free-tier-conscious (select
  only needed columns, paginate, debounce).

## Not yet built

- Reports (donor summary, period summary, project summary, pledge status) + PDF/Excel export
- Editing an existing pledge (e.g. correcting its next due date) — the app can only
  create pledges today
