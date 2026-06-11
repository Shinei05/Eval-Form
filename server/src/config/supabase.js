import pg from "pg";

// ─── PostgreSQL Pool via Supavisor session pooler ────────────
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error(
		"Missing DATABASE_URL in .env (use the Supabase session pooler connection string)",
	);
	process.exit(1);
}

const pool = new pg.Pool({
	connectionString: databaseUrl,
	ssl: { rejectUnauthorized: false },
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
});

if (process.env.DB_SCHEMA) {
	pool.on("connect", (client) => {
		client.query(`SET search_path TO "${process.env.DB_SCHEMA}", public;`).catch((err) => {
			console.error("Failed to set search_path:", err.message);
		});
	});
}

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
