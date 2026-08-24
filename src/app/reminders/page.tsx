"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import DonorPicker from "@/components/DonorPicker";
import { createClient } from "@/lib/supabase/client";
import { fetchReminders, insertReminder, ReminderWithDonor, updateReminderStatus } from "@/lib/data/reminders";
import { DonorSummary, ReminderType } from "@/lib/types";

type ManualReminderType = Exclude<ReminderType, "Pledge due">;
const manualReminderTypes: ManualReminderType[] = ["Follow-up", "Report deadline", "Thank-you"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithDonor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchReminders(supabase).then((data) => {
      setReminders(data);
      setLoaded(true);
    });
  }, []);

  async function toggle(id: string, current: ReminderWithDonor["status"]) {
    const next = current === "Pending" ? "Done" : "Pending";
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    const supabase = createClient();
    try {
      await updateReminderStatus(supabase, id, next);
    } catch {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: current } : r)));
    }
  }

  async function handleAdd(values: {
    type: ManualReminderType;
    donor: DonorSummary | null;
    dueDate: string;
    note: string;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const id = await insertReminder(supabase, {
        type: values.type,
        donorId: values.donor?.id,
        dueDate: values.dueDate,
        note: values.note,
      });
      setReminders((prev) => [
        {
          id,
          type: values.type,
          donorId: values.donor?.id,
          donorName: values.donor?.name,
          dueDate: values.dueDate,
          note: values.note,
          status: "Pending",
        },
        ...prev,
      ]);
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save reminder.");
    } finally {
      setSubmitting(false);
    }
  }

  const pending = reminders.filter((r) => r.status === "Pending");
  const done = reminders.filter((r) => r.status === "Done");

  return (
    <div>
      <PageHeader
        eyebrow={`${pending.length} pending`}
        title="Reminders"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink"
            aria-label="Add reminder"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-5 pt-6">
        {pending.length > 0 && (
          <div className="rounded-2xl border border-rule bg-paper-raised">
            {pending.map((r) => (
              <div key={r.id} className="ledger-row flex items-start gap-3 px-4 py-3.5">
                <button
                  onClick={() => toggle(r.id, r.status)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-rule-strong"
                  aria-label="Mark done"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-ink">{r.note}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {r.type} {r.donorName ? `· ${r.donorName}` : ""} · due {r.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <>
            <p className="mb-2 mt-8 text-[11px] uppercase tracking-[0.14em] text-muted">Done</p>
            <div className="rounded-2xl border border-rule bg-paper-raised">
              {done.map((r) => (
                <div key={r.id} className="ledger-row flex items-start gap-3 px-4 py-3.5 opacity-50">
                  <button
                    onClick={() => toggle(r.id, r.status)}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink"
                    aria-label="Mark pending"
                  >
                    <Check size={12} className="text-paper" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink line-through">{r.note}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {r.type} {r.donorName ? `· ${r.donorName}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {loaded && reminders.length === 0 && (
          <p className="px-5 py-10 text-center text-[13px] text-muted">No reminders.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add reminder">
        {error && <p className="mb-4 text-[13px] text-negative">{error}</p>}
        <AddReminderForm onSubmit={handleAdd} submitting={submitting} />
      </Modal>
    </div>
  );
}

function AddReminderForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: { type: ManualReminderType; donor: DonorSummary | null; dueDate: string; note: string }) => void;
  submitting: boolean;
}) {
  const [type, setType] = useState<ManualReminderType>("Follow-up");
  const [donor, setDonor] = useState<DonorSummary | null>(null);
  const [dueDate, setDueDate] = useState(today());
  const [note, setNote] = useState("");

  const canSubmit = note.trim() !== "" && dueDate !== "" && !submitting;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ type, donor, dueDate, note: note.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] text-muted">Type</p>
        <div className="flex flex-wrap gap-2">
          {manualReminderTypes.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                type === t ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Donor (optional)</p>
        <DonorPicker value={donor} onChange={setDonor} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] text-muted">Due date</span>
        <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-transparent text-[16px] text-ink outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] text-muted">Note</span>
        <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to happen?"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
          />
        </div>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mb-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-ink disabled:opacity-30"
      >
        {submitting ? "Saving…" : "Save reminder"}
      </button>
    </form>
  );
}
