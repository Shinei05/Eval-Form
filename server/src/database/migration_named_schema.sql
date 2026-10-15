-- ProjectEVAL: create an empty, isolated schema in the current Supabase project.
-- Replace every eval_import reference below if you want another schema name.
-- Run the whole file in the Supabase SQL Editor. It does not copy any data.
-- The API server uses a direct PostgreSQL connection, so this schema does not
-- need to be added to Supabase's Exposed schemas list for CSV uploads.

BEGIN;

CREATE SCHEMA IF NOT EXISTS eval_import;

-- Stop if this schema already contains tables, so a rerun cannot silently
-- leave an older table definition in place.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'eval_import' AND table_type = 'BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Schema eval_import already contains tables; use a fresh schema name';
  END IF;
END;
$$;

SET LOCAL search_path TO eval_import;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  reset VARCHAR(20),
  verify_code VARCHAR(20),
  is_teacher BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  subjects VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  stud_id BIGINT,
  usr_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  teacher INTEGER,
  grade VARCHAR(50),
  section VARCHAR(50),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  subject INTEGER REFERENCES subjects(id),
  quarter INTEGER,
  year INTEGER,
  identifier VARCHAR(20),
  usr_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_elementary BOOLEAN NOT NULL DEFAULT FALSE,
  is_jhs BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS headers (
  id SERIAL PRIMARY KEY,
  header TEXT NOT NULL,
  identifier VARCHAR(50),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS header_t (
  id SERIAL PRIMARY KEY,
  header TEXT NOT NULL,
  identifier VARCHAR(50),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  questions TEXT NOT NULL,
  header_id INTEGER REFERENCES headers(id) ON DELETE CASCADE,
  header_version VARCHAR(50),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_t (
  id SERIAL PRIMARY KEY,
  questions TEXT NOT NULL,
  header_id INTEGER REFERENCES header_t(id) ON DELETE CASCADE,
  header_version VARCHAR(50),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation (
  id SERIAL PRIMARY KEY,
  tcr_id INTEGER REFERENCES teachers(id),
  evt_id INTEGER,
  identifier VARCHAR(20),
  feedback TEXT,
  avg DECIMAL(5,2),
  sentiment VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_answer (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES evaluation(id) ON DELETE CASCADE,
  question_id INTEGER,
  score INTEGER
);

CREATE TABLE IF NOT EXISTS evaluation_p (
  id SERIAL PRIMARY KEY,
  tcr_id INTEGER REFERENCES teachers(id),
  evt_id INTEGER,
  identifier VARCHAR(20),
  feedback TEXT,
  avg DECIMAL(5,2),
  sentiment VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_ans_p (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES evaluation_p(id) ON DELETE CASCADE,
  question_id INTEGER,
  score INTEGER
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(50),
  p1_time_start VARCHAR(50),
  p1_date_start VARCHAR(50),
  p1_time_end VARCHAR(50),
  p1_date_end VARCHAR(50),
  p2_time_start VARCHAR(50),
  p2_date_start VARCHAR(50),
  p2_time_end VARCHAR(50),
  p2_date_end VARCHAR(50),
  p3_time_start VARCHAR(50),
  p3_date_start VARCHAR(50),
  p3_time_end VARCHAR(50),
  p3_date_end VARCHAR(50),
  p4_time_start VARCHAR(50),
  p4_date_start VARCHAR(50),
  p4_time_end VARCHAR(50),
  p4_date_end VARCHAR(50),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_teacher (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id),
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  section VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (student_id, teacher_id, quarter, year)
);

CREATE TABLE IF NOT EXISTS questionnaire_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  author_id VARCHAR(50) NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL',
  is_pinned BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_usr_id ON students(usr_id);
CREATE INDEX IF NOT EXISTS idx_teachers_usr_id ON teachers(usr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_tcr ON evaluation(tcr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_evt ON evaluation(evt_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_p_tcr ON evaluation_p(tcr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_p_evt ON evaluation_p(evt_id);
CREATE INDEX IF NOT EXISTS idx_eval_answer_sid ON evaluation_answer(session_id);
CREATE INDEX IF NOT EXISTS idx_eval_ans_p_sid ON evaluation_ans_p(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_hid ON questions(header_id);
CREATE INDEX IF NOT EXISTS idx_question_t_hid ON question_t(header_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_student ON student_teacher(student_id, quarter, year);
CREATE INDEX IF NOT EXISTS idx_student_teacher_teacher ON student_teacher(teacher_id, quarter, year);

COMMIT;

-- Expect 17 tables. A fresh schema starts with zero user/teacher/student rows.
SELECT table_schema, COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'eval_import' AND table_type = 'BASE TABLE'
GROUP BY table_schema;
