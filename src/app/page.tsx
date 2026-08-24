"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { DashboardDonation, fetchThisMonthDonations } from "@/lib/data/donations";
import { fetchPendingReminderCount } from "@/lib/data/reminders";
import { formatMoney } from "@/lib/format";

export default function Dashboard() {
  const [donations, setDonations] = useState<DashboardDonation[] | null>(null);
  const [pendingReminders, setPendingReminders] = useState<number | null>(null);
  const [activePledges, setActivePledges] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    fetchThisMonthDonations(supabase, monthStart).then(setDonations);
    fetchPendingReminderCount(supabase).then(setPendingReminders);
    supabase
      .from("pledges")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setActivePledges(count ?? 0));
  }, []);

  const monthTotal = (donations ?? []).reduce((sum, g) => sum + g.amount, 0);
  const recent = (donations ?? []).slice(0, 5);
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Act of Kindness" />

      <section className="px-5 pt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{monthLabel}</p>
        <p className="tnum mt-1 text-[40px] leading-none text-accent">{formatMoney(monthTotal, "ETB")}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {donations === null
            ? "Loading…"
            : `${donations.length} gift${donations.length === 1 ? "" : "s"} received this month`}
        </p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 px-5">
        <Link href="/reminders" className="rounded-2xl border border-rule bg-paper-raised p-4">
          <p className="tnum text-2xl text-accent">{pendingReminders ?? "–"}</p>
          <p className="mt-1 text-[13px] text-ink-soft">Pending reminders</p>
        </Link>
        <Link href="/pledges" className="rounded-2xl border border-rule bg-paper-raised p-4">
          <p className="tnum text-2xl text-accent">{activePledges ?? "–"}</p>
          <p className="mt-1 text-[13px] text-ink-soft">Active pledges</p>
        </Link>
      </section>

      <section className="mt-8 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent gifts</h2>
          <Link href="/donations" className="flex items-center gap-1 text-[13px] font-medium text-ink-soft">
            Record a gift <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="rounded-2xl border border-rule bg-paper-raised">
          {recent.map((g) => (
            <div key={g.id} className="ledger-row flex items-center justify-between px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[15px] text-ink">{g.donorName}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {g.dateReceived} · {g.paymentMethod}
                </p>
              </div>
              <p className="tnum shrink-0 pl-3 text-[15px] text-accent">{formatMoney(g.amount, g.currency)}</p>
            </div>
          ))}
          {donations !== null && recent.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-muted">No gifts recorded yet this month.</p>
          )}
        </div>
      </section>
    </div>
  );
}
