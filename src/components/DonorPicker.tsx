"use client";

import { useEffect } from "react";
import { useDonors } from "@/lib/donors-context";
import { DonorSummary } from "@/lib/types";

export default function DonorPicker({
  value,
  onChange,
  placeholder = "Search donors",
}: {
  value: DonorSummary | null;
  onChange: (donor: DonorSummary | null) => void;
  placeholder?: string;
}) {
  const { donors, ensureLoaded, hasMore, loadMore, loading, searchTerm, setSearchTerm, searchResults, searching } =
    useDonors();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const isSearching = searchTerm.trim() !== "";
  const list = isSearching ? searchResults : donors;

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-rule bg-paper-raised px-4 py-3.5">
        <div>
          <p className="text-[15px] text-ink">{value.name}</p>
          <p className="mt-0.5 text-[12px] text-muted">{value.donorType}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-[12px] text-ink-soft underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 rounded-full border border-rule bg-paper-raised px-4 py-2.5">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-2xl border border-rule bg-paper-raised">
        {list.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d)}
            className="ledger-row flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-[14px] text-ink">{d.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">{d.donorType}</p>
            </div>
          </button>
        ))}
        {!loading && !searching && list.length === 0 && (
          <p className="px-4 py-4 text-center text-[13px] text-muted">No donors found.</p>
        )}
      </div>
      {!isSearching && hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-2 w-full rounded-full border border-rule-strong py-2 text-[12px] font-medium text-ink-soft disabled:opacity-40"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
