import type { GameRecord } from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function isNewGame(
  row: Pick<GameRecord, "created_at" | "new_dismissed">,
): boolean {
  if (row.new_dismissed) return false;
  return Date.now() - new Date(row.created_at).getTime() < THIRTY_DAYS_MS;
}

export function defaultWeightFor(
  game: Pick<GameRecord, "created_at" | "new_dismissed">,
): number {
  if (isNewGame(game)) return 2;
  return 1;
}

export const ALLOWED_WEIGHTS = [0.5, 1, 1.5, 2, 3] as const;
export type AllowedWeight = (typeof ALLOWED_WEIGHTS)[number];
