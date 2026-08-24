import type { SupabaseClient } from "@supabase/supabase-js";
import { completePledgeReminder } from "@/lib/data/pledge-reminders";
import { Donation, DonationStatus, DonorCategory, PaymentMethod } from "@/lib/types";

const DONATION_COLUMNS =
  "id, donor_id, date_received, amount, currency, payment_method, purpose, type, pledge_id, receipt_number, status, receipt_image_url";

function mapDonation(row: Record<string, unknown>): Donation {
  return {
    id: row.id as string,
    donorId: row.donor_id as string,
    dateReceived: row.date_received as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    paymentMethod: row.payment_method as PaymentMethod,
    purpose: row.purpose as string,
    type: row.type as Donation["type"],
    pledgeId: (row.pledge_id as string | null) ?? undefined,
    receiptNumber: row.receipt_number as string,
    status: row.status as Donation["status"],
    receiptImageUrl: (row.receipt_image_url as string | null) ?? undefined,
  };
}

export async function fetchDonationsForDonor(supabase: SupabaseClient, donorId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select(DONATION_COLUMNS)
    .eq("donor_id", donorId)
    .order("date_received", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDonation);
}

export async function insertDonation(
  supabase: SupabaseClient,
  input: {
    donorId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    purpose: string;
    receiptImageUrl?: string;
    pledgeId?: string;
  }
): Promise<Donation> {
  const { data, error } = await supabase
    .from("donations")
    .insert({
      donor_id: input.donorId,
      amount: input.amount,
      currency: input.currency,
      payment_method: input.paymentMethod,
      purpose: input.purpose,
      type: input.pledgeId ? "Pledge installment" : "One-time",
      pledge_id: input.pledgeId ?? null,
      receipt_image_url: input.receiptImageUrl ?? null,
    })
    .select(DONATION_COLUMNS)
    .single();
  if (error) throw error;

  if (input.pledgeId) {
    await completePledgeReminder(supabase, input.pledgeId);
  }

  return mapDonation(data);
}

export type DonationSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "donor_asc";

export type DonationListItem = {
  id: string;
  donorId: string;
  donorName: string;
  donorCategory: DonorCategory;
  dateReceived: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  purpose: string;
  status: DonationStatus;
  receiptImageUrl?: string;
};

// `!inner` is required so `.order(..., { referencedTable: "donors" })` below
// actually affects row order (donor_id is not-null, so no rows are dropped).
const LIST_COLUMNS =
  "id, donor_id, date_received, amount, currency, payment_method, purpose, status, receipt_image_url, donors!inner(name, category)";

export async function fetchDonationsPage(
  supabase: SupabaseClient,
  {
    sort,
    donorCategory,
    offset,
    limit = 30,
  }: { sort: DonationSort; donorCategory?: DonorCategory; offset: number; limit?: number }
): Promise<DonationListItem[]> {
  let query = supabase.from("donations").select(LIST_COLUMNS);

  if (donorCategory) {
    query = query.eq("donors.category", donorCategory);
  }

  switch (sort) {
    case "date_desc":
      query = query.order("date_received", { ascending: false });
      break;
    case "date_asc":
      query = query.order("date_received", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount", { ascending: true });
      break;
    case "donor_asc":
      query = query.order("name", { referencedTable: "donors", ascending: true });
      break;
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      donor_id: string;
      date_received: string;
      amount: number;
      currency: string;
      payment_method: PaymentMethod;
      purpose: string;
      status: DonationStatus;
      receipt_image_url: string | null;
      donors: { name: string; category: DonorCategory } | { name: string; category: DonorCategory }[] | null;
    };
    const donor = Array.isArray(r.donors) ? r.donors[0] : r.donors;
    return {
      id: r.id,
      donorId: r.donor_id,
      donorName: donor?.name ?? "Unknown donor",
      donorCategory: donor?.category ?? "One-time",
      dateReceived: r.date_received,
      amount: Number(r.amount),
      currency: r.currency,
      paymentMethod: r.payment_method,
      purpose: r.purpose,
      status: r.status,
      receiptImageUrl: r.receipt_image_url ?? undefined,
    };
  });
}

export type DashboardDonation = {
  id: string;
  dateReceived: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  donorName: string;
};

export async function fetchThisMonthDonations(
  supabase: SupabaseClient,
  monthStart: string
): Promise<DashboardDonation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("id, date_received, amount, currency, payment_method, donors(name)")
    .gte("date_received", monthStart)
    .order("date_received", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      date_received: string;
      amount: number;
      currency: string;
      payment_method: PaymentMethod;
      donors: { name: string } | { name: string }[] | null;
    };
    const donor = Array.isArray(r.donors) ? r.donors[0] : r.donors;
    return {
      id: r.id,
      dateReceived: r.date_received,
      amount: Number(r.amount),
      currency: r.currency,
      paymentMethod: r.payment_method,
      donorName: donor?.name ?? "Unknown donor",
    };
  });
}
