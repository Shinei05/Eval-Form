-- ============================================================
-- ProjectEVAL – Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  reset         VARCHAR(20),
  verify_code   VARCHAR(20),
  is_teacher    BOOLEAN DEFAULT FALSE,
  is_admin      BOOLEAN DEFAULT FALSE,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id        SERIAL PRIMARY KEY,
  subjects  VARCHAR(255) NOT NULL
);

-- 3. Students
CREATE TABLE IF NOT EXISTS students (
  id          SERIAL PRIMARY KEY,
  firstname   VARCHAR(255),
  lastname    VARCHAR(255),
  stud_id     BIGINT,
  usr_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  teacher     INTEGER,
  grade       VARCHAR(50),
  section     VARCHAR(50),
  points      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id          SERIAL PRIMARY KEY,
  firstname   VARCHAR(255),
  lastname    VARCHAR(255),
  subject     INTEGER REFERENCES subjects(id),
  quarter     INTEGER,
  year        INTEGER,
  identifier  VARCHAR(20),
  usr_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_elementary BOOLEAN NOT NULL DEFAULT false,
  is_jhs        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Headers (student evaluation headers)
CREATE TABLE IF NOT EXISTS headers (
  id          SERIAL PRIMARY KEY,
  header      TEXT NOT NULL,
  identifier  VARCHAR(50),
  is_deleted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. header_t (teacher evaluation headers)
CREATE TABLE IF NOT EXISTS header_t (
  id          SERIAL PRIMARY KEY,
  header      TEXT NOT NULL,
  identifier  VARCHAR(50),
  is_deleted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Questions (student evaluation questions)
CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  questions       TEXT NOT NULL,
  header_id       INTEGER REFERENCES headers(id) ON DELETE CASCADE,
  header_version  VARCHAR(50),
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. question_t (teacher evaluation questions)
CREATE TABLE IF NOT EXISTS question_t (
  id              SERIAL PRIMARY KEY,
  questions       TEXT NOT NULL,
  header_id       INTEGER REFERENCES header_t(id) ON DELETE CASCADE,
  header_version  VARCHAR(50),
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Evaluation (student -> teacher evaluations)
CREATE TABLE IF NOT EXISTS evaluation (
  id          SERIAL PRIMARY KEY,
  tcr_id      INTEGER REFERENCES teachers(id),
  evt_id      INTEGER,
  identifier  VARCHAR(20),
  feedback    TEXT,
  avg         DECIMAL(5,2),
  sentiment   VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. evaluation_answer
CREATE TABLE IF NOT EXISTS evaluation_answer (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER REFERENCES evaluation(id) ON DELETE CASCADE,
  question_id INTEGER,
  score       INTEGER
);

-- 11. evaluation_p (peer / teacher evaluations)
CREATE TABLE IF NOT EXISTS evaluation_p (
  id          SERIAL PRIMARY KEY,
  tcr_id      INTEGER REFERENCES teachers(id),
  evt_id      INTEGER,
  identifier  VARCHAR(20),
  feedback    TEXT,
  avg         DECIMAL(5,2),
  sentiment   VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 12. evaluation_ans_p
CREATE TABLE IF NOT EXISTS evaluation_ans_p (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER REFERENCES evaluation_p(id) ON DELETE CASCADE,
  question_id INTEGER,
  score       INTEGER
);

-- 13. Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id              SERIAL PRIMARY KEY,
  school_year     VARCHAR(50),
  p1_time_start   VARCHAR(50),
  p1_date_start   VARCHAR(50),
  p1_time_end     VARCHAR(50),
  p1_date_end     VARCHAR(50),
  p2_time_start   VARCHAR(50),
  p2_date_start   VARCHAR(50),
  p2_time_end     VARCHAR(50),
  p2_date_end     VARCHAR(50),
  p3_time_start   VARCHAR(50),
  p3_date_start   VARCHAR(50),
  p3_time_end     VARCHAR(50),
  p3_date_end     VARCHAR(50),
  p4_time_start   VARCHAR(50),
  p4_date_start   VARCHAR(50),
  p4_time_end     VARCHAR(50),
  p4_date_end     VARCHAR(50),
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_usr_id   ON students(usr_id);
CREATE INDEX IF NOT EXISTS idx_teachers_usr_id   ON teachers(usr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_tcr    ON evaluation(tcr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_evt    ON evaluation(evt_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_p_tcr  ON evaluation_p(tcr_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_p_evt  ON evaluation_p(evt_id);
CREATE INDEX IF NOT EXISTS idx_eval_answer_sid   ON evaluation_answer(session_id);
CREATE INDEX IF NOT EXISTS idx_eval_ans_p_sid    ON evaluation_ans_p(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_hid     ON questions(header_id);
CREATE INDEX IF NOT EXISTS idx_question_t_hid    ON question_t(header_id);
