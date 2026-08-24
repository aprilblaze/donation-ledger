"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import DonationForm from "@/components/DonationForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { DonationListItem, DonationSort, fetchDonationsPage } from "@/lib/data/donations";
import { formatMoney } from "@/lib/format";
import { Donation, DonationStatus, DonorCategory, DonorSummary } from "@/lib/types";

const PAGE_SIZE = 30;

const sortOptions: { value: DonationSort; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high–low" },
  { value: "amount_asc", label: "Amount: low–high" },
  { value: "donor_asc", label: "Donor A–Z" },
];

const ALL_CATEGORIES = "All categories";
type CategoryFilter = DonorCategory | typeof ALL_CATEGORIES;
const categoryFilterOptions: CategoryFilter[] = [ALL_CATEGORIES, "Recurring", "One-time", "In-kind"];

const statusTone: Record<DonationStatus, "positive" | "muted" | "warning"> = {
  Received: "positive",
  Pending: "warning",
  Partial: "muted",
};

export default function DonationsPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const requestIdRef = useRef(0);

  const [modalOpen, setModalOpen] = useState(false);

  const [sort, setSort] = useState<DonationSort>("date_desc");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [donations, setDonations] = useState<DonationListItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Which sort+filter combo the currently-rendered `donations` were loaded
  // for. Only ever updated from the async continuation below (after the
  // fetch resolves), so comparing it to the current combo during render
  // derives the "loading" state without a synchronous setState inside an
  // effect.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = `${sort}|${categoryFilter}`;

  const isLoadingList = loadedKey !== currentKey;

  const loadPage = useCallback(
    async (activeSort: DonationSort, activeCategory: CategoryFilter, offset: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;
      const rows = await fetchDonationsPage(supabaseRef.current, {
        sort: activeSort,
        donorCategory: activeCategory === ALL_CATEGORIES ? undefined : activeCategory,
        offset,
        limit: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      setDonations((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      setLoadedKey(`${activeSort}|${activeCategory}`);
      setLoadingMore(false);
    },
    []
  );

  useEffect(() => {
    loadPage(sort, categoryFilter, 0, true);
  }, [sort, categoryFilter, loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || isLoadingList || !hasMore) return;
    setLoadingMore(true);
    loadPage(sort, categoryFilter, donations.length, false);
  }, [loadingMore, isLoadingList, hasMore, sort, categoryFilter, donations.length, loadPage]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const isEmpty = !isLoadingList && donations.length === 0;

  function handleSaved(donation: Donation, donor: DonorSummary) {
    const item: DonationListItem = {
      id: donation.id,
      donorId: donation.donorId,
      donorName: donor.name,
      donorCategory: donor.category,
      dateReceived: donation.dateReceived,
      amount: donation.amount,
      currency: donation.currency,
      paymentMethod: donation.paymentMethod,
      purpose: donation.purpose,
      status: donation.status,
      receiptImageUrl: donation.receiptImageUrl,
    };
    if (categoryFilter !== ALL_CATEGORIES && item.donorCategory !== categoryFilter) return;
    setDonations((prev) => [item, ...prev]);
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${donations.length}${hasMore ? "+" : ""} records`}
        title="Donations"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink"
            aria-label="Add donation"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                sort === opt.value ? "border-accent bg-accent text-ink" : "border-rule-strong text-ink-soft"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="w-auto shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryFilterOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 px-5">
        {/* Mobile: card list */}
        <div className="rounded-2xl border border-rule bg-paper-raised md:hidden">
          {donations.map((d) => (
            <Link
              key={d.id}
              href={`/donors/${d.donorId}`}
              className="ledger-row flex items-center gap-3 px-4 py-3.5"
            >
              {d.receiptImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.receiptImageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-rule object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">{d.donorName}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {d.dateReceived} · {d.paymentMethod}
                </p>
              </div>
              <p className="tnum shrink-0 pl-3 text-[15px] text-accent">{formatMoney(d.amount, d.currency)}</p>
            </Link>
          ))}
          {isEmpty && <p className="px-4 py-6 text-center text-[13px] text-muted">No donations yet.</p>}
        </div>

        {/* Desktop: sortable data table */}
        <div className="hidden overflow-hidden rounded-2xl border border-rule bg-paper-raised md:block">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/donors/${d.donorId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/donors/${d.donorId}`);
                  }}
                  tabIndex={0}
                  className="cursor-pointer border-b border-rule last:border-none hover:bg-ink/[0.03]"
                >
                  <td className="px-4 py-3 text-ink-soft">{d.dateReceived}</td>
                  <td className="px-4 py-3 text-ink">
                    <div className="flex items-center gap-2.5">
                      {d.receiptImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.receiptImageUrl}
                          alt=""
                          className="h-7 w-7 shrink-0 rounded-md border border-rule object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate">{d.donorName}</p>
                        <p className="text-[12px] text-muted">{d.donorCategory}</p>
                      </div>
                    </div>
                  </td>
                  <td className="tnum px-4 py-3 text-right text-accent">{formatMoney(d.amount, d.currency)}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.paymentMethod}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.purpose}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={d.status} tone={statusTone[d.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isEmpty && <p className="px-4 py-6 text-center text-[13px] text-muted">No donations yet.</p>}
        </div>

        <div ref={sentinelRef} className="h-px" />
        {(isLoadingList || loadingMore) && (
          <p className="py-4 text-center text-[13px] text-muted">Loading…</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add donation">
        <DonationForm onSaved={handleSaved} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
