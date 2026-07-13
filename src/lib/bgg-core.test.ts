import { describe, it, expect } from "vitest";
import { relevance } from "./bgg-core";

describe("relevance", () => {
  it("scores an exact (case-insensitive) match highest", () => {
    expect(relevance("Wingspan", "wingspan")).toBe(10000);
  });

  it("ranks exact above a longer prefix match", () => {
    expect(relevance("Wingspan", "wingspan")).toBeGreaterThan(
      relevance("Wingspan Europe", "wingspan"),
    );
  });

  it("ranks a word-prefix match above a mid-word substring match", () => {
    // "cat" begins a word in the first title, but is buried inside the second.
    expect(relevance("Cat in the Box", "cat")).toBeGreaterThan(
      relevance("Scattergories", "cat"),
    );
  });

  it("returns a strong negative when a token is absent entirely", () => {
    expect(relevance("Chess", "wingspan")).toBeLessThan(0);
  });
});
