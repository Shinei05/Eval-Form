-- Migration: Student-Teacher Assignment System
-- Run this against your PostgreSQL/Supabase database

-- 1. Add section/block column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- 2. Create student-teacher assignment junction table
CREATE TABLE IF NOT EXISTS student_teacher (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    quarter INTEGER NOT NULL,
    year INTEGER NOT NULL,
    section VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, teacher_id, quarter, year)
);

-- 3. Index for fast lookups by student
CREATE INDEX IF NOT EXISTS idx_student_teacher_student ON student_teacher(student_id, quarter, year);

-- 4. Index for fast lookups by teacher
CREATE INDEX IF NOT EXISTS idx_student_teacher_teacher ON student_teacher(teacher_id, quarter, year);
