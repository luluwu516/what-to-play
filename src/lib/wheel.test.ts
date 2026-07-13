import { describe, it, expect } from "vitest";
import { expandSlots, type WheelSlot } from "./wheel";
import type { Game } from "./types";
import type { AllowedWeight } from "./weight";

const game = (id: number): Game => ({
  id,
  title: `Game ${id}`,
  image_url: null,
  min_players: null,
  max_players: null,
  playing_time: null,
  weight: null,
  status: "normal",
  new_dismissed: 0,
  created_at: new Date().toISOString(),
  is_new: false,
});

const slot = (id: number, weight: AllowedWeight): WheelSlot => ({
  game: game(id),
  weight,
});

describe("expandSlots", () => {
  it("returns no slices for no slots", () => {
    expect(expandSlots([])).toEqual([]);
  });

  it("turns each 0.5 of weight into one slice", () => {
    expect(expandSlots([slot(1, 0.5)])).toHaveLength(1);
    expect(expandSlots([slot(1, 1)])).toHaveLength(2);
    expect(expandSlots([slot(1, 3)])).toHaveLength(6);
  });

  it("interleaves slots round-robin instead of grouping them", () => {
    const slices = expandSlots([slot(1, 1), slot(2, 1)]);
    expect(slices.map((s) => s.slotIndex)).toEqual([0, 1, 0, 1]);
  });

  it("keeps interleaving when weights differ", () => {
    // slot 0 weight 1 (2 slices), slot 1 weight 2 (4 slices) => A,B,A,B,B,B
    const slices = expandSlots([slot(1, 1), slot(2, 2)]);
    expect(slices.map((s) => s.slotIndex)).toEqual([0, 1, 0, 1, 1, 1]);
  });

  it("maps each slice back to its originating game", () => {
    const slices = expandSlots([slot(42, 0.5)]);
    expect(slices[0].game.id).toBe(42);
    expect(slices[0].slotIndex).toBe(0);
  });
});
