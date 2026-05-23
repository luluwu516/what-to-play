import { fetchGameDetail } from "../../src/lib/bgg-core";

export default async (req: Request): Promise<Response> => {
  const token = process.env.BGG_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "BGG_API_TOKEN is not configured on the server" },
      { status: 500 },
    );
  }
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return Response.json({ error: "id query param required" }, { status: 400 });
  }
  try {
    const detail = await fetchGameDetail(id, token);
    return Response.json({ detail });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
};

export const config = { path: "/api/bgg/thing" };
