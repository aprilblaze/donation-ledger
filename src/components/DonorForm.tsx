"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DonorCategory, DonorType, isIndividualDonorType, PaymentMethod } from "@/lib/types";

const donorTypes: DonorType[] = [
  "Local Individual",
  "Diaspora Individual",
  "Organization",
  "Government",
  "Foundation",
  "Church",
];
const categories: DonorCategory[] = ["Recurring", "One-time", "In-kind"];
const paymentMethods: PaymentMethod[] = ["Cash", "Bank transfer", "Mobile money", "Cheque", "In-kind"];

export type DonorFormValues = {
  name: string;
  donorType: DonorType;
  category: DonorCategory;
  address: string;
  phone: string;
  email: string;
  notes: string;
  contactPersonName: string;
  registrationId: string;
  // Only ever filled in (and acted on) when promptPaymentOnRecurring is set
  // and category is "Recurring" — an optional first payment to record
  // alongside the donor. Left blank, no donation is created.
  firstPaymentAmount: string;
  firstPaymentMethod: PaymentMethod;
  firstPaymentPurpose: string;
};

const emptyValues: DonorFormValues = {
  name: "",
  donorType: "Local Individual",
  category: "One-time",
  address: "",
  phone: "",
  email: "",
  notes: "",
  contactPersonName: "",
  registrationId: "",
  firstPaymentAmount: "",
  firstPaymentMethod: "Cash",
  firstPaymentPurpose: "",
};

export default function DonorForm({
  onSubmit,
  submitting = false,
  submitLabel = "Save donor",
  promptPaymentOnRecurring = false,
}: {
  onSubmit: (values: DonorFormValues) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  promptPaymentOnRecurring?: boolean;
}) {
  const [values, setValues] = useState<DonorFormValues>(emptyValues);
  const needsOrgFields = !isIndividualDonorType(values.donorType);
  const showPaymentSection = promptPaymentOnRecurring && values.category === "Recurring";

  function update<K extends keyof DonorFormValues>(key: K, value: DonorFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || submitting) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="donor-name">Name</Label>
        <Input
          id="donor-name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Donor or organization name"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="donor-type">Donor type</Label>
        <Select value={values.donorType} onValueChange={(v) => update("donorType", v as DonorType)}>
          <SelectTrigger id="donor-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {donorTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="donor-category">Category</Label>
        <Select value={values.category} onValueChange={(v) => update("category", v as DonorCategory)}>
          <SelectTrigger id="donor-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showPaymentSection && (
        <div className="grid gap-3 rounded-lg border border-rule p-3">
          <p className="text-[13px] font-medium text-ink">First payment (optional)</p>
          <div className="grid gap-1.5">
            <Label htmlFor="donor-payment-amount">Amount (ETB)</Label>
            <Input
              id="donor-payment-amount"
              type="number"
              inputMode="decimal"
              value={values.firstPaymentAmount}
              onChange={(e) => update("firstPaymentAmount", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="donor-payment-method">Payment method</Label>
            <Select
              value={values.firstPaymentMethod}
              onValueChange={(v) => update("firstPaymentMethod", v as PaymentMethod)}
            >
              <SelectTrigger id="donor-payment-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="donor-payment-purpose">Purpose</Label>
            <Input
              id="donor-payment-purpose"
              value={values.firstPaymentPurpose}
              onChange={(e) => update("firstPaymentPurpose", e.target.value)}
              placeholder="Unrestricted"
            />
          </div>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="donor-address">Address</Label>
        <Input
          id="donor-address"
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Street, city…"
        />
      </div>

      {needsOrgFields && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="donor-contact">Contact person name</Label>
            <Input
              id="donor-contact"
              value={values.contactPersonName}
              onChange={(e) => update("contactPersonName", e.target.value)}
              placeholder="Who to contact"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="donor-registration">Registration / Tax ID (optional)</Label>
            <Input
              id="donor-registration"
              value={values.registrationId}
              onChange={(e) => update("registrationId", e.target.value)}
              placeholder="Registration or tax ID"
            />
          </div>
        </>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="donor-phone">Phone</Label>
        <Input
          id="donor-phone"
          type="tel"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+251 9…"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="donor-email">Email</Label>
        <Input
          id="donor-email"
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="name@example.com"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="donor-notes">Notes</Label>
        <Textarea
          id="donor-notes"
          rows={3}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Relationship history, preferences…"
        />
      </div>

      <Button type="submit" disabled={!values.name.trim() || submitting} className="mt-2 w-full">
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
