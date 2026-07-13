import { describe, it, expect } from "vitest";
import { parseImport } from "./repo";

describe("parseImport", () => {
  it("rejects non-object input", () => {
    expect(() => parseImport(null)).toThrow(/invalid file/);
    expect(() => parseImport("nope")).toThrow(/invalid file/);
  });

  it("rejects a blob without a games array", () => {
    expect(() => parseImport({})).toThrow(/missing games/);
    expect(() => parseImport({ games: "x" })).toThrow(/missing games/);
  });

  it("rejects entries that aren't objects", () => {
    expect(() => parseImport({ games: [123] })).toThrow(/not an object/);
  });

  it("rejects entries missing id or title", () => {
    expect(() => parseImport({ games: [{ id: 1 }] })).toThrow(/missing id or title/);
    expect(() => parseImport({ games: [{ title: "x" }] })).toThrow(/missing id or title/);
  });

  it("fills defaults for a minimal valid entry", () => {
    const [row] = parseImport({ games: [{ id: 5, title: "Azul" }] });
    expect(row).toMatchObject({
      id: 5,
      title: "Azul",
      image_url: null,
      min_players: null,
      max_players: null,
      playing_time: null,
      weight: null,
      status: "normal",
      new_dismissed: 0,
    });
    expect(typeof row.created_at).toBe("string");
  });

  it("preserves provided fields", () => {
    const [row] = parseImport({
      games: [
        {
          id: -1,
          title: "Homebrew",
          min_players: 2,
          max_players: 4,
          new_dismissed: 1,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(row.min_players).toBe(2);
    expect(row.max_players).toBe(4);
    expect(row.new_dismissed).toBe(1);
    expect(row.created_at).toBe("2024-01-01T00:00:00.000Z");
  });
});
