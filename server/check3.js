import pg from "pg";

const pool = new pg.Pool({
	connectionString: "postgresql://postgres.uvkozartuwjylpvdadfp:UbXacdOfaVYQpGXA@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
	ssl: { rejectUnauthorized: false },
});

async function main() {
	const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'question_t'");
	console.log(res.rows.map(r => r.column_name));
	process.exit(0);
}
main();
