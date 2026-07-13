// Netlify Function (v2): proxies BGG search so the browser doesn't need
// to handle CORS or hold the API token. Bundled by esbuild; can import
// from anywhere in the repo.

import { searchGames } from "../../src/lib/bgg-core";
import { isSameOrigin, forbidden, MAX_QUERY_LEN } from "../shared/guard";

export default async (req: Request): Promise<Response> => {
  if (!isSameOrigin(req)) return forbidden();
  const token = process.env.BGG_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "BGG_API_TOKEN is not configured on the server" },
      { status: 500 },
    );
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.length > MAX_QUERY_LEN) {
    return Response.json({ error: "query too long" }, { status: 400 });
  }
  try {
    const hits = await searchGames(q, token);
    return Response.json({ hits });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
};

export const config = { path: "/api/bgg/search" };
