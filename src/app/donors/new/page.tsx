"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import DonorForm, { DonorFormValues } from "@/components/DonorForm";
import { useDonors } from "@/lib/donors-context";
import { createClient } from "@/lib/supabase/client";
import { insertDonation } from "@/lib/data/donations";
import { isIndividualDonorType } from "@/lib/types";

export default function NewDonorPage() {
  const router = useRouter();
  const { addDonor } = useDonors();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: DonorFormValues) {
    setSubmitting(true);
    setError(null);
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

      const paymentAmount = Number(values.firstPaymentAmount);
      if (values.category === "Recurring" && values.firstPaymentAmount.trim() && paymentAmount > 0) {
        const supabase = createClient();
        await insertDonation(supabase, {
          donorId: donor.id,
          amount: paymentAmount,
          currency: "ETB",
          paymentMethod: values.firstPaymentMethod,
          purpose: values.firstPaymentPurpose.trim() || "Unrestricted",
        });
      }

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
        <DonorForm onSubmit={handleSubmit} submitting={submitting} promptPaymentOnRecurring />
      </div>
    </div>
  );
}
