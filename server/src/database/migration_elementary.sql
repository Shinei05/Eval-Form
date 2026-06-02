-- Elementary evaluation mode + large learner IDs
-- Run once on existing databases before applying the updated seed.
-- Also run migration_jhs.sql if using the combined elementary + JHS seed.

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS is_elementary BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE students
  ALTER COLUMN stud_id TYPE BIGINT;
