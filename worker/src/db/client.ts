export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
}

export async function query(env: Env, sql: string, args: any[] = []) {
  const url = env.TURSO_URL.replace("libsql://", "https://");
  const res = await fetch(`${url}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(toValue) } },
        { type: "close" },
      ],
    }),
  });
  const data: any = await res.json();
  if (data.results?.[0]?.type === "error") {
    throw new Error(data.results[0].error.message);
  }
  const result = data.results?.[0]?.response?.result;
  const cols = result?.cols?.map((c: any) => c.name) ?? [];
  const rows = result?.rows?.map((row: any[]) =>
    Object.fromEntries(cols.map((col: string, i: number) => [col, fromValue(row[i])]))
  ) ?? [];
  return { rows, lastInsertRowid: result?.last_insert_rowid ?? null };
}

function toValue(v: any) {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "number") return { type: "integer", value: String(v) };
  if (typeof v === "boolean") return { type: "integer", value: v ? "1" : "0" };
  return { type: "text", value: String(v) };
}

function fromValue(v: any) {
  if (!v || v.type === "null") return null;
  if (v.type === "integer") return Number(v.value);
  if (v.type === "float") return parseFloat(v.value);
  return v.value;
}
