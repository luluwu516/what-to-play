// One-off: read the v1 SQLite database and write a v2-compatible export
// JSON. Use the resulting file with the "Import JSON" button in v2.
//
// Usage:
//   node scripts/dump-from-v1.mjs ../well-well-wheel/data/wellwheel.db > export.json
//
// Reads via the sqlite3 CLI (no node dependency on better-sqlite3 here).

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const dbPath = process.argv[2];
if (!dbPath) {
  console.error("usage: node scripts/dump-from-v1.mjs <path-to-wellwheel.db>");
  process.exit(2);
}
if (!existsSync(dbPath)) {
  console.error(`not found: ${dbPath}`);
  process.exit(2);
}

// sqlite3 -json gives clean JSON output.
const raw = execSync(
  `sqlite3 -json ${JSON.stringify(dbPath)} "SELECT * FROM games"`,
  { encoding: "utf8" },
);
const rows = raw.trim() ? JSON.parse(raw) : [];

const blob = {
  version: 1,
  exported_at: new Date().toISOString(),
  games: rows.map((r) => ({
    id: r.id,
    title: r.title,
    image_url: r.image_url ?? null,
    min_players: r.min_players ?? null,
    max_players: r.max_players ?? null,
    playing_time: r.playing_time ?? null,
    weight: r.weight ?? null,
    status: r.status ?? "normal",
    new_dismissed: typeof r.new_dismissed === "number" ? r.new_dismissed : 0,
    created_at: r.created_at,
  })),
};

process.stdout.write(JSON.stringify(blob, null, 2));
console.error(`dumped ${blob.games.length} games`);
