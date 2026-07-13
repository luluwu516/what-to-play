import { fetchGameDetail } from "../../src/lib/bgg-core";
import { isSameOrigin, forbidden, isValidBggId } from "../shared/guard";

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
  const id = Number(url.searchParams.get("id"));
  if (!isValidBggId(id)) {
    return Response.json({ error: "valid id query param required" }, { status: 400 });
  }
  try {
    const detail = await fetchGameDetail(id, token);
    return Response.json({ detail });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
};

export const config = { path: "/api/bgg/thing" };
