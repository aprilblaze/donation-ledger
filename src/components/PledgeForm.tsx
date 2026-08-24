"use client";

import { FormEvent, useState } from "react";
import DonorSelect from "@/components/DonorSelect";
import { DonorSummary } from "@/lib/types";

export type PledgeFormValues = {
  donor: DonorSummary;
  totalAmount: number;
  dueDate: string;
};

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

const dueDateOptions = [
  { label: "1 week", date: addDays(7) },
  { label: "2 weeks", date: addDays(14) },
  { label: "3 weeks", date: addDays(21) },
  { label: "1 month", date: addMonth() },
];

export default function PledgeForm({
  onSubmit,
  submitting = false,
}: {
  onSubmit: (values: PledgeFormValues) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [donorId, setDonorId] = useState("");
  const [donor, setDonor] = useState<DonorSummary | null>(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const canSubmit =
    donor !== null && totalAmount !== "" && Number(totalAmount) > 0 && dueDate !== "" && !submitting;

  function handleDonorChange(id: string, d: DonorSummary) {
    setDonorId(id);
    setDonor(d);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !donor) return;
    onSubmit({ donor, totalAmount: Number(totalAmount), dueDate });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[13px] text-muted">Donor</p>
        <DonorSelect value={donorId} onChange={handleDonorChange} />
      </div>

      <Field label="Amount (ETB)">
        <input
          type="number"
          inputMode="decimal"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
        />
      </Field>

      <div>
        <p className="mb-2 text-[13px] text-muted">Due date</p>
        <div className="flex flex-wrap gap-2">
          {dueDateOptions.map((opt) => (
            <button
              type="button"
              key={opt.label}
              onClick={() => setDueDate(opt.date)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                dueDate === opt.date ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-rule bg-paper-raised px-4 py-3.5 text-[16px] text-ink outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mb-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-ink disabled:opacity-30"
      >
        {submitting ? "Saving…" : "Save pledge"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted">{label}</span>
      <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">{children}</div>
    </label>
  );
}
