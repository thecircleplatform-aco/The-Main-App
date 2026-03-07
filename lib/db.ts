import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __circle_pool: Pool | undefined;
}

/**
 * Serverless-safe pool: reuse one pool per process, limit connections
 * for Vercel/Neon to avoid exhausting DB connections.
 */
export function pool() {
  if (globalThis.__circle_pool) return globalThis.__circle_pool;
  const connectionString = getDatabaseUrl();
  const p = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });
  globalThis.__circle_pool = p;
  return p;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool().query<T>(text, params);
}
