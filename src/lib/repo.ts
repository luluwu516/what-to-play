// Repository layer: all IndexedDB reads/writes go through here.
// Components don't talk to Dexie directly; they call these functions.

import { db } from "./db";
import { isNewGame } from "./weight";
import type { Game, GameRecord } from "./types";

function decorate(r: GameRecord): Game {
  return { ...r, is_new: isNewGame(r) };
}

export async function listGames(): Promise<Game[]> {
  const rows = await db.games.orderBy("created_at").reverse().toArray();
  return rows.map(decorate);
}

export type NewGameInput = {
  id?: number; // present = BGG; absent = manual (we mint a negative id)
  title: string;
  image_url?: string | null;
  min_players?: number | null;
  max_players?: number | null;
  playing_time?: number | null;
  weight?: number | null;
};

export async function addGame(input: NewGameInput): Promise<Game> {
  return await db.transaction("rw", db.games, async () => {
    let id: number;
    if (typeof input.id === "number") {
      const existing = await db.games.get(input.id);
      if (existing) throw new Error("already in collection");
      id = input.id;
    } else {
      // Manual entry: pick the next negative id below any existing minimum.
      const min = await db.games.orderBy("id").first();
      id = min == null || min.id >= 0 ? -1 : min.id - 1;
    }
    const row: GameRecord = {
      id,
      title: input.title.trim(),
      image_url: input.image_url ?? null,
      min_players: input.min_players ?? null,
      max_players: input.max_players ?? null,
      playing_time: input.playing_time ?? null,
      weight: input.weight ?? null,
      status: "normal",
      new_dismissed: 0,
      created_at: new Date().toISOString(),
    };
    await db.games.add(row);
    return decorate(row);
  });
}

export type PatchInput = Partial<
  Pick<
    GameRecord,
    | "title"
    | "image_url"
    | "min_players"
    | "max_players"
    | "playing_time"
    | "weight"
  >
> & {
  new_dismissed?: boolean;
};

export async function updateGame(id: number, patch: PatchInput): Promise<Game> {
  const update: Partial<GameRecord> = {};
  for (const key of [
    "title",
    "image_url",
    "min_players",
    "max_players",
    "playing_time",
    "weight",
  ] as const) {
    if (key in patch) {
      // Cast: patch's value matches GameRecord[key] for these keys.
      (update as Record<string, unknown>)[key] = patch[key];
    }
  }
  if (typeof patch.new_dismissed === "boolean") {
    update.new_dismissed = patch.new_dismissed ? 1 : 0;
  }
  await db.games.update(id, update);
  const row = await db.games.get(id);
  if (!row) throw new Error("not found");
  return decorate(row);
}

export async function deleteGame(id: number): Promise<void> {
  await db.games.delete(id);
}

// Export everything as a portable JSON blob for backup/transfer.
export async function exportAll(): Promise<{
  version: 1;
  exported_at: string;
  games: GameRecord[];
}> {
  const games = await db.games.toArray();
  return { version: 1, exported_at: new Date().toISOString(), games };
}

// Import a previously-exported blob. Strategy is "merge" — existing ids
// are skipped, new ids added. Returns counts so the UI can report.
export async function importAll(
  blob: unknown,
): Promise<{ added: number; skipped: number }> {
  const games = parseImport(blob);
  let added = 0;
  let skipped = 0;
  await db.transaction("rw", db.games, async () => {
    for (const g of games) {
      const exists = await db.games.get(g.id);
      if (exists) {
        skipped++;
      } else {
        await db.games.add(g);
        added++;
      }
    }
  });
  return { added, skipped };
}

function parseImport(blob: unknown): GameRecord[] {
  if (!blob || typeof blob !== "object") throw new Error("invalid file");
  const b = blob as { games?: unknown };
  if (!Array.isArray(b.games)) throw new Error("missing games[]");
  return b.games.map((g, i) => {
    if (typeof g !== "object" || g === null) {
      throw new Error(`games[${i}] is not an object`);
    }
    const row = g as Record<string, unknown>;
    if (typeof row.id !== "number" || typeof row.title !== "string") {
      throw new Error(`games[${i}] missing id or title`);
    }
    return {
      id: row.id,
      title: row.title,
      image_url: (row.image_url as string | null | undefined) ?? null,
      min_players: (row.min_players as number | null | undefined) ?? null,
      max_players: (row.max_players as number | null | undefined) ?? null,
      playing_time: (row.playing_time as number | null | undefined) ?? null,
      weight: (row.weight as number | null | undefined) ?? null,
      status: (row.status as "normal" | "want_to_play" | undefined) ?? "normal",
      new_dismissed: typeof row.new_dismissed === "number" ? row.new_dismissed : 0,
      created_at:
        typeof row.created_at === "string"
          ? row.created_at
          : new Date().toISOString(),
    };
  });
}
