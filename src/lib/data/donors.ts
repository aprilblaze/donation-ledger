import type { SupabaseClient } from "@supabase/supabase-js";
import { Donor } from "@/lib/types";

const DETAIL_COLUMNS =
  "id, name, donor_type, phone, email, address, category, status, notes, date_added, contact_person_name, registration_id";

export async function fetchDonorDetail(supabase: SupabaseClient, id: string): Promise<Donor | null> {
  const { data, error } = await supabase.from("donors").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    donorType: data.donor_type,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    address: data.address ?? undefined,
    category: data.category,
    status: data.status,
    notes: data.notes ?? undefined,
    dateAdded: data.date_added,
    contactPersonName: data.contact_person_name ?? undefined,
    registrationId: data.registration_id ?? undefined,
  };
}
