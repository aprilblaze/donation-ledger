"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { useDonors } from "@/lib/donors-context";
import { DonorStatus } from "@/lib/types";

const statusTone: Record<DonorStatus, "positive" | "muted" | "warning"> = {
  Active: "positive",
  Prospective: "muted",
  Lapsed: "warning",
};

export default function DonorsPage() {
  const router = useRouter();
  const { donors, loading, hasMore, ensureLoaded, loadMore, searchTerm, setSearchTerm, searchResults, searching } =
    useDonors();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const isSearching = searchTerm.trim() !== "";
  const list = isSearching ? searchResults : donors;
  const isEmpty = !loading && !searching && list.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow={isSearching ? `${list.length} match${list.length === 1 ? "" : "es"}` : `${list.length} records`}
        title="Donors"
        action={
          <Link
            href="/donors/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink"
            aria-label="Add donor"
          >
            <Plus size={18} />
          </Link>
        }
      />

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 rounded-full border border-rule bg-paper-raised px-4 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donors"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="mt-5 px-5">
        {/* Mobile: card list */}
        <div className="rounded-2xl border border-rule bg-paper-raised md:hidden">
          {list.map((d) => (
            <Link
              key={d.id}
              href={`/donors/${d.id}`}
              className="ledger-row flex items-center justify-between gap-3 px-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-[16px] text-ink">{d.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {d.donorType} · {d.category}
                </p>
              </div>
              <StatusBadge label={d.status} tone={statusTone[d.status]} />
            </Link>
          ))}
          {isEmpty && (
            <p className="px-4 py-6 text-center text-[13px] text-muted">
              {isSearching ? "No donors match your search." : "No donors yet."}
            </p>
          )}
        </div>

        {/* Desktop: data table */}
        <div className="hidden overflow-hidden rounded-2xl border border-rule bg-paper-raised md:block">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/donors/${d.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/donors/${d.id}`);
                  }}
                  tabIndex={0}
                  className="cursor-pointer border-b border-rule last:border-none hover:bg-ink/[0.03]"
                >
                  <td className="px-4 py-3 font-display text-ink">{d.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.donorType}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={d.status} tone={statusTone[d.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isEmpty && (
            <p className="px-4 py-6 text-center text-[13px] text-muted">
              {isSearching ? "No donors match your search." : "No donors yet."}
            </p>
          )}
        </div>

        {!isSearching && hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="mt-4 w-full rounded-full border border-rule-strong py-3 text-[13px] font-medium text-ink-soft disabled:opacity-40"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
