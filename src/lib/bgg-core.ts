// BGG XML API2 client. Pure functions — no env access.
// Used by both the Netlify function (prod) and the Vite dev middleware (dev).

import { XMLParser } from "fast-xml-parser";

const BGG = "https://boardgamegeek.com/xmlapi2";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
});

async function fetchXml(
  url: string,
  token: string,
  retries = 3,
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { Accept: "application/xml", Authorization: `Bearer ${token}` },
    });
    if (res.status === 202) {
      // BGG's thing endpoint queues sometimes; back off and retry.
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    if (!res.ok) throw new Error(`BGG ${res.status}: ${url}`);
    return res.text();
  }
  throw new Error("BGG took too long to respond");
}

export type BggSearchHit = { id: number; title: string; year: number | null };

export async function searchGames(
  query: string,
  token: string,
): Promise<BggSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${BGG}/search?query=${encodeURIComponent(q)}&type=boardgame`;
  const xml = await fetchXml(url, token);
  const json = parser.parse(xml);
  const items = json?.items?.item ?? [];
  const hits: BggSearchHit[] = items.map((it: BggItem) => ({
    id: Number(it["@_id"]),
    title: pickPrimaryName(it.name) ?? "(unknown)",
    year: it.yearpublished?.["@_value"]
      ? Number(it.yearpublished["@_value"])
      : null,
  }));
  // BGG sorts by internal popularity; re-rank so prefix and word-prefix
  // matches float to the top.
  return hits.sort((a, b) => relevance(b.title, q) - relevance(a.title, q)).slice(0, 20);
}

export type BggGameDetail = {
  id: number;
  title: string;
  image_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  weight: number | null;
};

export async function fetchGameDetail(
  id: number,
  token: string,
): Promise<BggGameDetail> {
  const url = `${BGG}/thing?id=${id}&stats=1`;
  const xml = await fetchXml(url, token);
  const json = parser.parse(xml);
  const it = json?.items?.item?.[0];
  if (!it) throw new Error(`BGG returned no item for id=${id}`);
  const weightRaw = it?.statistics?.ratings?.averageweight?.["@_value"];
  return {
    id,
    title: pickPrimaryName(it.name) ?? "(unknown)",
    image_url: typeof it.image === "string" ? it.image : null,
    min_players: it.minplayers?.["@_value"]
      ? Number(it.minplayers["@_value"])
      : null,
    max_players: it.maxplayers?.["@_value"]
      ? Number(it.maxplayers["@_value"])
      : null,
    playing_time: it.playingtime?.["@_value"]
      ? Number(it.playingtime["@_value"])
      : null,
    weight: weightRaw ? Number(weightRaw) : null,
  };
}

// ---- helpers / minimal types ----

type BggNameEntry = { "@_type"?: string; "@_value"?: string };
type BggValue = { "@_value"?: string };
type BggItem = {
  "@_id": string;
  name?: BggNameEntry[];
  yearpublished?: BggValue;
  image?: string;
  minplayers?: BggValue;
  maxplayers?: BggValue;
  playingtime?: BggValue;
  statistics?: { ratings?: { averageweight?: BggValue } };
};

function pickPrimaryName(names: BggNameEntry[] | undefined): string | null {
  if (!names || names.length === 0) return null;
  const primary = names.find((n) => n["@_type"] === "primary");
  return (primary ?? names[0])["@_value"] ?? null;
}

function relevance(title: string, query: string): number {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 10000;
  if (t.startsWith(q)) return 5000 - t.length;
  const tokens = q.split(/\s+/).filter(Boolean);
  const words = t.split(/[\s:,\-–—]+/).filter(Boolean);
  let wordPrefixHits = 0;
  let containsHits = 0;
  let positionPenalty = 0;
  for (const tk of tokens) {
    const wi = words.findIndex((w) => w.startsWith(tk));
    if (wi >= 0) {
      wordPrefixHits++;
      positionPenalty += wi;
      continue;
    }
    const si = t.indexOf(tk);
    if (si >= 0) {
      containsHits++;
      positionPenalty += 20 + si;
    } else {
      return -1000;
    }
  }
  return 2000 + wordPrefixHits * 300 + containsHits * 50 - positionPenalty * 8 - t.length;
}
