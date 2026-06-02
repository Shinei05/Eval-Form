-- ============================================================
-- ProjectEVAL – Seed Additional 10 Teachers
--
-- Adds 10 more teacher users (IDs 62-71) and teacher records
-- (IDs 12-21) with student-teacher assignments.
-- All passwords: password123
--
-- ⚠ This is ADDITIVE – it does NOT truncate existing data.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. New teacher users (IDs 62-71)
--    Same bcrypt hash for "password123"
-- ────────────────────────────────────────────────────────────
INSERT INTO users (email, password, reset, verify_code, is_teacher, is_admin, is_verified) VALUES
  ('teacher11@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000062', 'VRF0000062', true, false, true),
  ('teacher12@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000063', 'VRF0000063', true, false, true),
  ('teacher13@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000064', 'VRF0000064', true, false, true),
  ('teacher14@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000065', 'VRF0000065', true, false, true),
  ('teacher15@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000066', 'VRF0000066', true, false, true),
  ('teacher16@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000067', 'VRF0000067', true, false, true),
  ('teacher17@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000068', 'VRF0000068', true, false, true),
  ('teacher18@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000069', 'VRF0000069', true, false, true),
  ('teacher19@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000070', 'VRF0000070', true, false, true),
  ('teacher20@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000071', 'VRF0000071', true, false, true);


-- ────────────────────────────────────────────────────────────
-- 2. Teacher records (IDs 12-21)
--    Each teaches one subject, Q3 2025
--    Two teachers per subject to test peer evaluation
-- ────────────────────────────────────────────────────────────
INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id) VALUES
  ('Luz',       'Mendoza',     1,  3, 2025, 'TCR2025011', 62),   -- Filipino,    teacher_id = 12
  ('Ramon',     'Tan',         2,  3, 2025, 'TCR2025012', 63),   -- English,     teacher_id = 13
  ('Patricia',  'Lim',         3,  3, 2025, 'TCR2025013', 64),   -- Math,        teacher_id = 14
  ('Eduardo',   'Ong',         4,  3, 2025, 'TCR2025014', 65),   -- Science,     teacher_id = 15
  ('Carmen',    'Chu',         5,  3, 2025, 'TCR2025015', 66),   -- AP,          teacher_id = 16
  ('Roberto',   'Sy',          6,  3, 2025, 'TCR2025016', 67),   -- MAPEH,       teacher_id = 17
  ('Angelina',  'Chua',        7,  3, 2025, 'TCR2025017', 68),   -- TLE,         teacher_id = 18
  ('Domingo',   'Reyes',       8,  3, 2025, 'TCR2025018', 69),   -- Values,      teacher_id = 19
  ('Rosita',    'Santos',      9,  3, 2025, 'TCR2025019', 70),   -- CompSci,     teacher_id = 20
  ('Nestor',    'Cruz',        10, 3, 2025, 'TCR2025020', 71);   -- Research,    teacher_id = 21


-- ────────────────────────────────────────────────────────────
-- 3. Student-Teacher Assignments for new teachers
--    Mirror existing assignment pattern but with new teacher IDs
--    Each section gets 2-3 new teachers
-- ────────────────────────────────────────────────────────────
INSERT INTO student_teacher (student_id, teacher_id, subject_id, quarter, year, section) VALUES
  -- Grade 7 Section A (students 1-3, 41) → New Teachers 12(Filipino),13(English),14(Math)
  (1,  12, 1, 3, 2025, 'A'), (1,  13, 2, 3, 2025, 'A'), (1,  14, 3, 3, 2025, 'A'),
  (2,  12, 1, 3, 2025, 'A'), (2,  13, 2, 3, 2025, 'A'), (2,  14, 3, 3, 2025, 'A'),
  (3,  12, 1, 3, 2025, 'A'), (3,  13, 2, 3, 2025, 'A'), (3,  14, 3, 3, 2025, 'A'),
  (41, 12, 1, 3, 2025, 'A'), (41, 13, 2, 3, 2025, 'A'), (41, 14, 3, 3, 2025, 'A'),

  -- Grade 7 Section B (students 4-6, 42) → New Teachers 12(Filipino),15(Science),17(MAPEH)
  (4,  12, 1, 3, 2025, 'B'), (4,  15, 4, 3, 2025, 'B'), (4,  17, 6, 3, 2025, 'B'),
  (5,  12, 1, 3, 2025, 'B'), (5,  15, 4, 3, 2025, 'B'), (5,  17, 6, 3, 2025, 'B'),
  (6,  12, 1, 3, 2025, 'B'), (6,  15, 4, 3, 2025, 'B'), (6,  17, 6, 3, 2025, 'B'),
  (42, 12, 1, 3, 2025, 'B'), (42, 15, 4, 3, 2025, 'B'), (42, 17, 6, 3, 2025, 'B'),

  -- Grade 7 Section C (students 7-8, 49) → New Teachers 16(AP),19(Values),20(CompSci)
  (7,  16, 5, 3, 2025, 'C'), (7,  19, 8, 3, 2025, 'C'), (7,  20, 9, 3, 2025, 'C'),
  (8,  16, 5, 3, 2025, 'C'), (8,  19, 8, 3, 2025, 'C'), (8,  20, 9, 3, 2025, 'C'),
  (49, 16, 5, 3, 2025, 'C'), (49, 19, 8, 3, 2025, 'C'), (49, 20, 9, 3, 2025, 'C'),

  -- Grade 7 Section D (students 9-10) → New Teachers 13(English),18(TLE),21(Research)
  (9,  13, 2, 3, 2025, 'D'), (9,  18, 7, 3, 2025, 'D'), (9,  21, 10, 3, 2025, 'D'),
  (10, 13, 2, 3, 2025, 'D'), (10, 18, 7, 3, 2025, 'D'), (10, 21, 10, 3, 2025, 'D'),

  -- Grade 8 Section A (students 11-13, 43) → New Teachers 14(Math),15(Science),16(AP)
  (11, 14, 3, 3, 2025, 'A'), (11, 15, 4, 3, 2025, 'A'), (11, 16, 5, 3, 2025, 'A'),
  (12, 14, 3, 3, 2025, 'A'), (12, 15, 4, 3, 2025, 'A'), (12, 16, 5, 3, 2025, 'A'),
  (13, 14, 3, 3, 2025, 'A'), (13, 15, 4, 3, 2025, 'A'), (13, 16, 5, 3, 2025, 'A'),
  (43, 14, 3, 3, 2025, 'A'), (43, 15, 4, 3, 2025, 'A'), (43, 16, 5, 3, 2025, 'A'),

  -- Grade 8 Section B (students 14-16, 44) → New Teachers 17(MAPEH),18(TLE),19(Values)
  (14, 17, 6, 3, 2025, 'B'), (14, 18, 7, 3, 2025, 'B'), (14, 19, 8, 3, 2025, 'B'),
  (15, 17, 6, 3, 2025, 'B'), (15, 18, 7, 3, 2025, 'B'), (15, 19, 8, 3, 2025, 'B'),
  (16, 17, 6, 3, 2025, 'B'), (16, 18, 7, 3, 2025, 'B'), (16, 19, 8, 3, 2025, 'B'),
  (44, 17, 6, 3, 2025, 'B'), (44, 18, 7, 3, 2025, 'B'), (44, 19, 8, 3, 2025, 'B'),

  -- Grade 8 Section C (students 17-18, 50) → New Teachers 15(Science),20(CompSci),21(Research)
  (17, 15, 4, 3, 2025, 'C'), (17, 20, 9, 3, 2025, 'C'), (17, 21, 10, 3, 2025, 'C'),
  (18, 15, 4, 3, 2025, 'C'), (18, 20, 9, 3, 2025, 'C'), (18, 21, 10, 3, 2025, 'C'),
  (50, 15, 4, 3, 2025, 'C'), (50, 20, 9, 3, 2025, 'C'), (50, 21, 10, 3, 2025, 'C'),

  -- Grade 9 Section A (students 21-23, 45) → New Teachers 12(Filipino),13(English),16(AP)
  (21, 12, 1, 3, 2025, 'A'), (21, 13, 2, 3, 2025, 'A'), (21, 16, 5, 3, 2025, 'A'),
  (22, 12, 1, 3, 2025, 'A'), (22, 13, 2, 3, 2025, 'A'), (22, 16, 5, 3, 2025, 'A'),
  (23, 12, 1, 3, 2025, 'A'), (23, 13, 2, 3, 2025, 'A'), (23, 16, 5, 3, 2025, 'A'),
  (45, 12, 1, 3, 2025, 'A'), (45, 13, 2, 3, 2025, 'A'), (45, 16, 5, 3, 2025, 'A'),

  -- Grade 9 Section B (students 24-26, 46) → New Teachers 14(Math),17(MAPEH),19(Values)
  (24, 14, 3, 3, 2025, 'B'), (24, 17, 6, 3, 2025, 'B'), (24, 19, 8, 3, 2025, 'B'),
  (25, 14, 3, 3, 2025, 'B'), (25, 17, 6, 3, 2025, 'B'), (25, 19, 8, 3, 2025, 'B'),
  (26, 14, 3, 3, 2025, 'B'), (26, 17, 6, 3, 2025, 'B'), (26, 19, 8, 3, 2025, 'B'),
  (46, 14, 3, 3, 2025, 'B'), (46, 17, 6, 3, 2025, 'B'), (46, 19, 8, 3, 2025, 'B'),

  -- Grade 10 Section A (students 31-33, 47) → New Teachers 12(Filipino),14(Math),20(CompSci)
  (31, 12, 1, 3, 2025, 'A'), (31, 14, 3, 3, 2025, 'A'), (31, 20, 9, 3, 2025, 'A'),
  (32, 12, 1, 3, 2025, 'A'), (32, 14, 3, 3, 2025, 'A'), (32, 20, 9, 3, 2025, 'A'),
  (33, 12, 1, 3, 2025, 'A'), (33, 14, 3, 3, 2025, 'A'), (33, 20, 9, 3, 2025, 'A'),
  (47, 12, 1, 3, 2025, 'A'), (47, 14, 3, 3, 2025, 'A'), (47, 20, 9, 3, 2025, 'A'),

  -- Grade 10 Section B (students 34-36, 48) → New Teachers 13(English),18(TLE),21(Research)
  (34, 13, 2, 3, 2025, 'B'), (34, 18, 7, 3, 2025, 'B'), (34, 21, 10, 3, 2025, 'B'),
  (35, 13, 2, 3, 2025, 'B'), (35, 18, 7, 3, 2025, 'B'), (35, 21, 10, 3, 2025, 'B'),
  (36, 13, 2, 3, 2025, 'B'), (36, 18, 7, 3, 2025, 'B'), (36, 21, 10, 3, 2025, 'B'),
  (48, 13, 2, 3, 2025, 'B'), (48, 18, 7, 3, 2025, 'B'), (48, 21, 10, 3, 2025, 'B');


COMMIT;

-- ============================================================
-- Quick reference:
-- ============================================================
-- New teacher logins: teacher11@school.edu through teacher20@school.edu
-- All passwords: password123
--
-- New teacher IDs and subjects:
--   12: Luz Mendoza       — Filipino    (teacher11@school.edu, usr_id=62)
--   13: Ramon Tan         — English     (teacher12@school.edu, usr_id=63)
--   14: Patricia Lim      — Mathematics (teacher13@school.edu, usr_id=64)
--   15: Eduardo Ong       — Science     (teacher14@school.edu, usr_id=65)
--   16: Carmen Chu        — AP          (teacher15@school.edu, usr_id=66)
--   17: Roberto Sy        — MAPEH       (teacher16@school.edu, usr_id=67)
--   18: Angelina Chua     — TLE         (teacher17@school.edu, usr_id=68)
--   19: Domingo Reyes     — Values      (teacher18@school.edu, usr_id=69)
--   20: Rosita Santos     — CompSci     (teacher19@school.edu, usr_id=70)
--   21: Nestor Cruz       — Research    (teacher20@school.edu, usr_id=71)
--
-- Each subject now has 2 teachers (original + new) for peer evaluation testing
--
-- Verification queries:
-- SELECT COUNT(*) AS total_users FROM users;                 → 71
-- SELECT COUNT(*) AS total_teachers FROM teachers;           → 21
-- SELECT COUNT(*) AS total_assignments FROM student_teacher; → 377
