import 'dotenv/config';
import { pool } from './src/config/supabase.js';

async function migrate() {
  try {
    await pool.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL'");
    await pool.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE");
    await pool.query("CREATE TABLE IF NOT EXISTS announcement_reads (id SERIAL PRIMARY KEY, user_id VARCHAR(50) NOT NULL, announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE, read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, announcement_id))");
    console.log('Database migrated successfully');
  } catch(e) {
    console.error(e.message);
  } finally {
    process.exit();
  }
}

migrate();
