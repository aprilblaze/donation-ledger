"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import DonorForm, { DonorFormValues } from "@/components/DonorForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDonors } from "@/lib/donors-context";
import { DonorSummary, isIndividualDonorType } from "@/lib/types";

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

  function handleValueChange(val: string | null) {
    if (val === ADD_DONOR_VALUE) {
      setAddDonorOpen(true);
      return;
    }
    const donor = donors.find((d) => d.id === val);
    if (donor) onChange(donor.id, donor);
  }

  async function handleAddDonor(values: DonorFormValues) {
    setDonorFormSubmitting(true);
    setDonorFormError(null);
    try {
      const isIndividual = isIndividualDonorType(values.donorType);
      const donor = await addDonor({
        name: values.name.trim(),
        donorType: values.donorType,
        category: values.category,
        address: values.address.trim() || undefined,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        notes: values.notes.trim() || undefined,
        contactPersonName: isIndividual ? undefined : values.contactPersonName.trim() || undefined,
        registrationId: isIndividual ? undefined : values.registrationId.trim() || undefined,
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
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a donor…" />
        </SelectTrigger>
        <SelectContent>
          {donors.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={ADD_DONOR_VALUE}>+ Add new donor…</SelectItem>
        </SelectContent>
      </Select>

      <Modal open={addDonorOpen} onClose={() => setAddDonorOpen(false)} title="Add donor">
        {donorFormError && <p className="mb-4 text-[13px] text-negative">{donorFormError}</p>}
        <DonorForm onSubmit={handleAddDonor} submitting={donorFormSubmitting} submitLabel="Save & select donor" />
      </Modal>
    </>
  );
}
