import { useEffect, useRef, useState } from "react";
import { searchBGG, type BggSearchHit } from "@/lib/bgg-client";

export function BGGSearchBox({
  onPick,
}: {
  onPick: (hit: BggSearchHit) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<BggSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchBGG(q);
        setHits(results);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  function handleInput(next: string) {
    setQ(next);
    if (!next.trim()) {
      setHits([]);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder="Search BoardGameGeek (e.g. Wingspan)"
        autoComplete="off"
        className="w-full px-4 py-3 rounded-2xl border-2 border-cocoa bg-white text-lg shadow-[4px_4px_0_0_var(--cocoa)] focus:outline-none focus:ring-4 focus:ring-lavender/50"
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-cocoa/60">
          Searching…
        </div>
      )}
      {open && hits.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-2 max-h-80 overflow-auto card-sticker p-1">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(h);
                  setOpen(false);
                  setQ("");
                  setHits([]);
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
    </div>
  );
}
