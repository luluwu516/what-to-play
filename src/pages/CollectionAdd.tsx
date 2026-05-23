import { useState } from "react";
import { useNavigate } from "react-router";
import { BGGSearchBox } from "@/components/BGGSearchBox";
import { GameCover } from "@/components/GameCover";
import { PageHeader } from "@/components/PageHeader";
import { fetchBGGDetail, type BggSearchHit } from "@/lib/bgg-client";
import { addGame } from "@/lib/repo";

type FormState = {
  bggId: number | null;
  title: string;
  imageUrl: string;
  minPlayers: string;
  maxPlayers: string;
  playingTime: string;
  weight: string;
};

const EMPTY: FormState = {
  bggId: null,
  title: "",
  imageUrl: "",
  minPlayers: "",
  maxPlayers: "",
  playingTime: "",
  weight: "",
};

const INPUT_CLASS =
  "w-full rounded-xl border-2 border-cocoa/40 px-3 py-2 bg-white focus:outline-none focus:border-cocoa";

export function CollectionAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromBGG(hit: BggSearchHit) {
    setError(null);
    setFetching(true);
    try {
      const d = await fetchBGGDetail(hit.id);
      setForm({
        bggId: d.id,
        title: d.title ?? "",
        imageUrl: d.image_url ?? "",
        minPlayers: d.min_players != null ? String(d.min_players) : "",
        maxPlayers: d.max_players != null ? String(d.max_players) : "",
        playingTime: d.playing_time != null ? String(d.playing_time) : "",
        weight: d.weight != null ? String(d.weight) : "",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addGame({
        id: form.bggId ?? undefined,
        title: form.title.trim(),
        image_url: form.imageUrl.trim() || null,
        min_players: form.minPlayers ? Number(form.minPlayers) : null,
        max_players: form.maxPlayers ? Number(form.maxPlayers) : null,
        playing_time: form.playingTime ? Number(form.playingTime) : null,
        weight: form.weight ? Number(form.weight) : null,
      });
      navigate("/collection");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8">
      <PageHeader
        title="Add a game"
        subtitle="Search BoardGameGeek to auto-fill, or enter details manually"
      />

      <BGGSearchBox onPick={pickFromBGG} />
      {fetching && (
        <p className="text-center mt-4 text-cocoa/60">
          Fetching details from BGG…
        </p>
      )}

      <section className="mt-6 card-sticker p-5 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-cocoa flex-shrink-0">
            <GameCover
              src={form.imageUrl.trim() || null}
              alt={form.title || "preview"}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Label text="Title*">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Wingspan"
                autoComplete="off"
              />
            </Label>
            <Label text="Image URL">
              <input
                value={form.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://…"
                autoComplete="off"
              />
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Label text="Min players">
            <input
              type="number"
              min={1}
              value={form.minPlayers}
              onChange={(e) => update("minPlayers", e.target.value)}
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </Label>
          <Label text="Max players">
            <input
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => update("maxPlayers", e.target.value)}
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </Label>
          <Label text="Time (min)">
            <input
              type="number"
              min={1}
              value={form.playingTime}
              onChange={(e) => update("playingTime", e.target.value)}
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </Label>
          <Label text="BGG weight">
            <input
              type="number"
              step={0.1}
              min={1}
              max={5}
              value={form.weight}
              onChange={(e) => update("weight", e.target.value)}
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </Label>
        </div>

        {form.bggId != null && (
          <p className="text-xs text-cocoa/60">
            ✨ Linked to BGG #{form.bggId}. Edit any field to override.
          </p>
        )}
        {error && <p className="text-berry font-bold">{error}</p>}

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="btn-sticker active:btn-sticker-active bg-tangerine"
          >
            {saving ? "Adding…" : "✅ Add to collection"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setError(null);
            }}
            className="btn-sticker active:btn-sticker-active bg-white"
          >
            Clear
          </button>
        </div>
      </section>
    </main>
  );
}

function Label({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold">{text}</span>
      {children}
    </label>
  );
}
