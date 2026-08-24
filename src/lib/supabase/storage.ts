import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/image";

export async function uploadReceipt(supabase: SupabaseClient, file: File): Promise<string> {
  const compressed = await compressImage(file);
  const path = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from("receipts").upload(path, compressed, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}
