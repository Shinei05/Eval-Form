import pg from "pg";

// ─── PostgreSQL Pool via Supavisor session pooler ────────────
const databaseUrl = process.env.DATABASE_URL;
const dbSchema = process.env.DB_SCHEMA?.trim();

if (!databaseUrl) {
	console.error(
		"Missing DATABASE_URL in .env (use the Supabase session pooler connection string)",
	);
	process.exit(1);
}

if (dbSchema && !/^[a-z_][a-z0-9_]*$/.test(dbSchema)) {
	throw new Error("DB_SCHEMA must be a lowercase PostgreSQL schema name (letters, digits, underscores)");
}

const pool = new pg.Pool({
	connectionString: databaseUrl,
	// Apply the schema before any query runs. Do not fall back to public.
	...(dbSchema ? { options: `-c search_path=${dbSchema}` } : {}),
	ssl: { rejectUnauthorized: false },
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
	console.error("Unexpected PG pool error:", err.message);
});

// Initialize questionnaire_settings table automatically on startup
pool.query(`
	CREATE TABLE IF NOT EXISTS questionnaire_settings (
		key VARCHAR(100) PRIMARY KEY,
		value TEXT NOT NULL
	);
`).catch((err) => {
	console.error("Failed to initialize questionnaire_settings table:", err.message);
});

export { pool };
export default pool;
