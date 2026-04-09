import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

/**
 * Auto-migrate: runs all SQL migration files on startup.
 * Resolves the DigitalOcean ${component.VAR} template by reading
 * the actual env var that DO injects under a different name.
 */
export async function runMigrations() {
  // Resolve the real DATABASE_URL — DO sometimes injects it as a different var
  let dbUrl = process.env.DATABASE_URL ?? "";

  // If it's still an unresolved template like ${dev-db-297387.DATABASE_URL},
  // scan all env vars for one that looks like a mysql connection string
  if (!dbUrl || dbUrl.startsWith("${")) {
    const mysqlVar = Object.entries(process.env).find(
      ([k, v]) =>
        k !== "DATABASE_URL" &&
        v &&
        (v.startsWith("mysql://") || v.startsWith("mysql2://"))
    );
    if (mysqlVar) {
      dbUrl = mysqlVar[1]!;
      console.log(`[Migrate] Resolved DATABASE_URL from env var: ${mysqlVar[0]}`);
    }
  }

  if (!dbUrl || dbUrl.startsWith("${")) {
    console.warn("[Migrate] No valid DATABASE_URL found — skipping migrations");
    return;
  }

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(dbUrl);
    console.log("[Migrate] Connected to database");

    // Create migrations tracking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL UNIQUE,
        created_at BIGINT
      )
    `);

    // Get list of already-applied migrations
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT hash FROM __drizzle_migrations"
    );
    const applied = new Set(rows.map((r) => r.hash));

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
      if (applied.has(file)) {
        console.log(`[Migrate] Already applied: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      // Split on --> statement-breakpoint or semicolons
      const statements = sql
        .split(/-->.*statement-breakpoint/i)
        .flatMap((s) => s.split(/;\s*\n/))
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        try {
          await connection.execute(stmt);
        } catch (err: any) {
          // Ignore "already exists" errors so re-runs are safe
          if (
            err.code === "ER_TABLE_EXISTS_ERROR" ||
            err.code === "ER_DUP_FIELDNAME" ||
            err.code === "ER_DUP_KEYNAME" ||
            err.errno === 1060 ||
            err.errno === 1061 ||
            err.errno === 1050
          ) {
            // silently skip
          } else {
            console.warn(`[Migrate] Warning in ${file}:`, err.message);
          }
        }
      }

      await connection.execute(
        "INSERT IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        [file, Date.now()]
      );
      console.log(`[Migrate] Applied: ${file}`);
    }

    console.log("[Migrate] All migrations complete");
  } catch (err) {
    console.error("[Migrate] Migration error:", err);
    // Don't crash the server — app can still run with existing schema
  } finally {
    if (connection) await connection.end();
  }
}
