-- ============================================================
-- ProjectEVAL – Elementary + JHS students, teachers & admin
--
-- 35 student users + 50 teacher users + 1 admin = 86 users
-- All passwords: password123
--
-- Does NOT truncate headers, questions, header_t, question_t.
-- ⚠ WARNING: Clears users, students, teachers, subjects, evaluations.
-- Run migration_elementary.sql then migration_jhs.sql before this seed.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Clean slate (preserves evaluation question tables)
-- ────────────────────────────────────────────────────────────
TRUNCATE evaluation_answer RESTART IDENTITY CASCADE;
TRUNCATE evaluation RESTART IDENTITY CASCADE;
TRUNCATE evaluation_ans_p RESTART IDENTITY CASCADE;
TRUNCATE evaluation_p RESTART IDENTITY CASCADE;
TRUNCATE student_teacher RESTART IDENTITY CASCADE;
TRUNCATE students RESTART IDENTITY CASCADE;
TRUNCATE teachers RESTART IDENTITY CASCADE;
TRUNCATE users RESTART IDENTITY CASCADE;
TRUNCATE subjects RESTART IDENTITY CASCADE;


-- ────────────────────────────────────────────────────────────
-- 2. Subjects (IDs referenced by teachers.subject)
-- ────────────────────────────────────────────────────────────
INSERT INTO subjects (id, subjects) VALUES
  (1,  'Filipino'),
  (2,  'English'),
  (3,  'Mathematics'),
  (4,  'Science'),
  (5,  'Araling Panlipunan'),
  (6,  'MAPEH'),
  (7,  'TLE'),
  (8,  'Values Education'),
  (9,  'Computer Science'),
  (10, 'Research'),
  (11, 'Generalist'),
  (12, 'ECE'),
  (13, 'AP & EPP'),
  (14, 'Social Studies'),
  (15, 'Science and ESP'),
  (16, 'ESP & AP'),
  (17, 'AP9 & TLE');

SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));


-- ────────────────────────────────────────────────────────────
-- 3. Users
--    1–15   elementary students
--    16–35  JHS students
--    36–62  elementary teachers
--    63–85  JHS teachers
--    86     admin
-- ────────────────────────────────────────────────────────────
INSERT INTO users (email, password, reset, verify_code, is_teacher, is_admin, is_verified) VALUES
  ('Miviouslythedev@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000001', 'VRF0000001', false, false, true),
  ('christinedecastro@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000002', 'VRF0000002', false, false, true),
  ('corralchristianyurie@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000003', 'VRF0000003', false, false, true),
  ('leianne111215@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000004', 'VRF0000004', false, false, true),
  ('krisgiopadama9@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000005', 'VRF0000005', false, false, true),
  ('casianaarpilleda@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000006', 'VRF0000006', false, false, true),
  ('riversrileyzander@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000007', 'VRF0000007', false, false, true),
  ('llanfairpwll1gogery@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000008', 'VRF0000008', false, false, true),
  ('amanoaldred11@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000009', 'VRF0000009', false, false, true),
  ('keannejoya@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000010', 'VRF0000010', false, false, true),
  ('rebelynadriatico@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000011', 'VRF0000011', false, false, true),
  ('youlah09@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000012', 'VRF0000012', false, false, true),
  ('hersheygordon72@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000013', 'VRF0000013', false, false, true),
  ('juliaysabelmagpuri@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000014', 'VRF0000014', false, false, true),
  ('panaliganhailey10@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000015', 'VRF0000015', false, false, true),

  ('reguerra.juliachristy@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000016', 'VRF0000016', false, false, true),
  ('czarina.abueg10@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000017', 'VRF0000017', false, false, true),
  ('zertur009@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000018', 'VRF0000018', false, false, true),
  ('kerkzaimondbarrameda24@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000019', 'VRF0000019', false, false, true),
  ('denmarcoribello2@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000020', 'VRF0000020', false, false, true),
  ('JoyceNamuco@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000021', 'VRF0000021', false, false, true),
  ('Ronedelexala07@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000022', 'VRF0000022', false, false, true),
  ('archienoscet@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000023', 'VRF0000023', false, false, true),
  ('mariovillarinjr54@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000024', 'VRF0000024', false, false, true),
  ('princess.nicol3e@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000025', 'VRF0000025', false, false, true),
  ('princearbnly@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000026', 'VRF0000026', false, false, true),
  ('empenruegas@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000027', 'VRF0000027', false, false, true),
  ('queinanyanga@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000028', 'VRF0000028', false, false, true),
  ('jesminequinto@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000029', 'VRF0000029', false, false, true),
  ('n3rfgun17@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000030', 'VRF0000030', false, false, true),
  ('labangmichael@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000031', 'VRF0000031', false, false, true),
  ('Roelguevarra712@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000032', 'VRF0000032', false, false, true),
  ('annchrish8@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000033', 'VRF0000033', false, false, true),
  ('kielblanco1206@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000034', 'VRF0000034', false, false, true),
  ('justinsabandal305@gmail.com', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000035', 'VRF0000035', false, false, true),

  ('gierly.cruz@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000036', 'VRF0000036', true, false, true),
  ('zephaniapeter.espanola@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000037', 'VRF0000037', true, false, true),
  ('marjurie.salban@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000038', 'VRF0000038', true, false, true),
  ('riamae.calayag@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000039', 'VRF0000039', true, false, true),
  ('roseann.catologan@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000040', 'VRF0000040', true, false, true),
  ('mariacristina.mesiano@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000041', 'VRF0000041', true, false, true),
  ('jazzelann.salaveria@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000042', 'VRF0000042', true, false, true),
  ('marifel.collados@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000043', 'VRF0000043', true, false, true),
  ('philipjeffry.obrien@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000044', 'VRF0000044', true, false, true),
  ('paquito.jimena@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000045', 'VRF0000045', true, false, true),
  ('jaimejr.munoz@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000046', 'VRF0000046', true, false, true),
  ('michelle.calimbas@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000047', 'VRF0000047', true, false, true),
  ('meryl.bustos@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000048', 'VRF0000048', true, false, true),
  ('isabelle.lara@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000049', 'VRF0000049', true, false, true),
  ('jerrylyn.fernandez@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000050', 'VRF0000050', true, false, true),
  ('gloria.baynosa@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000051', 'VRF0000051', true, false, true),
  ('karen.limbag@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000052', 'VRF0000052', true, false, true),
  ('sarahjane.padrique@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000053', 'VRF0000053', true, false, true),
  ('maragrace.inocencio@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000054', 'VRF0000054', true, false, true),
  ('enggelyn.yandoc@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000055', 'VRF0000055', true, false, true),
  ('melanie.fajerga@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000056', 'VRF0000056', true, false, true),
  ('janina.ulanday@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000057', 'VRF0000057', true, false, true),
  ('jeremaejean.delprado@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000058', 'VRF0000058', true, false, true),
  ('elenette.ancheta@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000059', 'VRF0000059', true, false, true),
  ('leslieann.reyes@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000060', 'VRF0000060', true, false, true),
  ('virgie.rubin@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000061', 'VRF0000061', true, false, true),
  ('joycemae.alkuino@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000062', 'VRF0000062', true, false, true),

  ('michael.rivero@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000063', 'VRF0000063', true, false, true),
  ('jasmin.custodio@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000064', 'VRF0000064', true, false, true),
  ('ladydiane.dizon@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000065', 'VRF0000065', true, false, true),
  ('jeremiah.mesiano@deped.com.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000066', 'VRF0000066', true, false, true),
  ('mhelva.montevirgen@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000067', 'VRF0000067', true, false, true),
  ('jomarahjoie.bernardino@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000068', 'VRF0000068', true, false, true),
  ('manuel.oribello@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000069', 'VRF0000069', true, false, true),
  ('sheena.aquisap@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000070', 'VRF0000070', true, false, true),
  ('daylyn.pere@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000071', 'VRF0000071', true, false, true),
  ('emmanuela.ferrer@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000072', 'VRF0000072', true, false, true),
  ('johncarlo.awarayan@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000073', 'VRF0000073', true, false, true),
  ('susana.requillas@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000074', 'VRF0000074', true, false, true),
  ('richmond.sobremonte@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000075', 'VRF0000075', true, false, true),
  ('ariel.gilber@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000076', 'VRF0000076', true, false, true),
  ('kris.paulmino@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000077', 'VRF0000077', true, false, true),
  ('julie.soriano010@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000078', 'VRF0000078', true, false, true),
  ('paulabianca.flauta@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000079', 'VRF0000079', true, false, true),
  ('roldan.liam@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000080', 'VRF0000080', true, false, true),
  ('sherwin.lapena@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000081', 'VRF0000081', true, false, true),
  ('reynaldo.labandelo@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000082', 'VRF0000082', true, false, true),
  ('emerald.mabini@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000083', 'VRF0000083', true, false, true),
  ('bernadette.antolin@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000084', 'VRF0000084', true, false, true),
  ('reuwell.delacruz@deped.gov.ph', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000085', 'VRF0000085', true, false, true),

  ('admin@school.edu', '$2a$10$nEi/ojVzkxWLBX4niiTAlev5q6K1UHX5adMrBLvEpqdpv3GwS0b0m', 'RST0000086', 'VRF0000086', true, true, true);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));


-- ────────────────────────────────────────────────────────────
-- 4. Students
-- ────────────────────────────────────────────────────────────
INSERT INTO students (firstname, lastname, stud_id, usr_id, grade, section, points) VALUES
  ('Cenjo', 'Abueg', 500027210066, 1, '4', 'Faithful', 0),
  ('Christine Eid', 'De Castro', 500027210095, 2, '4', 'Faithful', 0),
  ('Christian Yurie', 'Corral', 500027210041, 3, '4', '4-Optimistic', 0),
  ('Leianne', 'Quioyo', 500027210103, 4, '4', '4-Resilient', 0),
  ('Kris Gio', 'Padama', 500027210090, 5, '4', '4-Resilient', 0),
  ('Zham', 'Arpilleda', 500027190041, 6, '5', '5-Diligent', 0),
  ('Riley Zander', 'Rivers', 500027200002, 7, '5', '5-Diligent', 0),
  ('Alexander Job F', 'Aratea', 107124200349, 8, '5', '5-Generous', 0),
  ('Aldred S.', 'Amano', 500027200014, 9, '5', '5-Trustworthy', 0),
  ('Keanne Joy T.', 'Aquisap', 500027200099, 10, '5', '5-Trustworthy', 0),
  ('Rebelyn Jane', 'Adriatico', 500027190039, 11, '6', '6-courteous', 0),
  ('Regielen jo', 'Tiania', 500027190060, 12, '6', '6-courteous', 0),
  ('Hershey', 'Gordon', 500027190020, 13, '6', '6-Gratitude', 0),
  ('Julia Ysabel', 'Magpuri', 500027190047, 14, '6', '6-Gratitude', 0),
  ('Hailey Khenrie', 'Panaligan', 500027190024, 15, '6', '6-Gratitude', 0),

  ('Julia Christy S.', 'Reguerra', 107014160148, 16, '10', '10 - Mapagkalinga', 0),
  ('Czarina Jane B.', 'Abueg', 107134150008, 17, '10', '10 - Mapagkalinga', 0),
  ('Wayne Pierre', 'Mendoza', 104621150084, 18, '10', '10 Masayahin', 0),
  ('Kerk Zaimond', 'Barrameda', 424588150017, 19, '10', '10-Maalaga', 0),
  ('Denmarc', 'Oribello', 107134150059, 20, '10', '10-Mapagmahal', 0),
  ('Joyce Lorraine', 'Namuco', 500027180109, 21, '7', '7-Magalang', 0),
  ('Juliana', 'Exala', 106959180010, 22, '7', '7-Masigasig', 0),
  ('Archie', 'Tecson', 500027180088, 23, '7', '7-Masipag', 0),
  ('Mario Jr', 'Villarin', 500027180054, 24, '7', '7-Maunawain', 0),
  ('Princess Rhiana Nicole', 'Torres', 500027180095, 25, '7', '7-Maunawain', 0),
  ('Prince Alex', 'Rubin', 401386160026, 26, '9', '9-Makadiyos', 0),
  ('April Shane', 'Ruegas', 500134160088, 27, '9', '9-Makadiyos', 0),
  ('Prince Queinan', 'Canlas', 107022150071, 28, '9', '9-Makakalikasan', 0),
  ('Jesmine Eunice', 'Quinto', 422011160005, 29, '9', '9-Makakalikasan', 0),
  ('Nygel', 'Castillo', 500027160060, 30, '9', '9-Makatao', 0),
  ('Michael Jacob', 'Labang', 107120170048, 31, '8', '8-Matulungin', 0),
  ('Roel Jr.', 'Guvarra', 136606170025, 32, '8', '8-Maaasahan', 0),
  ('Chrisha Ann', 'Ramos', 107131170058, 33, '8', '8-Maaasahan', 0),
  ('Kiel Andrey', 'Blanco', 401375170017, 34, '8', '8-Mapagkakatiwalaan', 0),
  ('Justin Myle', 'Sabandal', 107131170046, 35, '8', '8-Matulungin', 0);


-- ────────────────────────────────────────────────────────────
-- 5. Teachers (elementary: usr 36–62; admin: 86; JHS: usr 63–85)
-- ────────────────────────────────────────────────────────────
INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id, is_elementary, is_jhs) VALUES
  ('Gierly', 'Dela Cruz', 11, 3, 2025, 'TCR5381552', 36, true, false),
  ('Zephania Peter', 'Española', 6, 3, 2025, 'TCR5427763', 37, true, false),
  ('Marjurie', 'Salban', 11, 3, 2025, 'TCR5392051', 38, true, false),
  ('Ria Mae', 'Calayag', 12, 3, 2025, 'TCR5381537', 39, true, false),
  ('Rose Ann', 'Agang', 11, 3, 2025, 'TCR5392040', 40, true, false),
  ('Maria Cristina', 'Ronquillo', 11, 3, 2025, 'TCR5381521', 41, true, false),
  ('Jazzel Ann', 'Salaveria', 11, 3, 2025, 'TCR5427748', 42, true, false),
  ('Marifel', 'Santos', 6, 3, 2025, 'TCR5392189', 43, true, false),
  ('Philip Jeffry', 'O''Brien', 5, 3, 2025, 'TCR5400559', 44, true, false),
  ('Paquito', 'Jimena', 3, 3, 2025, 'TCR4164185', 45, true, false),
  ('Jaime', 'Muñoz', 6, 3, 2025, 'TCR4130657', 46, true, false),
  ('Michelle', 'Calimbas', 13, 3, 2025, 'TCR4165333', 47, true, false),
  ('Meryl', 'Bustos', 11, 3, 2025, 'TCR5403607', 48, true, false),
  ('Isabella Anne', 'Lara', 2, 3, 2025, 'TCR5385097', 49, true, false),
  ('Jerrylyn', 'Fernandez', 11, 3, 2025, 'TCR5420107', 50, true, false),
  ('Gloria', 'Baynosa', 2, 3, 2025, 'TCR4164559', 51, true, false),
  ('Karen', 'Limbag', 11, 3, 2025, 'TCR5392043', 52, true, false),
  ('Sarah Jane', 'Camacho', 11, 3, 2025, 'TCR5385012', 53, true, false),
  ('Mara Grace', 'Inocencio', 11, 3, 2025, 'TCR5392041', 54, true, false),
  ('Enggelyn', 'Atienza', 11, 3, 2025, 'TCR5392054', 55, true, false),
  ('Melanie', 'Fajerga', 11, 3, 2025, 'TCR4165884', 56, true, false),
  ('Janina', 'Ulanday', 11, 3, 2025, 'TCR5400558', 57, true, false),
  ('Jeremae Jean', 'Del Prado', 11, 3, 2025, 'TCR5392106', 58, true, false),
  ('Elenette', 'Ancheta', 14, 3, 2025, 'TCR5400561', 59, true, false),
  ('Leslie Ann', 'Reyes', 11, 3, 2025, 'TCR4165881', 60, true, false),
  ('Virgie', 'Rubin', 11, 3, 2025, 'TCR4165392', 61, true, false),
  ('Joyce Mae', 'Abitan', 5, 3, 2025, 'TCR5392187', 62, true, false),

  ('Michael', 'Rivero', 6, 3, 2025, 'TCR5392191', 63, false, true),
  ('Jasmin', 'Custodio', 7, 3, 2025, 'TCR4165595', 64, false, true),
  ('Lady Diane', 'Dizon', 4, 3, 2025, 'TCR5400503', 65, false, true),
  ('Jeremiah', 'Mesiano', 7, 3, 2025, 'TCR5420074', 66, false, true),
  ('Mhelva', 'Suansing', 2, 3, 2025, 'TCR5385014', 67, false, true),
  ('Jomarah Joie', 'Bedoria', 3, 3, 2025, 'TCR5400516', 68, false, true),
  ('Manuel', 'Oribello', 5, 3, 2025, 'TCR5400504', 69, false, true),
  ('Sheena', 'Aquisap', 6, 3, 2025, 'TCR5392188', 70, false, true),
  ('Daylyn', 'Pere', 3, 3, 2025, 'TCR5427651', 71, false, true),
  ('Emmanuela Grace', 'Ferrer', 3, 3, 2025, 'TCR5385096', 72, false, true),
  ('John Carlo', 'Awarayan', 4, 3, 2025, 'TCR5427447', 73, false, true),
  ('Susana', 'Requillas', 15, 3, 2025, 'TCR4164567', 74, false, true),
  ('Richmond', 'Sobremonte', 1, 3, 2025, 'TCR5392192', 75, false, true),
  ('Ariel', 'Gilber', 16, 3, 2025, 'TCR5420066', 76, false, true),
  ('Kris', 'Paulmino', 2, 3, 2025, 'TCR5392023', 77, false, true),
  ('Julie', 'Soriano', 7, 3, 2025, 'TCR4164496', 78, false, true),
  ('Paula Bianca', 'Flauta', 7, 3, 2025, 'TCR0000637', 79, false, true),
  ('Roldan', 'Liam', 17, 3, 2025, 'TCR5415440', 80, false, true),
  ('Sherwin', 'Lapeña', 2, 3, 2025, 'TCR4164564', 81, false, true),
  ('Reynaldo', 'Labandelo', 5, 3, 2025, 'TCR5381550', 82, false, true),
  ('Emerald', 'Mabini', 5, 3, 2025, 'TCR4164269', 83, false, true),
  ('Bernadette', 'Antolin', 1, 3, 2025, 'TCR0000505', 84, false, true),
  ('Reuwell', 'Dela Cruz', 6, 3, 2025, 'TCR4164560', 85, false, true),

  ('Kenneth', 'Aquino', NULL, 3, 2025, 'ADM2025001', 86, false, false);

SELECT setval('teachers_id_seq', (SELECT MAX(id) FROM teachers));

COMMIT;

-- ============================================================
-- Quick reference
-- ============================================================
-- All passwords: password123
--
-- Grades 4–6: all teachers with is_elementary = true
-- Grades 7–10: all teachers with is_jhs = true
-- Other grades: student_teacher assignments (none in this seed)
--
-- Verification:
-- SELECT COUNT(*) FROM users;     → 86
-- SELECT COUNT(*) FROM students; → 35
-- SELECT COUNT(*) FROM teachers; → 51
-- SELECT COUNT(*) FROM subjects; → 17
