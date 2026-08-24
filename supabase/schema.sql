-- Donation & Pledge Tracker — schema
-- Single admin login, so RLS just requires an authenticated session.

create table donors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  donor_type text not null check (donor_type in ('Individual','Organization','Government','Foundation','Church')),
  phone text,
  email text,
  address text,
  category text not null check (category in ('Major donor','Recurring','One-time','In-kind')),
  status text not null default 'Active' check (status in ('Active','Lapsed','Prospective')),
  notes text,
  date_added date not null default current_date,
  -- Organization/Government/Foundation/Church only — left null for Individual donors.
  contact_person_name text,
  registration_id text,
  location text not null default 'Local' check (location in ('Local','Abroad'))
);

create table pledges (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references donors(id) on delete cascade,
  total_amount numeric(12,2) not null,
  currency text not null default 'ETB',
  frequency text not null check (frequency in ('One-time','Monthly','Quarterly','Annual')),
  start_date date not null,
  end_date date,
  next_due_date date,
  -- 'Completed' pledges are archived: hidden from the active pledges list
  -- and donor detail's "Active pledge" section, but their linked donations
  -- stay exactly where they are in the donations history.
  status text not null default 'Active' check (status in ('Active','Completed'))
);

create sequence donations_receipt_seq start 1044;

create table donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references donors(id) on delete cascade,
  date_received date not null default current_date,
  amount numeric(12,2) not null,
  currency text not null default 'ETB',
  payment_method text not null check (payment_method in ('Cash','Bank transfer','Mobile money','Cheque','In-kind')),
  purpose text not null default 'Unrestricted',
  type text not null check (type in ('One-time','Pledge installment')),
  pledge_id uuid references pledges(id) on delete set null,
  receipt_number text not null unique default ('RC-' || nextval('donations_receipt_seq')),
  status text not null default 'Received' check (status in ('Received','Pending','Partial')),
  receipt_image_url text
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Follow-up','Pledge due','Report deadline','Thank-you')),
  donor_id uuid references donors(id) on delete cascade,
  -- Set only for auto-generated "Pledge due" reminders; links back to the
  -- pledge so a recorded installment can find and complete the right one.
  pledge_id uuid references pledges(id) on delete cascade,
  due_date date not null,
  note text,
  status text not null default 'Pending' check (status in ('Pending','Done'))
);

-- Convenience view: amount received per pledge, plus the fields the UI needs
-- alongside it so donor detail / pledges pages can do it in a single query.
-- Only Active pledges are included — Completed ones are archived out of it.
create view pledge_progress as
  select
    p.id as pledge_id,
    p.donor_id,
    p.total_amount,
    p.currency,
    p.frequency,
    p.next_due_date,
    coalesce(sum(d.amount), 0) as amount_received
  from pledges p
  left join donations d on d.pledge_id = p.id and d.status = 'Received'
  where p.status = 'Active'
  group by p.id;

-- RLS: single admin login, any authenticated user has full access
alter table donors enable row level security;
alter table pledges enable row level security;
alter table donations enable row level security;
alter table reminders enable row level security;

create policy "Authenticated full access" on donors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access" on pledges for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access" on donations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access" on reminders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage: receipt photos attached to donations.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload receipts" on storage.objects;
create policy "Authenticated can upload receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

drop policy if exists "Authenticated can view receipts" on storage.objects;
create policy "Authenticated can view receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts');

-- ---------------------------------------------------------------------------
-- MIGRATION for an already-running database that was set up from an earlier
-- version of this file. Everything above this line assumes a fresh database
-- and will error on `create table` if the tables already exist.
--
-- If your donors/pledges/donations/reminders tables already exist, don't run
-- the file above from the top — run just the block below instead. It's
-- additive only (new nullable columns, a replaced view, the storage bucket
-- and its policies) and safe to re-run.
-- ---------------------------------------------------------------------------

alter table donors add column if not exists contact_person_name text;
alter table donors add column if not exists registration_id text;
alter table donations add column if not exists receipt_image_url text;
alter table reminders add column if not exists pledge_id uuid references pledges(id) on delete cascade;
alter table pledges add column if not exists status text not null default 'Active' check (status in ('Active','Completed'));
alter table donors add column if not exists location text not null default 'Local' check (location in ('Local','Abroad'));

create sequence if not exists donations_receipt_seq start 1044;
alter table donations alter column receipt_number set default ('RC-' || nextval('donations_receipt_seq'));

create or replace view pledge_progress as
  select
    p.id as pledge_id,
    p.donor_id,
    p.total_amount,
    p.currency,
    p.frequency,
    p.next_due_date,
    coalesce(sum(d.amount), 0) as amount_received
  from pledges p
  left join donations d on d.pledge_id = p.id and d.status = 'Received'
  where p.status = 'Active'
  group by p.id;
