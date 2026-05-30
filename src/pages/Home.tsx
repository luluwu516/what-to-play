import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { listGames } from "@/lib/repo";
import { GameCover } from "@/components/GameCover";
import { DecorativeWheel } from "@/components/DecorativeWheel";

export function Home() {
  const recent = useLiveQuery(async () => (await listGames()).slice(0, 5), []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <header className="text-center flex flex-col items-center gap-2">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          Well, Well, Wheel...
        </h1>
        <p className="text-lg text-cocoa/70">
          Can&apos;t decide tonight? Let the wheel pick.
        </p>
      </header>

      <Link to="/play" aria-label="Open the wheel">
        <DecorativeWheel />
      </Link>

      <div className="flex flex-col-reverse sm:flex-row gap-4">
        <Link
          to="/collection"
          className="btn-sticker active:btn-sticker-active bg-lavender text-xl px-8 py-5"
        >
          📦 My Collection
        </Link>
        <Link
          to="/play"
          className="btn-sticker active:btn-sticker-active bg-tangerine text-xl px-8 py-5"
        >
          🎲 Spin the Wheel
        </Link>
      </div>

      {recent && recent.length > 0 && (
        <section className="flex flex-col items-center gap-3 w-full max-w-2xl">
          <h2 className="font-bold text-cocoa/70">Recently added</h2>
          <div className="flex gap-3 flex-wrap justify-center">
            {recent.map((g) => (
              <Link
                key={g.id}
                to="/collection"
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cocoa shadow-[3px_3px_0_0_var(--cocoa)] hover:rotate-3 transition-transform"
                title={g.title}
              >
                <GameCover
                  src={g.image_url}
                  alt={g.title}
                  className="w-full h-full"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
