"use client";

import { FormEvent, useState } from "react";
import DonorSelect from "@/components/DonorSelect";
import { DonorSummary, PledgeFrequency } from "@/lib/types";

const frequencies: PledgeFrequency[] = ["One-time", "Monthly", "Quarterly", "Annual"];

export type PledgeFormValues = {
  donor: DonorSummary;
  totalAmount: number;
  frequency: PledgeFrequency;
  startDate: string;
  nextDueDate: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

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
  const [frequency, setFrequency] = useState<PledgeFrequency>("Monthly");
  const [startDate, setStartDate] = useState(today());
  const [nextDueDate, setNextDueDate] = useState("");

  const canSubmit = donor !== null && totalAmount !== "" && Number(totalAmount) > 0 && !submitting;

  function handleDonorChange(id: string, d: DonorSummary) {
    setDonorId(id);
    setDonor(d);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !donor) return;
    onSubmit({ donor, totalAmount: Number(totalAmount), frequency, startDate, nextDueDate });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[13px] text-muted">Donor</p>
        <DonorSelect value={donorId} onChange={handleDonorChange} />
      </div>

      <Field label="Total pledge amount (ETB)">
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
        <p className="mb-2 text-[13px] text-muted">Frequency</p>
        <div className="flex flex-wrap gap-2">
          {frequencies.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFrequency(f)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                frequency === f ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-transparent text-[16px] text-ink outline-none"
        />
      </Field>

      <Field label="Next due date (optional — schedules a reminder)">
        <input
          type="date"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
          className="w-full bg-transparent text-[16px] text-ink outline-none"
        />
      </Field>

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
