import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse a single Pool across hot reloads (dev) and warm serverless invocations
// (prod). Creating a new Pool per module evaluation leaks connections and can
// exhaust Neon's connection limit.
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep the footprint small on serverless where many instances share Neon's
    // connection budget.
    max: 5,
    // Fail fast instead of hanging a request forever if a connection can't be
    // established (surfaces as a catchable error rather than a stuck function).
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  // CRITICAL: without this listener, an error on an *idle* client (e.g. Neon
  // closing an idle connection) is emitted as an unhandled 'error' event, which
  // crashes the entire process/serverless function and surfaces to users as an
  // opaque "server-side exception" (with a digest). Handling it lets the pool
  // quietly discard the dead client and create a fresh one on the next query.
  pool.on("error", (err) => {
    console.log("[v0] Postgres pool idle client error (recovered):", err.message);
  });

  return pool;
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
