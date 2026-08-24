# Clearing app data

Wipes all donors, donations, pledges, and reminders. Auth users (your login)
are never touched. This is **irreversible** — only run it when you actually
want to start over (e.g. clearing out test data).

It does **not** delete uploaded receipt photos in the `receipts` storage
bucket — those are files, not rows in these tables. If you want those gone
too, go to **Storage → receipts** in the dashboard, select all, and delete
them separately.

## How to run it

1. Go to your Supabase project dashboard.
2. Open **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Paste in the SQL below.
5. Click **Run** (or press Ctrl+Enter).

Safe to re-run any time — it just empties whatever's currently in the
tables.

```sql
truncate table donations, pledges, reminders, donors restart identity cascade;

-- Resets receipt numbers back to RC-1044 for the next donation recorded.
remove```
