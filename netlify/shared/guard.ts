// Cheap abuse deterrence for the public BGG proxy. This is not a hard security
// boundary (headers can be forged with curl) — it just stops the endpoint from
// being trivially reused as a free BGG proxy by other sites or drive-by scripts,
// which is the realistic threat for a small hobby app. If it ever gets actively
// hammered, add edge rate-limiting on top.

// Returns true if the request looks like it came from our own front-end.
export function isSameOrigin(req: Request): boolean {
  // Fetch Metadata: modern browsers stamp this and it can't be set by script.
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") return false; // definitely another origin
  if (site === "same-origin" || site === "same-site") return true;

  // Older clients / no Fetch Metadata: fall back to Origin/Referer host match.
  const host = new URL(req.url).host;
  const ref = req.headers.get("origin") ?? req.headers.get("referer");
  if (!ref) return false; // no signals at all (e.g. bare curl) → reject
  try {
    return new URL(ref).host === host;
  } catch {
    return false;
  }
}

export const forbidden = () =>
  Response.json({ error: "forbidden" }, { status: 403 });

// BGG search terms are short; anything longer is almost certainly abuse/noise.
export const MAX_QUERY_LEN = 100;

// BGG thing ids are positive integers well under this ceiling; bound them so a
// malformed/huge id never gets forwarded upstream.
export function isValidBggId(id: number): boolean {
  return Number.isInteger(id) && id > 0 && id <= 10_000_000;
}
