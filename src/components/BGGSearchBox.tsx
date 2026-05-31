import { useState } from "react";
import { searchBGG, type BggSearchHit } from "@/lib/bgg-client";
import { SearchInput } from "./SearchInput";

// Search fires only when the user presses the Search button (or Enter) —
// never on every keystroke — so we don't hammer the BGG API.
export function BGGSearchBox({
  onPick,
}: {
  onPick: (hit: BggSearchHit) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<BggSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    const term = q.trim();
    if (!term || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await searchBGG(term);
      setHits(results);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }

  function clear() {
    setQ("");
    setHits([]);
    setOpen(false);
    setSearched(false);
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            if (!v.trim()) setOpen(false);
          }}
          onSubmit={runSearch}
          onClear={clear}
          placeholder="Search BoardGameGeek (e.g. Wingspan)"
          className="flex-1"
          inputClassName="px-4 py-3 rounded-2xl border-2 border-cocoa bg-white text-lg shadow-[4px_4px_0_0_var(--cocoa)] focus:outline-none focus:ring-4 focus:ring-lavender/50"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={loading || !q.trim()}
          className="btn-sticker active:btn-sticker-active bg-lavender px-5 shrink-0 disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {open && hits.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-2 max-h-80 overflow-auto card-sticker p-1">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(h);
                  clear();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-cream flex justify-between gap-2"
              >
                <span className="font-bold">{h.title}</span>
                <span className="text-cocoa/60 text-sm">{h.year ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && searched && hits.length === 0 && (
        <p className="mt-2 text-sm text-cocoa/60">No matches on BoardGameGeek.</p>
      )}
    </div>
  );
}
