import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import pool from "./src/config/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile(filePath) {
	console.log(`Running ${path.basename(filePath)}...`);
	const sql = fs.readFileSync(filePath, "utf-8");
	await pool.query(sql);
}

async function migrate() {
	try {
		// 1. Run core schema definition
		await runSqlFile(path.join(__dirname, "src", "database", "schema.sql"));

		// 2. Run student-teacher junction table setup
		await runSqlFile(path.join(__dirname, "src", "config", "migration_student_teacher.sql"));

		// 3. Run default administrators setup
		await runSqlFile(path.join(__dirname, "src", "database", "migration_add_admins_antigo_manes.sql"));

		console.log("Migration completed successfully!");

		// 4. Run seeding if --seed argument is provided
		const args = process.argv.slice(2);
		if (args.includes("--seed")) {
			console.log("Seeding database...");
			await runSqlFile(path.join(__dirname, "src", "database", "seed_users.sql"));
			await runSqlFile(path.join(__dirname, "src", "database", "seed_evaluation_content.sql"));
			await runSqlFile(path.join(__dirname, "src", "database", "seed_additional_teachers.sql"));
			console.log("Seeding completed successfully!");
		}
	} catch (err) {
		console.error("Migration failed:", err.message);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
