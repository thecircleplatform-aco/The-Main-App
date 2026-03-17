"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CircleResult = {
  id: string;
  name: string;
  slug: string;
  category: string;
  member_count: number;
};

type UserResult = {
  id: string;
  username: string;
};

type SearchResponse = {
  circles: CircleResult[];
  users: UserResult[];
  trending: boolean;
};

export function SearchGlobal() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<SearchResponse | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  const runSearch = React.useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("q", q);
        const res = await fetch(`/api/search?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setData(null);
          return;
        }
        const json = (await res.json()) as SearchResponse;
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    if (!open) return;
    // Immediately load trending when opened and query empty.
    if (!query.trim()) {
      runSearch("");
    }
  }, [open, query, runSearch]);

  React.useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      // trending already handled above
      return;
    }
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      runSearch(query.trim());
    }, 400);
    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, open, runSearch]);

  const handleFocus = () => {
    setOpen(true);
  };

  const handleBlurContainer = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  const circles = data?.circles ?? [];
  const users = data?.users ?? [];

  const hasResults = circles.length > 0 || users.length > 0;

  return (
    <div
      className="relative w-full max-w-xs"
      onBlur={handleBlurContainer}
      tabIndex={-1}
    >
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-violet-400">
        <Search className="h-3.5 w-3.5 text-white/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search circles or users..."
          className="w-full bg-transparent text-xs text-white placeholder:text-white/50 outline-none"
        />
      </div>
      {open && (
        <div className="absolute left-0 mt-1 w-full rounded-xl border border-white/15 bg-black/90 text-xs text-white shadow-lg backdrop-blur-md z-50">
          <div className="max-h-80 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              </div>
            ) : !hasResults ? (
              <p className="text-[11px] text-white/60">No results found.</p>
            ) : (
              <>
                {circles.length > 0 && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                      Circles
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {circles.map((c) => (
                        <Link
                          key={c.id}
                          href={`/circles/${encodeURIComponent(c.slug)}`}
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {users.length > 0 && (
                  <div>
                    <p className="mt-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                      Users
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {users.map((u) => (
                        <Link
                          key={u.id}
                          href={`/users/${encodeURIComponent(u.username)}`}
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
                        >
                          {u.username}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {data?.trending && !query.trim() && circles.length > 0 && (
            <div className="border-t border-white/10 px-3 py-1.5 text-[10px] text-white/50">
              Trending circles
            </div>
          )}
        </div>
      )}
    </div>
  );
}

