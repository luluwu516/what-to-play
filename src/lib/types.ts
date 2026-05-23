// Single source of truth for a game record.
//
// Persisted shape (lives in IndexedDB):
//   - `id`: positive = BGG ID, negative = manual entry
//   - `new_dismissed`: 0 | 1 (sqlite-style bool, kept for parity with v1)
// Derived (computed on read, never stored):
//   - `is_new`: true when created < 30 days ago AND not dismissed

export type GameRecord = {
  id: number;
  title: string;
  image_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  weight: number | null;
  status: "normal" | "want_to_play"; // kept for back-compat, no UI surfaces it
  new_dismissed: number; // 0 | 1
  created_at: string; // ISO
};

export type Game = GameRecord & { is_new: boolean };
