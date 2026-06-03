import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { exportAll, importAll, listGames } from "@/lib/repo";
import type { Game } from "@/lib/types";

type SortKey = "name" | "weight" | "time";
type SortDir = "asc" | "desc";

const FILTER_INPUT =
  "w-28 rounded-xl border-2 border-cocoa/40 px-3 py-2 bg-white focus:outline-none focus:border-cocoa";

export function Collection() {
  const games = useLiveQuery(() => listGames(), []);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [players, setPlayers] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [dir, setDir] = useState<SortDir>("asc");

  const visible = useMemo(() => {
    if (!games) return undefined;
    const q = query.trim().toLowerCase();
    const p = players ? Number(players) : null;
    const t = maxTime ? Number(maxTime) : null;
    const w = maxWeight ? Number(maxWeight) : null;
    const list = games.filter((g) => {
      if (q && !g.title.toLowerCase().includes(q)) return false;
      if (newOnly && !g.is_new) return false;
      if (p != null) {
        const minOk = g.min_players == null || g.min_players <= p;
        const maxOk = g.max_players == null || g.max_players >= p;
        if (!minOk || !maxOk) return false;
      }
      if (t != null && g.playing_time != null && g.playing_time > t) return false;
      if (w != null && g.weight != null && g.weight > w) return false;
      return true;
    });
    return sortGames(list, sort, dir);
  }, [games, query, players, maxTime, maxWeight, newOnly, sort, dir]);

  // Placeholder hints that reflect the actual range present in the collection,
  // e.g. players "2–10", so the user knows what values are meaningful to type.
  const bounds = useMemo(() => {
    const list = games ?? [];
    const nums = (pick: (g: Game) => number | null) =>
      list.map(pick).filter((v): v is number => v != null);
    const range = (vals: number[]) =>
      vals.length ? `${Math.min(...vals)}–${Math.max(...vals)}` : "Any";
    const minP = nums((g) => g.min_players);
    const maxP = nums((g) => g.max_players);
    return {
      players: minP.length && maxP.length
        ? `${Math.min(...minP)}–${Math.max(...maxP)}`
        : "Any",
      time: range(nums((g) => g.playing_time)),
      weight: "1–5", // BGG weight scale is fixed 1–5
    };
  }, [games]);

  const filtersActive =
    query.trim() !== "" ||
    players !== "" ||
    maxTime !== "" ||
    maxWeight !== "" ||
    newOnly;

  function clearFilters() {
    setQuery("");
    setPlayers("");
    setMaxTime("");
    setMaxWeight("");
    setNewOnly(false);
  }

  async function handleExport() {
    const blob = await exportAll();
    const json = JSON.stringify(blob, null, 2);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `what-to-play-${stamp}.json`;
    const count = `${blob.games.length} game${blob.games.length === 1 ? "" : "s"}`;

    // On mobile, hand the file to the OS share sheet (Drive, AirDrop, Mail…)
    // so users can back it up without hunting for a downloaded file.
    const file = new File([json], filename, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "What To Play backup" });
        setStatus(`Shared backup of ${count}.`);
        return;
      } catch (e) {
        // User dismissed the share sheet — quietly do nothing.
        if ((e as Error).name === "AbortError") return;
        // Anything else: fall through to a plain download.
      }
    }

    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${count}.`);
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { added, skipped } = await importAll(data);
      setStatus(`Imported ${added} new game${added === 1 ? "" : "s"} (${skipped} already in collection).`);
    } catch (e) {
      setStatus(`Import failed: ${(e as Error).message}`);
    }
  }

  const total = games?.length ?? 0;
  const subtitle =
    visible && filtersActive
      ? `${visible.length} of ${total} game${total === 1 ? "" : "s"}`
      : `${total} game${total === 1 ? "" : "s"}`;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
      <PageHeader title="My Collection" subtitle={games ? subtitle : ""} />

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!games || games.length === 0}
            className="text-sm btn-sticker active:btn-sticker-active bg-white px-3 py-2 disabled:opacity-50"
          >
            ⬇ Export / Share
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm btn-sticker active:btn-sticker-active bg-white px-3 py-2"
          >
            ⬆ Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>
        <Link
          to="/collection/add"
          className="btn-sticker active:btn-sticker-active bg-mint"
        >
          ➕ Add a game
        </Link>
      </div>

      {status && (
        <p className="mb-4 text-sm text-cocoa/70 bg-cream/60 border-2 border-cocoa/30 rounded-xl px-3 py-2">
          {status}
        </p>
      )}

      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="🔍 Search your collection"
          className="flex-1"
          inputClassName="px-4 py-2 rounded-2xl border-2 border-cocoa bg-white focus:outline-none focus:ring-4 focus:ring-lavender/50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`text-sm btn-sticker active:btn-sticker-active px-3 py-2 inline-flex items-center gap-1.5 ${
              players || maxTime || maxWeight || newOnly ? "bg-lavender" : "bg-white"
            }`}
          >
            <FunnelIcon /> Filters
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-cocoa/60 hidden sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border-2 border-cocoa/40 px-3 py-2 bg-white focus:outline-none focus:border-cocoa"
            >
              <option value="name">Name</option>
              <option value="weight">Difficulty</option>
              <option value="time">Time</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={dir === "asc" ? "Ascending" : "Descending"}
            title={dir === "asc" ? "Ascending" : "Descending"}
            className="text-sm btn-sticker active:btn-sticker-active bg-white w-10 py-2 px-0"
          >
            {dir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Advanced filters: same dimensions as the wheel — players & time */}
      {showFilters && (
        <div className="card-sticker p-4 mb-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">👥 Players</span>
            <input
              type="number"
              min={1}
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              placeholder={bounds.players}
              className={FILTER_INPUT}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">⏱ Max time (min)</span>
            <input
              type="number"
              min={1}
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              placeholder={bounds.time}
              className={FILTER_INPUT}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">🧠 Max difficulty</span>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={maxWeight}
              onChange={(e) => setMaxWeight(e.target.value)}
              placeholder={bounds.weight}
              className={FILTER_INPUT}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            onClick={() => setNewOnly((v) => !v)}
            aria-pressed={newOnly}
            className={`text-sm btn-sticker active:btn-sticker-active px-3 py-2 ${
              newOnly ? "bg-mint" : "bg-white"
            }`}
          >
            ✨ New only
          </button>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm btn-sticker active:btn-sticker-active bg-white px-3 py-2"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      )}

      {!visible ? (
        <p className="text-center text-cocoa/60">Loading…</p>
      ) : total === 0 ? (
        <div className="text-center text-cocoa/60 py-16">
          <p className="text-2xl mb-2">🎲 No games yet</p>
          <p>Tap &ldquo;Add a game&rdquo; to start your collection.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-cocoa/60 py-16 flex flex-col items-center gap-4">
          <p className="text-2xl">🔍 No games match</p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn-sticker active:btn-sticker-active bg-mint"
          >
            ✕ Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </main>
  );
}

// `dir` flips the direction; missing numeric values (null) always stay at the
// bottom regardless of direction (rather than floating to the top in desc).
function sortGames(list: Game[], sort: SortKey, dir: SortDir): Game[] {
  const mul = dir === "asc" ? 1 : -1;
  const sorted = [...list];
  if (sort === "weight") {
    sorted.sort((a, b) => cmpNum(a.weight, b.weight, mul));
  } else if (sort === "time") {
    sorted.sort((a, b) => cmpNum(a.playing_time, b.playing_time, mul));
  } else {
    sorted.sort((a, b) => mul * a.title.localeCompare(b.title));
  }
  return sorted;
}

function cmpNum(a: number | null, b: number | null, mul: number): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulls last
  if (b == null) return -1;
  return mul * (a - b);
}

// Funnel — the conventional "filter" glyph (the previous ⚙ read as settings).
function FunnelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 4h18a1 1 0 0 1 .8 1.6L15 14v5a1 1 0 0 1-1.45.9l-3-1.5A1 1 0 0 1 10 17.5V14L2.2 5.6A1 1 0 0 1 3 4z" />
    </svg>
  );
}
