"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[85vh] flex-col justify-center px-6">
      <Image
        src="/logo.jpg"
        alt=""
        width={200}
        height={200}
        className=""
      />
      <h1 className="mt-6 font-display text-[32px] leading-tight text-ink">
        Sign in
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Use your admin account to access donor records.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-muted">Email</span>
          <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-[16px] text-ink outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-muted">Password</span>
          <div className="rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-[16px] text-ink outline-none"
            />
          </div>
        </label>

        {error && <p className="text-[13px] text-negative">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-ink disabled:opacity-40"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
