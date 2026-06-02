-- Junior high: students in grades 7–10 see all JHS-flagged teachers.
-- Run once on existing databases (after migration_elementary.sql).

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS is_jhs BOOLEAN NOT NULL DEFAULT false;
