"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import DonorSelect from "@/components/DonorSelect";
import { createClient } from "@/lib/supabase/client";
import { insertDonation } from "@/lib/data/donations";
import { fetchPledgeForDonor, PledgeProgress } from "@/lib/data/pledges";
import { uploadReceipt } from "@/lib/supabase/storage";
import { formatMoney } from "@/lib/format";
import { Donation, DonorSummary, PaymentMethod } from "@/lib/types";

const paymentMethods: PaymentMethod[] = ["Cash", "Bank transfer", "Mobile money", "Cheque", "In-kind"];
const purposes = [
  "Unrestricted",
  "Roof repair fund",
  "Youth ministry",
  "Building fund",
  "Medical",
  "Food",
  "Tuition",
];

export default function DonationForm({
  onSaved,
  onClose,
}: {
  onSaved: (donation: Donation, donor: DonorSummary) => void;
  onClose: () => void;
}) {
  const supabaseRef = useRef(createClient());

  const [donorId, setDonorId] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<DonorSummary | null>(null);
  const [selectedPledge, setSelectedPledge] = useState<PledgeProgress | null>(null);
  const [applyToPledge, setApplyToPledge] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [purpose, setPurpose] = useState(purposes[0]);
  const [showOtherPurpose, setShowOtherPurpose] = useState(false);

  function selectPurpose(p: string) {
    setShowOtherPurpose(false);
    setPurpose(p);
  }

  function selectOtherPurpose() {
    setShowOtherPurpose(true);
    setPurpose("");
  }

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<Donation | null>(null);
  const [resultDonorName, setResultDonorName] = useState("");

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

  useEffect(() => {
    if (!donorId) return;
    let cancelled = false;
    fetchPledgeForDonor(supabaseRef.current, donorId).then((pledge) => {
      if (cancelled) return;
      setSelectedPledge(pledge);
      setApplyToPledge(pledge !== null);
    });
    return () => {
      cancelled = true;
    };
  }, [donorId]);

  function handleDonorChange(id: string, donor: DonorSummary) {
    setDonorId(id);
    setSelectedDonor(donor);
    setSelectedPledge(null);
    setApplyToPledge(false);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function removeReceipt() {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
  }

  const canSubmit =
    donorId !== "" &&
    amount !== "" &&
    Number(amount) > 0 &&
    (!showOtherPurpose || purpose.trim() !== "") &&
    !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedDonor) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = supabaseRef.current;
      let receiptImageUrl: string | undefined;
      if (receiptFile) {
        receiptImageUrl = await uploadReceipt(supabase, receiptFile);
      }
      const donation = await insertDonation(supabase, {
        donorId,
        amount: Number(amount),
        currency: "ETB",
        paymentMethod: method,
        purpose: purpose.trim(),
        receiptImageUrl,
        pledgeId: applyToPledge && selectedPledge ? selectedPledge.id : undefined,
      });
      setResult(donation);
      setResultDonorName(selectedDonor.name);
      onSaved(donation, selectedDonor);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not save gift.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Receipt {result.receiptNumber}</p>
        <p className="tnum mt-3 text-[32px] leading-none text-accent">{formatMoney(result.amount, result.currency)}</p>
        <p className="mt-2 font-display text-lg text-ink">{resultDonorName}</p>
        <p className="mt-1 text-[13px] text-muted">
          {method} · {purpose}
        </p>
        {result.receiptImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.receiptImageUrl}
            alt="Receipt"
            className="mx-auto mt-4 h-24 w-24 rounded-xl border border-rule object-cover"
          />
        )}
        <button
          onClick={onClose}
          className="mt-6 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-ink"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] text-muted">Donor</p>
        <DonorSelect value={donorId} onChange={handleDonorChange} />
      </div>

      {selectedPledge && (
        <label className="flex items-start gap-3 rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
          <input
            type="checkbox"
            checked={applyToPledge}
            onChange={(e) => setApplyToPledge(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
          />
          <span className="text-[13px] text-ink-soft">
            Apply to their pledge — {formatMoney(selectedPledge.totalAmount, selectedPledge.currency)} total, due{" "}
            {selectedPledge.nextDueDate ?? "—"}
          </span>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[13px] text-muted">Amount</span>
        <div className="flex items-baseline gap-2 rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
          <span className="tnum text-[16px] text-muted">ETB</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="tnum w-full bg-transparent text-[18px] text-accent outline-none placeholder:text-rule-strong"
          />
        </div>
      </label>

      <div>
        <p className="mb-2 text-[13px] text-muted">Payment method</p>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                method === m ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Purpose</p>
        <div className="flex flex-wrap gap-2">
          {purposes.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => selectPurpose(p)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                purpose === p && !showOtherPurpose
                  ? "border-accent bg-accent text-ink"
                  : "border-rule-strong text-ink-soft"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={selectOtherPurpose}
            className={`rounded-full border px-3.5 py-2 text-[13px] ${
              showOtherPurpose ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
            }`}
          >
            Other
          </button>
        </div>
        {showOtherPurpose && (
          <input
            type="text"
            autoFocus
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe the purpose"
            className="mt-2 w-full rounded-2xl border border-rule bg-paper-raised px-4 py-3 text-[14px] text-ink outline-none placeholder:text-muted"
          />
        )}
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Receipt photo (optional)</p>
        {receiptPreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="h-20 w-20 rounded-xl border border-rule object-cover"
            />
            <button
              type="button"
              onClick={removeReceipt}
              className="flex items-center gap-1 text-[13px] text-ink-soft"
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-rule-strong py-6 text-[13px] text-ink-soft">
            <Camera size={16} /> Attach receipt photo
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          </label>
        )}
      </div>

      {submitError && <p className="text-[13px] text-negative">{submitError}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mb-1 rounded-full bg-accent py-3.5 text-[15px] font-medium text-ink disabled:opacity-30"
      >
        {submitting ? "Saving…" : "Save donation"}
      </button>
    </form>
  );
}
