"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({
  className,
  iconSize = 18,
}: {
  className?: string;
  iconSize?: number;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      <LogOut size={iconSize} strokeWidth={1.5} />
      <span>Sign out</span>
    </button>
  );
}
