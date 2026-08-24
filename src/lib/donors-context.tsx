"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DonorCategory, DonorSummary, DonorType } from "@/lib/types";

const PAGE_SIZE = 50;
const SUMMARY_COLUMNS = "id, name, donor_type, category, status";

export type NewDonorInput = {
  name: string;
  donorType: DonorType;
  category: DonorCategory;
  phone?: string;
  email?: string;
  notes?: string;
  contactPersonName?: string;
  registrationId?: string;
};

type DonorsContextValue = {
  donors: DonorSummary[];
  loading: boolean;
  hasMore: boolean;
  ensureLoaded: () => void;
  loadMore: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: DonorSummary[];
  searching: boolean;
  addDonor: (input: NewDonorInput) => Promise<DonorSummary>;
};

const DonorsContext = createContext<DonorsContextValue | null>(null);

function mapRow(row: Record<string, unknown>): DonorSummary {
  return {
    id: row.id as string,
    name: row.name as string,
    donorType: row.donor_type as DonorType,
    category: row.category as DonorCategory,
    status: row.status as DonorSummary["status"],
  };
}

export function DonorsProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef(createClient());
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTermState] = useState("");
  const [searchResults, setSearchResults] = useState<DonorSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (offset: number) => {
    const { data, error } = await supabaseRef.current
      .from("donors")
      .select(SUMMARY_COLUMNS)
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }, []);

  const ensureLoaded = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    fetchPage(0)
      .then((rows) => {
        setDonors(rows);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    fetchPage(donors.length)
      .then((rows) => {
        setDonors((prev) => [...prev, ...rows]);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .finally(() => setLoading(false));
  }, [loading, hasMore, donors.length, fetchPage]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = term.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabaseRef.current
        .from("donors")
        .select(SUMMARY_COLUMNS)
        .ilike("name", `%${trimmed}%`)
        .order("name", { ascending: true })
        .limit(PAGE_SIZE);
      if (!error) setSearchResults((data ?? []).map(mapRow));
      setSearching(false);
    }, 350);
  }, []);

  const addDonor = useCallback(async (input: NewDonorInput) => {
    const { data, error } = await supabaseRef.current
      .from("donors")
      .insert({
        name: input.name,
        donor_type: input.donorType,
        category: input.category,
        phone: input.phone ?? null,
        email: input.email ?? null,
        notes: input.notes ?? null,
        contact_person_name: input.contactPersonName ?? null,
        registration_id: input.registrationId ?? null,
      })
      .select(SUMMARY_COLUMNS)
      .single();
    if (error) throw error;
    const donor = mapRow(data);
    setDonors((prev) => [donor, ...prev]);
    return donor;
  }, []);

  return (
    <DonorsContext.Provider
      value={{
        donors,
        loading,
        hasMore,
        ensureLoaded,
        loadMore,
        searchTerm,
        setSearchTerm,
        searchResults,
        searching,
        addDonor,
      }}
    >
      {children}
    </DonorsContext.Provider>
  );
}

export function useDonors() {
  const ctx = useContext(DonorsContext);
  if (!ctx) throw new Error("useDonors must be used within a DonorsProvider");
  return ctx;
}
