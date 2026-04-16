import { createClient } from "@libsql/client/web";

export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
}

export function getDB(env: Env) {
  return createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}
