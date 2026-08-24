"use client";

import { DonorsProvider } from "@/lib/donors-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <DonorsProvider>{children}</DonorsProvider>;
}
