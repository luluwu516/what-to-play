// Netlify Function (v2): proxies BGG search so the browser doesn't need
// to handle CORS or hold the API token. Bundled by esbuild; can import
// from anywhere in the repo.

import { searchGames } from "../../src/lib/bgg-core";

export default async (req: Request): Promise<Response> => {
  const token = process.env.BGG_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "BGG_API_TOKEN is not configured on the server" },
      { status: 500 },
    );
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  try {
    const hits = await searchGames(q, token);
    return Response.json({ hits });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
};

export const config = { path: "/api/bgg/search" };
