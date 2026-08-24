"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import PledgeForm, { PledgeFormValues } from "@/components/PledgeForm";
import { createClient } from "@/lib/supabase/client";
import { completePledge, fetchPledgesWithProgress, insertPledge, PledgeWithDonor } from "@/lib/data/pledges";
import { formatMoney } from "@/lib/format";

export default function PledgesPage() {
  const [pledges, setPledges] = useState<PledgeWithDonor[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchPledgesWithProgress(supabase).then(setPledges);
  }, []);

  async function handleSubmit(values: PledgeFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const pledge = await insertPledge(supabase, {
        donorId: values.donor.id,
        donorName: values.donor.name,
        totalAmount: values.totalAmount,
        dueDate: values.dueDate,
      });
      setPledges((prev) => [pledge, ...(prev ?? [])]);
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save pledge.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(pledgeId: string) {
    setCompletingId(pledgeId);
    setCompleteError(null);
    try {
      const supabase = createClient();
      await completePledge(supabase, pledgeId);
      setPledges((prev) => (prev ? prev.filter((p) => p.id !== pledgeId) : prev));
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : "Could not mark pledge completed.");
    } finally {
      setCompletingId(null);
    }
  }

  const list = pledges ?? [];
  const today = new Date();

  return (
    <div>
      <PageHeader
        eyebrow={`${list.length} active`}
        title="Pledges"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink"
            aria-label="Add pledge"
          >
            <Plus size={18} />
          </button>
        }
      />

      {completeError && <p className="px-5 pt-4 text-[13px] text-negative">{completeError}</p>}

      <div className="mt-5 flex flex-col gap-3 px-5">
        {list.map((p) => {
          const pct = Math.min(100, (p.amountReceived / p.totalAmount) * 100);
          const behind = pct < 50 && p.nextDueDate !== undefined && new Date(p.nextDueDate) < today;

          return (
            <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-rule bg-paper-raised p-4">
              <button
                type="button"
                onClick={() => handleComplete(p.id)}
                disabled={completingId === p.id}
                aria-label="Mark pledge completed"
                title="Mark completed"
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-rule-strong disabled:opacity-40"
              />

              <Link href={`/donors/${p.donorId}`} className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[17px] text-ink">{p.donorName}</p>
                  {behind && (
                    <span className="rounded-full border border-negative/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-negative">
                      Behind
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <p className="tnum text-[20px] text-accent">{formatMoney(p.amountReceived, p.currency)}</p>
                  <p className="tnum text-[13px] text-muted">of {formatMoney(p.totalAmount, p.currency)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2.5 text-[13px] text-ink-soft">Due {p.nextDueDate ?? "—"}</p>
              </Link>
            </div>
          );
        })}
        {pledges !== null && list.length === 0 && (
          <p className="px-5 py-10 text-center text-[13px] text-muted">No pledges yet.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add pledge">
        {error && <p className="mb-4 text-[13px] text-negative">{error}</p>}
        <PledgeForm onSubmit={handleSubmit} submitting={submitting} />
      </Modal>
    </div>
  );
}
