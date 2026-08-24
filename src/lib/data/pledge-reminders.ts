import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoney } from "@/lib/format";
import { PledgeFrequency } from "@/lib/types";

export function pledgeDueNote(frequency: PledgeFrequency, totalAmount: number, currency: string): string {
  const prefix = frequency === "One-time" ? "Pledge" : `${frequency} pledge installment`;
  return `${prefix} due (${formatMoney(totalAmount, currency)} pledge)`;
}

function addInterval(dateStr: string, frequency: Exclude<PledgeFrequency, "One-time">): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (frequency === "Monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "Quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Upserts the pledge's "Pledge due" reminder to match its current
 * next_due_date: updates the existing pending one if there is one, otherwise
 * creates it. No-op if the pledge has no next_due_date. Called on pledge
 * creation, on next_due_date edits, and (via completePledgeReminder) after
 * each installment is recorded.
 */
export async function ensurePledgeReminder(supabase: SupabaseClient, pledgeId: string): Promise<void> {
  const { data: pledge, error: pledgeError } = await supabase
    .from("pledges")
    .select("donor_id, total_amount, currency, frequency, next_due_date")
    .eq("id", pledgeId)
    .single();
  if (pledgeError) throw pledgeError;
  if (!pledge.next_due_date) return;

  const note = pledgeDueNote(
    pledge.frequency as PledgeFrequency,
    Number(pledge.total_amount),
    pledge.currency as string
  );

  const { data: existing, error: findError } = await supabase
    .from("reminders")
    .select("id")
    .eq("pledge_id", pledgeId)
    .eq("type", "Pledge due")
    .eq("status", "Pending")
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("reminders")
      .update({ due_date: pledge.next_due_date, note })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("reminders").insert({
      type: "Pledge due",
      donor_id: pledge.donor_id,
      pledge_id: pledgeId,
      due_date: pledge.next_due_date,
      note,
      status: "Pending",
    });
    if (error) throw error;
  }
}

export async function updatePledgeNextDueDate(
  supabase: SupabaseClient,
  pledgeId: string,
  nextDueDate: string
): Promise<void> {
  const { error } = await supabase.from("pledges").update({ next_due_date: nextDueDate }).eq("id", pledgeId);
  if (error) throw error;
  await ensurePledgeReminder(supabase, pledgeId);
}

/**
 * Marks the pledge's current pending "Pledge due" reminder Done. For
 * recurring pledges (not One-time), advances pledges.next_due_date by one
 * interval and schedules the next reminder to match.
 */
export async function completePledgeReminder(supabase: SupabaseClient, pledgeId: string): Promise<void> {
  const { data: reminder, error: findError } = await supabase
    .from("reminders")
    .select("id, due_date")
    .eq("pledge_id", pledgeId)
    .eq("type", "Pledge due")
    .eq("status", "Pending")
    .maybeSingle();
  if (findError) throw findError;
  if (!reminder) return;

  const { error: doneError } = await supabase.from("reminders").update({ status: "Done" }).eq("id", reminder.id);
  if (doneError) throw doneError;

  const { data: pledge, error: pledgeError } = await supabase
    .from("pledges")
    .select("frequency")
    .eq("id", pledgeId)
    .single();
  if (pledgeError) throw pledgeError;

  const frequency = pledge.frequency as PledgeFrequency;
  if (frequency === "One-time") return;

  const nextDueDate = addInterval(reminder.due_date as string, frequency);
  const { error: updateError } = await supabase
    .from("pledges")
    .update({ next_due_date: nextDueDate })
    .eq("id", pledgeId);
  if (updateError) throw updateError;

  await ensurePledgeReminder(supabase, pledgeId);
}
