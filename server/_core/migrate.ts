import postgres from "postgres";
import path from "path";
import fs from "fs";

/**
 * Auto-migrate: runs all SQL migration files on startup.
 * Works with DigitalOcean PostgreSQL Dev Database.
 * Resolves unresolved ${component.VAR} template strings by scanning all env vars.
 */
export async function runMigrations() {
  // Resolve the real DATABASE_URL
  let dbUrl = process.env.DATABASE_URL ?? "";

  // If it's an unresolved DO template like ${dev-db-xxxxx.DATABASE_URL},
  // scan all env vars for one that looks like a postgres connection string
  if (!dbUrl || dbUrl.startsWith("${")) {
    const pgVar = Object.entries(process.env).find(
      ([k, v]) =>
        k !== "DATABASE_URL" &&
        v &&
        (v.startsWith("postgres://") || v.startsWith("postgresql://"))
    );
    if (pgVar) {
      dbUrl = pgVar[1]!;
      console.log(`[Migrate] Resolved DATABASE_URL from env var: ${pgVar[0]}`);
    }
  }

  if (!dbUrl || dbUrl.startsWith("${")) {
    console.warn("[Migrate] No valid DATABASE_URL found — skipping migrations");
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
