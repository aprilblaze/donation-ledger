import type { SupabaseClient } from "@supabase/supabase-js";
import { ReminderStatus, ReminderType } from "@/lib/types";

export type ReminderWithDonor = {
  id: string;
  type: ReminderType;
  donorId?: string;
  donorName?: string;
  dueDate: string;
  note: string;
  status: ReminderStatus;
};

export async function fetchReminders(supabase: SupabaseClient): Promise<ReminderWithDonor[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("id, type, donor_id, due_date, note, status, donors(name)")
    .order("due_date", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      type: ReminderType;
      donor_id: string | null;
      due_date: string;
      note: string;
      status: ReminderStatus;
      donors: { name: string } | { name: string }[] | null;
    };
    const donor = Array.isArray(r.donors) ? r.donors[0] : r.donors;
    return {
      id: r.id,
      type: r.type,
      donorId: r.donor_id ?? undefined,
      donorName: donor?.name,
      dueDate: r.due_date,
      note: r.note,
      status: r.status,
    };
  });
}

export async function fetchPendingReminderCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");
  if (error) throw error;
  return count ?? 0;
}

export async function updateReminderStatus(supabase: SupabaseClient, id: string, status: ReminderStatus) {
  const { error } = await supabase.from("reminders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function insertReminder(
  supabase: SupabaseClient,
  input: { type: Exclude<ReminderType, "Pledge due">; donorId?: string; dueDate: string; note: string }
): Promise<string> {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      type: input.type,
      donor_id: input.donorId ?? null,
      due_date: input.dueDate,
      note: input.note,
      status: "Pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
