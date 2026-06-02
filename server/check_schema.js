import 'dotenv/config';
import pool from './src/config/supabase.js';

async function checkSchema() {
	try {
		const res = await pool.query(`
			SELECT column_name, data_type 
			FROM information_schema.columns 
			WHERE table_name = 'teachers'
		`);
		console.log("Teachers columns:", res.rows);
	} catch (e) {
		console.error(e);
	} finally {
		pool.end();
	}
}

checkSchema();
