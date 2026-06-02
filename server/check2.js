import pg from "pg";

const pool = new pg.Pool({
	connectionString: "postgresql://postgres.uvkozartuwjylpvdadfp:UbXacdOfaVYQpGXA@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
	ssl: { rejectUnauthorized: false },
});

async function main() {
	const res = await pool.query("SELECT * FROM questions LIMIT 2");
	console.log(res.rows);
	process.exit(0);
}
main();
