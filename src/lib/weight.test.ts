import { describe, it, expect } from "vitest";
import { isNewGame, defaultWeightFor } from "./weight";

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

describe("isNewGame", () => {
  it("is true for a game added just now", () => {
    expect(isNewGame({ created_at: daysAgo(0), new_dismissed: 0 })).toBe(true);
  });

  it("is true within the 30-day window", () => {
    expect(isNewGame({ created_at: daysAgo(29), new_dismissed: 0 })).toBe(true);
  });

  it("is false once older than 30 days", () => {
    expect(isNewGame({ created_at: daysAgo(31), new_dismissed: 0 })).toBe(false);
  });

  it("is false when dismissed, regardless of age", () => {
    expect(isNewGame({ created_at: daysAgo(0), new_dismissed: 1 })).toBe(false);
  });
});

describe("defaultWeightFor", () => {
  it("gives new games a higher default weight (2)", () => {
    expect(defaultWeightFor({ created_at: daysAgo(1), new_dismissed: 0 })).toBe(2);
  });

  it("gives older games weight 1", () => {
    expect(defaultWeightFor({ created_at: daysAgo(90), new_dismissed: 0 })).toBe(1);
  });
});
