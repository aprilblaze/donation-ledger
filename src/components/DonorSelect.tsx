"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import DonorForm, { DonorFormValues } from "@/components/DonorForm";
import { useDonors } from "@/lib/donors-context";
import { DonorSummary } from "@/lib/types";

const ADD_DONOR_VALUE = "__add_donor__";

export default function DonorSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (donorId: string, donor: DonorSummary) => void;
}) {
  const { donors, ensureLoaded, addDonor } = useDonors();

  const [addDonorOpen, setAddDonorOpen] = useState(false);
  const [donorFormSubmitting, setDonorFormSubmitting] = useState(false);
  const [donorFormError, setDonorFormError] = useState<string | null>(null);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === ADD_DONOR_VALUE) {
      setAddDonorOpen(true);
      return;
    }
    const donor = donors.find((d) => d.id === val);
    if (donor) onChange(val, donor);
  }

  async function handleAddDonor(values: DonorFormValues) {
    setDonorFormSubmitting(true);
    setDonorFormError(null);
    try {
      const donor = await addDonor({
        name: values.name.trim(),
        donorType: values.donorType,
        category: values.category,
        location: values.location,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        notes: values.notes.trim() || undefined,
        contactPersonName:
          values.donorType === "Individual" ? undefined : values.contactPersonName.trim() || undefined,
        registrationId: values.donorType === "Individual" ? undefined : values.registrationId.trim() || undefined,
      });
      onChange(donor.id, donor);
      setAddDonorOpen(false);
    } catch (e) {
      setDonorFormError(e instanceof Error ? e.message : "Could not save donor.");
    } finally {
      setDonorFormSubmitting(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
        <select
          value={value}
          onChange={handleChange}
          className="w-full bg-transparent text-[16px] text-ink outline-none"
        >
          <option value="" disabled>
            Select a donor…
          </option>
          {donors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
          <option value={ADD_DONOR_VALUE}>+ Add new donor…</option>
        </select>
      </div>

      <Modal open={addDonorOpen} onClose={() => setAddDonorOpen(false)} title="Add donor">
        {donorFormError && <p className="mb-4 text-[13px] text-negative">{donorFormError}</p>}
        <DonorForm onSubmit={handleAddDonor} submitting={donorFormSubmitting} submitLabel="Save & select donor" />
      </Modal>
    </>
  );
}
