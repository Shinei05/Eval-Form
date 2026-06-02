-- ============================================================
-- Add two administrator accounts (DepEd emails).
-- Default password matches seed: password123
--   (bcrypt hash below — change if you use a different password)
-- ============================================================

BEGIN;

INSERT INTO users (email, password, reset, verify_code, is_teacher, is_admin, is_verified)
VALUES
  (
    'willy.antigo@deped.gov.ph',
    '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m',
    'RSTADM4397',
    'VRFADM4397',
    true,
    true,
    true
  ),
  (
    'joey.manes@deped.gov.ph',
    '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m',
    'RSTADM5434',
    'VRFADM5434',
    true,
    true,
    true
  )
ON CONFLICT (email) DO NOTHING;

-- loginAdmin requires a teachers row linked by usr_id (firstname/lastname shown in admin UI)
INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id, is_elementary, is_jhs)
SELECT 'Willy', 'Antigo', NULL, 3, 2025, 'ADM4164397', u.id, false, false
FROM users u
WHERE u.email = 'willy.antigo@deped.gov.ph'
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.usr_id = u.id);

INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id, is_elementary, is_jhs)
SELECT 'Joey', 'Manes', NULL, 3, 2025, 'ADM5415434', u.id, false, false
FROM users u
WHERE u.email = 'joey.manes@deped.gov.ph'
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.usr_id = u.id);

SELECT setval('teachers_id_seq', COALESCE((SELECT MAX(id) FROM teachers), 1));

COMMIT;
