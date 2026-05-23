import { useRef, useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { exportAll, importAll, listGames } from "@/lib/repo";

export function Collection() {
  const games = useLiveQuery(() => listGames(), []);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleExport() {
    const blob = await exportAll();
    const json = JSON.stringify(blob, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `well-well-wheel-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${blob.games.length} game${blob.games.length === 1 ? "" : "s"}.`);
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

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
      <PageHeader
        title="My Collection"
        subtitle={games ? `${games.length} game${games.length === 1 ? "" : "s"}` : ""}
      />
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!games || games.length === 0}
            className="text-sm btn-sticker active:btn-sticker-active bg-white px-3 py-2 disabled:opacity-50"
          >
            ⬇ Export JSON
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
      {!games ? (
        <p className="text-center text-cocoa/60">Loading…</p>
      ) : games.length === 0 ? (
        <div className="text-center text-cocoa/60 py-16">
          <p className="text-2xl mb-2">🎲 No games yet</p>
          <p>Tap &ldquo;Add a game&rdquo; to start your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </main>
  );
}
