"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Mail, Phone } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { fetchDonorDetail } from "@/lib/data/donors";
import { fetchDonationsForDonor } from "@/lib/data/donations";
import { fetchPledgeForDonor, PledgeProgress } from "@/lib/data/pledges";
import { formatMoney } from "@/lib/format";
import { Donation, Donor, DonorStatus } from "@/lib/types";

const statusTone: Record<DonorStatus, "positive" | "muted" | "warning"> = {
  Active: "positive",
  Prospective: "muted",
  Lapsed: "warning",
};

export default function DonorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [donor, setDonor] = useState<Donor | null | undefined>(undefined);
  const [gifts, setGifts] = useState<Donation[]>([]);
  const [pledge, setPledge] = useState<PledgeProgress | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    fetchDonorDetail(supabase, id).then(setDonor);
    fetchDonationsForDonor(supabase, id).then(setGifts);
    fetchPledgeForDonor(supabase, id).then(setPledge);
  }, [id]);

  if (donor === undefined) {
    return <p className="px-5 py-16 text-center text-[13px] text-muted">Loading…</p>;
  }

  if (donor === null) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[13px] text-muted">Donor not found.</p>
        <Link href="/donors" className="mt-3 inline-block text-[13px] text-ink-soft underline">
          Back to donors
        </Link>
      </div>
    );
  }

  const needsOrgFields = donor.donorType !== "Individual";
  const lifetimeTotal = gifts.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div>
      <header className="border-b border-rule px-5 pb-5 pt-6">
        <Link href="/donors" className="flex items-center gap-1 text-[13px] text-ink-soft">
          <ChevronLeft size={16} /> Donors
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[26px] leading-tight text-ink">{donor.name}</h1>
            <p className="mt-1 text-[13px] text-muted">
              {donor.donorType} · {donor.category}
            </p>
            {needsOrgFields && donor.contactPersonName && (
              <p className="mt-1 text-[13px] text-ink-soft">Contact: {donor.contactPersonName}</p>
            )}
          </div>
          <StatusBadge label={donor.status} tone={statusTone[donor.status]} />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          {donor.phone && (
            <a href={`tel:${donor.phone}`} className="flex items-center gap-2 text-[14px] text-ink-soft">
              <Phone size={14} className="text-muted" /> {donor.phone}
            </a>
          )}
          {donor.email && (
            <a href={`mailto:${donor.email}`} className="flex items-center gap-2 text-[14px] text-ink-soft">
              <Mail size={14} className="text-muted" /> {donor.email}
            </a>
          )}
          {needsOrgFields && donor.registrationId && (
            <p className="text-[13px] text-muted">Reg/Tax ID: {donor.registrationId}</p>
          )}
        </div>
      </header>

      <section className="px-5 pt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Lifetime giving</p>
        <p className="tnum mt-1 text-[32px] leading-none text-accent">{formatMoney(lifetimeTotal, "ETB")}</p>
      </section>

      {pledge && (
        <section className="mt-6 px-5">
          <h2 className="mb-2 font-display text-lg text-ink">Active pledge</h2>
          <div className="rounded-2xl border border-rule bg-paper-raised p-4">
            <div className="flex items-baseline justify-between">
              <p className="tnum text-[20px] text-accent">{formatMoney(pledge.amountReceived, pledge.currency)}</p>
              <p className="tnum text-[13px] text-muted">of {formatMoney(pledge.totalAmount, pledge.currency)}</p>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rule">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (pledge.amountReceived / pledge.totalAmount) * 100)}%` }}
              />
            </div>
            <p className="mt-2.5 text-[13px] text-ink-soft">
              {pledge.frequency} · next due {pledge.nextDueDate}
            </p>
          </div>
        </section>
      )}

      {donor.notes && (
        <section className="mt-6 px-5">
          <h2 className="mb-2 font-display text-lg text-ink">Notes</h2>
          <p className="rounded-2xl border border-rule bg-paper-raised p-4 text-[14px] leading-relaxed text-ink-soft">
            {donor.notes}
          </p>
        </section>
      )}

      <section className="mt-6 px-5">
        <h2 className="mb-2 font-display text-lg text-ink">Giving history</h2>
        <div className="rounded-2xl border border-rule bg-paper-raised">
          {gifts.map((g) => (
            <div key={g.id} className="ledger-row flex items-center gap-3 px-4 py-3.5">
              {g.receiptImageUrl && (
                <button
                  type="button"
                  onClick={() => setLightbox(g.receiptImageUrl!)}
                  className="shrink-0"
                  aria-label="View receipt"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.receiptImageUrl}
                    alt="Receipt"
                    className="h-10 w-10 rounded-lg border border-rule object-cover"
                  />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-ink">{g.purpose}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {g.dateReceived} · {g.receiptNumber}
                </p>
              </div>
              <p className="tnum shrink-0 pl-3 text-[15px] text-accent">{formatMoney(g.amount, g.currency)}</p>
            </div>
          ))}
          {gifts.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-muted">No gifts recorded yet.</p>
          )}
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Receipt" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
