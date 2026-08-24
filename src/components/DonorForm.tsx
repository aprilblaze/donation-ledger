"use client";

import { FormEvent, useState } from "react";
import { DonorCategory, DonorLocation, DonorType } from "@/lib/types";

const donorTypes: DonorType[] = ["Individual", "Organization", "Government", "Foundation", "Church"];
const categories: DonorCategory[] = ["Recurring", "One-time", "In-kind"];
const locations: DonorLocation[] = ["Local", "Abroad"];

export type DonorFormValues = {
  name: string;
  donorType: DonorType;
  category: DonorCategory;
  location: DonorLocation;
  phone: string;
  email: string;
  notes: string;
  contactPersonName: string;
  registrationId: string;
};

const emptyValues: DonorFormValues = {
  name: "",
  donorType: "Individual",
  category: "One-time",
  location: "Local",
  phone: "",
  email: "",
  notes: "",
  contactPersonName: "",
  registrationId: "",
};

export default function DonorForm({
  onSubmit,
  submitting = false,
  submitLabel = "Save donor",
}: {
  onSubmit: (values: DonorFormValues) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<DonorFormValues>(emptyValues);
  const needsOrgFields = values.donorType !== "Individual";

  function update<K extends keyof DonorFormValues>(key: K, value: DonorFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || submitting) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="Name">
        <input
          type="text"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Donor or organization name"
          className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
        />
      </Field>

      <div>
        <p className="mb-2 text-[13px] text-muted">Donor type</p>
        <div className="flex flex-wrap gap-2">
          {donorTypes.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => update("donorType", t)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                values.donorType === t ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => update("category", c)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                values.category === c ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] text-muted">Location</p>
        <div className="flex flex-wrap gap-2">
          {locations.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => update("location", l)}
              className={`rounded-full border px-3.5 py-2 text-[13px] ${
                values.location === l ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {needsOrgFields && (
        <>
          <Field label="Contact person name">
            <input
              type="text"
              value={values.contactPersonName}
              onChange={(e) => update("contactPersonName", e.target.value)}
              placeholder="Who to contact"
              className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            />
          </Field>

          <Field label="Registration / Tax ID (optional)">
            <input
              type="text"
              value={values.registrationId}
              onChange={(e) => update("registrationId", e.target.value)}
              placeholder="Registration or tax ID"
              className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            />
          </Field>
        </>
      )}

      <Field label="Phone">
        <input
          type="tel"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+251 9…"
          className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="name@example.com"
          className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
        />
      </Field>

      <Field label="Notes">
        <textarea
          rows={3}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Relationship history, preferences…"
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </Field>

      <button
        type="submit"
        disabled={!values.name.trim() || submitting}
        className="mb-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-ink disabled:opacity-30"
      >
        {submitting ? "Saving…" : submitLabel}
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
