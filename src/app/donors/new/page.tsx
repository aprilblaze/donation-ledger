"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import DonorForm, { DonorFormValues } from "@/components/DonorForm";
import { useDonors } from "@/lib/donors-context";

export default function NewDonorPage() {
  const router = useRouter();
  const { addDonor } = useDonors();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: DonorFormValues) {
    setSubmitting(true);
    setError(null);
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
      router.push(`/donors/${donor.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save donor.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <header className="border-b border-rule px-5 pb-4 pt-6">
        <Link href="/donors" className="flex items-center gap-1 text-[13px] text-ink-soft">
          <ChevronLeft size={16} /> Donors
        </Link>
        <h1 className="mt-3 font-display text-[26px] text-ink">New donor</h1>
      </header>

      <div className="px-5 pb-8 pt-6">
        {error && <p className="mb-4 text-[13px] text-negative">{error}</p>}
        <DonorForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
