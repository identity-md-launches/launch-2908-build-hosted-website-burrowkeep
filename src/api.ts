import type { Board, BoardRow } from "./types";

// Exact hosted API address from beibei030/burrowkeep commit a836815 (mill.js:25).
// An explicit origin also works when this static export is served from a subpath.
export const API = "https://burrowkeep-api.46.250.250.111.sslip.io";

export async function request(path: string, body?: object): Promise<unknown> {
  const response = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    ...(body
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export function parseBoard(raw: unknown): Board {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("wealth" in raw) ||
    !("decor" in raw)
  )
    throw new Error("Invalid leaderboard");
  const rows = (data: unknown): BoardRow[] => {
    if (!Array.isArray(data)) throw new Error("Invalid leaderboard");
    return data
      .filter(
        (row) =>
          row &&
          typeof row.id === "string" &&
          /^[a-z0-9]{8,32}$/i.test(row.id) &&
          Number.isSafeInteger(row.score) &&
          row.score >= 0,
      )
      .slice(0, 8)
      .map((row) => ({ id: row.id, score: row.score }));
  };
  return { wealth: rows(raw.wealth), decor: rows(raw.decor) };
}
