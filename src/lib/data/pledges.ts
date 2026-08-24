import type { SupabaseClient } from "@supabase/supabase-js";
import { ensurePledgeReminder } from "@/lib/data/pledge-reminders";

export type PledgeProgress = {
  id: string;
  donorId: string;
  totalAmount: number;
  currency: string;
  nextDueDate?: string;
  amountReceived: number;
};

export type PledgeWithDonor = PledgeProgress & { donorName: string };

const PROGRESS_COLUMNS = "pledge_id, donor_id, total_amount, currency, next_due_date, amount_received";

function mapProgress(row: Record<string, unknown>): PledgeProgress {
  return {
    id: row.pledge_id as string,
    donorId: row.donor_id as string,
    totalAmount: Number(row.total_amount),
    currency: row.currency as string,
    nextDueDate: (row.next_due_date as string | null) ?? undefined,
    amountReceived: Number(row.amount_received),
  };
}

export async function fetchPledgesWithProgress(supabase: SupabaseClient): Promise<PledgeWithDonor[]> {
  const { data, error } = await supabase
    .from("pledge_progress")
    .select(`${PROGRESS_COLUMNS}, donors(name)`)
    .order("next_due_date", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown> & {
      donors: { name: string } | { name: string }[] | null;
    };
    const donor = Array.isArray(r.donors) ? r.donors[0] : r.donors;
    return { ...mapProgress(r), donorName: donor?.name ?? "Unknown donor" };
  });
}

export async function fetchPledgeForDonor(supabase: SupabaseClient, donorId: string): Promise<PledgeProgress | null> {
  const { data, error } = await supabase
    .from("pledge_progress")
    .select(PROGRESS_COLUMNS)
    .eq("donor_id", donorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProgress(data);
}

/**
 * Pledges are kept simple: donor, amount, due date. Under the hood the
 * pledges table still has `frequency`/`start_date` columns (avoids a
 * destructive migration) — every pledge created here is just stored as a
 * one-off with today's start date, so the recurring-reminder chaining in
 * pledge-reminders.ts naturally never fires for it.
 */
export async function insertPledge(
  supabase: SupabaseClient,
  input: {
    donorId: string;
    donorName: string;
    totalAmount: number;
    dueDate: string;
  }
): Promise<PledgeWithDonor> {
  const currency = "ETB";
  const { data, error } = await supabase
    .from("pledges")
    .insert({
      donor_id: input.donorId,
      total_amount: input.totalAmount,
      currency,
      frequency: "One-time",
      start_date: new Date().toISOString().slice(0, 10),
      next_due_date: input.dueDate,
    })
    .select("id")
    .single();
  if (error) throw error;

  await ensurePledgeReminder(supabase, data.id);

  return {
    id: data.id,
    donorId: input.donorId,
    donorName: input.donorName,
    totalAmount: input.totalAmount,
    currency,
    nextDueDate: input.dueDate,
    amountReceived: 0,
  };
}

/**
 * Archives a pledge: marks it Completed (dropping it out of pledge_progress,
 * so it disappears from the active pledges list and donor detail's "Active
 * pledge" section) and closes out its pending "Pledge due" reminder, if any.
 * Its donations are untouched — they stay exactly where they are in the
 * donations history.
 */
export async function completePledge(supabase: SupabaseClient, pledgeId: string): Promise<void> {
  const { error } = await supabase.from("pledges").update({ status: "Completed" }).eq("id", pledgeId);
  if (error) throw error;

  const { error: reminderError } = await supabase
    .from("reminders")
    .update({ status: "Done" })
    .eq("pledge_id", pledgeId)
    .eq("type", "Pledge due")
    .eq("status", "Pending");
  if (reminderError) throw reminderError;
}
