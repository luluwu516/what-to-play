// Browser-side BGG calls. Routes to a serverless function in prod
// (Netlify) or the Vite dev middleware in dev — both at /api/bgg/*.

import type { BggSearchHit, BggGameDetail } from "./bgg-core";

export type { BggSearchHit, BggGameDetail };

export async function searchBGG(q: string): Promise<BggSearchHit[]> {
  const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const j = await res.json();
  return j.hits as BggSearchHit[];
}

export async function fetchBGGDetail(id: number): Promise<BggGameDetail> {
  const res = await fetch(`/api/bgg/thing?id=${id}`);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Thing failed: ${res.status}`);
  }
  const j = await res.json();
  return j.detail as BggGameDetail;
}
