import postgres from "postgres";
import path from "path";
import fs from "fs";

/**
 * Resolve a valid PostgreSQL connection URL from environment variables.
 * DigitalOcean may inject the URL under various names depending on how
 * the database component is attached. We try multiple strategies.
 */
function resolvePostgresUrl(): string | null {
  // Strategy 1: DATABASE_URL is set and not an unresolved template
  const raw = process.env.DATABASE_URL ?? "";
  if (raw && !raw.startsWith("${")) {
    console.log("[Migrate] Using DATABASE_URL env var");
    return raw;
  }
  if (raw.startsWith("${")) {
    console.warn(`[Migrate] DATABASE_URL is unresolved template: ${raw}`);
  }

  // Strategy 2: Scan ALL env vars for a postgres connection string
  // DO may inject it as db_DATABASE_URL, POSTGRES_URL, etc.
  const pgEntry = Object.entries(process.env).find(
    ([k, v]) =>
      k !== "DATABASE_URL" &&
      v &&
      (v.startsWith("postgres://") || v.startsWith("postgresql://"))
  );
  if (pgEntry) {
    console.log(`[Migrate] Found postgres URL in env var: ${pgEntry[0]}`);
    return pgEntry[1]!;
  }

  // Strategy 3: Reconstruct from individual DO component vars
  // DO injects: {prefix}_HOST, {prefix}_PORT, {prefix}_USERNAME, {prefix}_PASSWORD, {prefix}_DATABASE
  const prefixes = ["db", "DB", "database", "DATABASE", "pg", "PG", "postgres", "POSTGRES"];
  for (const prefix of prefixes) {
    const host = process.env[`${prefix}_HOST`];
    const port = process.env[`${prefix}_PORT`] || "25060";
    const user = process.env[`${prefix}_USERNAME`] || process.env[`${prefix}_USER`];
    const pass = process.env[`${prefix}_PASSWORD`];
    const name = process.env[`${prefix}_DATABASE`] || process.env[`${prefix}_NAME`];
    if (host && user && pass && name) {
      const url = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}?sslmode=require`;
      console.log(`[Migrate] Reconstructed postgres URL from ${prefix}_* vars`);
      return url;
    }
  }

  return null;
}

/**
 * Auto-migrate: runs all SQL migration files on startup.
 * Works with DigitalOcean PostgreSQL Dev Database.
 */
export async function runMigrations() {
  const dbUrl = resolvePostgresUrl();

  if (!dbUrl) {
    // Print all env var KEYS (not values) to help diagnose what DO actually injects
    const allKeys = Object.keys(process.env).sort().join(", ");
    console.warn("[Migrate] No valid DATABASE_URL found — skipping migrations");
    console.warn("[Migrate] Available env var keys:", allKeys);
    return;
  }

  let sql: ReturnType<typeof postgres> | null = null;
  try {
    sql = postgres(dbUrl, { ssl: "require", max: 1 });
    console.log("[Migrate] Connected to PostgreSQL database");

    // Create migrations tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash VARCHAR(255) NOT NULL UNIQUE,
        created_at BIGINT
      )
    `;

    // Get list of already-applied migrations
    const applied = await sql<{ hash: string }[]>`
      SELECT hash FROM __drizzle_migrations
    `;
    const appliedSet = new Set(applied.map((r) => r.hash));

    // Find all SQL migration files
    const migrationsDir = path.join(process.cwd(), "drizzle");
    if (!fs.existsSync(migrationsDir)) {
      console.warn("[Migrate] No drizzle/ directory found");
      return;
    }

    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        console.log(`[Migrate] Already applied: ${file}`);
        continue;
      }

      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      // Split on --> statement-breakpoint markers
      const statements = content
        .split(/-->.*statement-breakpoint/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        try {
          await sql.unsafe(stmt);
        } catch (err: any) {
          // Ignore "already exists" errors so re-runs are safe
          if (
            err.code === "42P07" || // relation already exists
            err.code === "42710" || // duplicate object (enum)
            err.code === "42701"    // duplicate column
          ) {
            // silently skip
          } else {
            console.warn(`[Migrate] Warning in ${file}:`, err.message);
          }
        }
      }

      await sql`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (${file}, ${Date.now()})
        ON CONFLICT (hash) DO NOTHING
      `;
      console.log(`[Migrate] Applied: ${file}`);
    }

    console.log("[Migrate] All migrations complete");
  } catch (err) {
    console.error("[Migrate] Migration error:", err);
    // Don't crash the server
  } finally {
    if (sql) await sql.end();
  }
}
