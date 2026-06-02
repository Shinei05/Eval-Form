-- ============================================================
-- ProjectEVAL – Seed Evaluation Content
-- Source: STUDENT & PEER EVALUATION 2025 copy for yen.docx
-- 
-- ⚠ WARNING: This clears existing headers & questions.
--   Evaluation answers that reference deleted questions
--   will also be removed (CASCADE). Run only on dev/fresh DB.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Clean slate
-- ────────────────────────────────────────────────────────────
TRUNCATE questions, headers RESTART IDENTITY CASCADE;
TRUNCATE question_t, header_t RESTART IDENTITY CASCADE;


-- ============================================================
-- 2. STUDENT EVALUATION (Filipino)
--    Rating scale: 5 (Very Evident) / 3 (Sometimes Evident) / 1 (Not Evident)
-- ============================================================

-- ── Headers ─────────────────────────────────────────────────
INSERT INTO headers (header, identifier) VALUES
  ('Expertise of Content / Kadalubhasaan sa Nilalaman ng Aralin', 'v2025'),
  ('Instructional Skillfulness / Kahusayan sa Pagtuturo ng Aralin', 'v2025'),
  ('Teaching for Independent Learning / Pagtuturo ng Malayang Pagkatuto ng Aralin', 'v2025'),
  ('Administration of Learning / Pamamahala sa Pagtuturo ng Aralin', 'v2025'),
  ('Flexibility in Learning Modality / Kakayahang Umangkop sa Iba''t ibang Modalidad sa Pagtuturo at Pagkatuto', 'v2025'),
  ('Classroom Management / Pamamahala ng Silid-aralan', 'v2025');

-- ── Questions ───────────────────────────────────────────────

-- Category 1: Expertise of Content (header_id = 1)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Malinaw na natatalakay ng guro ang bawat aralin.', 1, 'v2025'),
  ('Maayos na natatalakay ng guro ang aralin.', 1, 'v2025'),
  ('Nakapagbibigay ang guro ng angkop at tiyak na halimbawa sa aralin.', 1, 'v2025'),
  ('Angkop na naiuugnay ng guro ang mga aralin sa makatotohanang pang-araw-araw na buhay.', 1, 'v2025'),
  ('Maayos na naipapabatid ng guro ang mga makabagong kaalaman.', 1, 'v2025');

-- Category 2: Instructional Skillfulness (header_id = 2)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Gumagamit ang guro ng mga iba''t ibang estratehiya, metodolohiya o pamamaraan ng pagtuturo.', 2, 'v2025'),
  ('Nagagamit ng guro ang iba''t ibang estratehiya, metodolohiya o pamamaraan ng pagtuturo upang ang aralin ay maging interesante.', 2, 'v2025'),
  ('Nagbibigay ang guro ng mga mabibisang katanungan upang maging kritikal at masining ang pag-iisip.', 2, 'v2025'),
  ('Nagagabayan ng guro ang kanyang mga mag-aaral sa matugunan ang ilang mahihirap na katanungan.', 2, 'v2025'),
  ('Nabibigyang-diin ng guro ang mahahalagang punto ng aralin.', 2, 'v2025'),
  ('Kaangkupan ay kahusayan sa paggamit ng mga makabagong teknolohiya.', 2, 'v2025');

-- Category 3: Teaching for Independent Learning (header_id = 3)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Gumagamit ang guro ng mga iba''t ibang estratehiya, metodolohiya o pamamaraan na nagpapakita ng pagkaunawa ng mga mag-aaral sa bawat aralin.', 3, 'v2025'),
  ('Napagyayaman ng guro ang pagpapahalaga sa sarili ng kanyang mga mag-aaral.', 3, 'v2025'),
  ('Hinihikayat ang mga mag-aaral na malayang mag-isip at bumuo ng sariling desisyon.', 3, 'v2025'),
  ('Hinihikayat ang mga mag-aaral na magsaliksik at matuto.', 3, 'v2025'),
  ('Hinihikayat ang mga mag-aaral na gamitin ang kani-kanilang angkop na kasanayan (multiple intelligences).', 3, 'v2025');

-- Category 4: Administration of Learning (header_id = 4)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Binibigyan ng pagkakataon ng guro ang lahat ng kanyang mga mag-aaral na makiisa at magbahagi sa mga gawaing pansilid.', 4, 'v2025'),
  ('Bumubuo at ipinatutupad ng guro ang kundisyon at karanasan sa pagkatuto.', 4, 'v2025'),
  ('Lumilikha ang guro ng isang kontekstong pagtuturo-pagkatuto.', 4, 'v2025'),
  ('Gumagamit ang guro ng tradisyunal at makabagong mga kagamitang pampagtuturo.', 4, 'v2025'),
  ('Maayos at mabisang nagagamit ng guro ang kaniyang mga kagamitang pampagtuturo.', 4, 'v2025');

-- Category 5: Flexibility in Learning Modality (header_id = 5)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Maayos at mabisang nagagamit ng guro ang iba''t ibang modalidad sa pagtuturo.', 5, 'v2025'),
  ('May sapat na kaalaman ang guro sa paggamit ng iba''t ibang aplikasyon.', 5, 'v2025'),
  ('Malinaw at tiyak na naipaliliwanag ng guro sa mga mag-aaral ang kahalagahan ng paggamit ng iba''t ibang modalidad.', 5, 'v2025'),
  ('Malinaw at tiyak na naipaliliwanag ng guro ang angkop na paggamit ng iba''t ibang aplikasyon.', 5, 'v2025');

-- Category 6: Classroom Management (header_id = 6)
INSERT INTO questions (questions, header_id, header_version) VALUES
  ('Dumarating at umaalis ang guro sa silid-aralan ayon sa itinakdang oras.', 6, 'v2025'),
  ('Inihahanda ng guro ang buong silid-aralan bago magsimula ang klase.', 6, 'v2025'),
  ('Nagtatala ng liban ang guro sa pagsisimula ng kaniyang klase.', 6, 'v2025'),
  ('Pinapanatili ng guro ang kalinisan ng silid-aralan sa buong oras ng klase.', 6, 'v2025'),
  ('Maayos at pantay na pinakitutunguhan ng guro ang kanyang mga mag-aaral.', 6, 'v2025'),
  ('Nagtatakda ang guro ng isang kapaligirang positibo, matiwasay at mapagkalingang ugnayan sa bawat isa.', 6, 'v2025'),
  ('Ibinabalik ng guro sa mga mag-aaral ang kanilang mga gawain, proyekto, kwaderno, mga iwinastong pagsusulit atbp.', 6, 'v2025'),
  ('Mabisang nakikipag-ugnayan ang guro sa kaniyang mga mag-aaral at mga magulang nito.', 6, 'v2025'),
  ('Naibabahagi ng guro ang mga mahahalagang impormasyong kinakailangan.', 6, 'v2025'),
  ('Naglalaan ang guro ng panahon upang kumustahin ang kalagayan ng kaniyang mga mag-aaral sa bawat araw.', 6, 'v2025');


-- ============================================================
-- 3. TEACHER PEER EVALUATION (English)
--    Rating scale: 5 (Outstanding) / 4 (Very Satisfactory) / 3 (Satisfactory) / 2 (Unsatisfactory) / 1 (Poor)
-- ============================================================

-- ── Headers ─────────────────────────────────────────────────
INSERT INTO header_t (header, identifier) VALUES
  ('Punctuality and Attendance', 'v2025'),
  ('Ethical Conduct', 'v2025'),
  ('Collaboration with Colleagues', 'v2025'),
  ('Commitment to Continuous Learning', 'v2025'),
  ('Leadership in School Initiatives', 'v2025');

-- ── Questions ───────────────────────────────────────────────

-- Category 1: Punctuality and Attendance (header_id = 1)
INSERT INTO question_t (questions, header_id, header_version) VALUES
  ('Timeliness in Reporting to Work and Classes — Consistently arrives on time for classes, meetings, and other professional commitments.', 1, 'v2025'),
  ('Class Attendance and Availability — Regularly attends scheduled classes and office hours, minimizing unplanned absences.', 1, 'v2025'),
  ('Adherence to Institutional Schedules — Follows the academic calendar, submits required documents on time, and meets deadlines for grading and reports.', 1, 'v2025'),
  ('Proper Communication of Absences — Notifies the administration and students in advance when absences are unavoidable and arranges for appropriate class coverage or make-up sessions.', 1, 'v2025'),
  ('Commitment to Professional Responsibilities — Demonstrates reliability in attending faculty meetings, training sessions, and other institutional activities.', 1, 'v2025');

-- Category 2: Ethical Conduct (header_id = 2)
INSERT INTO question_t (questions, header_id, header_version) VALUES
  ('Respect and Fairness — Treats students, colleagues, and parents with respect, fairness, and impartiality, regardless of background or personal differences.', 2, 'v2025'),
  ('Confidentiality and Integrity — Maintains confidentiality in handling student records and sensitive information, ensuring trust and ethical responsibility.', 2, 'v2025'),
  ('Professionalism in Communication — Demonstrates professionalism in verbal and written communication, using appropriate language and tone in interactions with students, colleagues, and parents.', 2, 'v2025'),
  ('Adherence to School Policies — Complies with institutional policies, ethical guidelines, and professional standards in decision-making and classroom management.', 2, 'v2025'),
  ('Role Modeling Ethical Behavior — Serves as a positive role model by upholding honesty, accountability, and ethical behavior in academic and professional settings.', 2, 'v2025');

-- Category 3: Collaboration with Colleagues (header_id = 3)
INSERT INTO question_t (questions, header_id, header_version) VALUES
  ('Teamwork and Cooperation — Actively participates in team meetings, department activities, and school initiatives with a positive and cooperative attitude.', 3, 'v2025'),
  ('Respect for Colleagues'' Ideas — Listens to and values the perspectives and contributions of fellow teachers, fostering a culture of mutual respect.', 3, 'v2025'),
  ('Willingness to Share Resources — Freely shares instructional materials, lesson plans, and best practices with colleagues to enhance overall teaching effectiveness.', 3, 'v2025'),
  ('Constructive Communication — Engages in open and professional communication with colleagues, addressing concerns or feedback respectfully.', 3, 'v2025'),
  ('Support and Encouragement — Provides encouragement, mentorship, or assistance to colleagues when needed, especially to new or struggling teachers.', 3, 'v2025'),
  ('Collaboration on Student Success — Works with other teachers to develop strategies for supporting student learning, including cross-disciplinary projects and interventions.', 3, 'v2025'),
  ('Participation in Professional Development — Actively engages in professional learning communities, workshops, or training sessions to improve teaching practices collectively.', 3, 'v2025'),
  ('Conflict Resolution Skills — Handles disagreements or differing viewpoints professionally and seeks solutions that benefit the team and students.', 3, 'v2025'),
  ('Flexibility and Adaptability — Willingly adjusts to changes, such as schedule modifications, new policies, or teaching strategies, while working harmoniously with colleagues.', 3, 'v2025'),
  ('Contribution to School Culture — Demonstrates a commitment to fostering a positive, collaborative, and inclusive school environment by being approachable and supportive.', 3, 'v2025');

-- Category 4: Commitment to Continuous Learning (header_id = 4)
INSERT INTO question_t (questions, header_id, header_version) VALUES
  ('Engagement in Professional Development — Actively participates in seminars, workshops, conferences, or other training opportunities related to teaching and research.', 4, 'v2025'),
  ('Willingness to Receive and Implement Feedback — Accepts constructive criticism and makes necessary improvements based on feedback from peers, students, and supervisors.', 4, 'v2025'),
  ('Collaboration with Colleagues — Actively engages in professional discussions, team teaching, and knowledge-sharing initiatives with fellow educators.', 4, 'v2025'),
  ('Participation in Institutional and Community Learning Initiatives — Takes part in faculty learning communities, curriculum development, or community-based education programs.', 4, 'v2025'),
  ('Mentoring and Coaching — Supports the professional growth of colleagues and students by sharing expertise, guiding co-faculty, or mentoring students in research and career development.', 4, 'v2025');

-- Category 5: Leadership in School Initiatives (header_id = 5)
INSERT INTO question_t (questions, header_id, header_version) VALUES
  ('Active Participation in School Programs — Demonstrates commitment by actively engaging in and supporting school-wide initiatives and programs.', 5, 'v2025'),
  ('Initiative and Innovation — Proactively proposes and implements new ideas, strategies, or projects that contribute to school improvement.', 5, 'v2025'),
  ('Mentorship and Support — Provides guidance and support to fellow faculty members, particularly in implementing new initiatives or improving teaching practices.', 5, 'v2025'),
  ('Influence and Motivation — Inspires and motivates colleagues and students to actively participate in school initiatives and work towards common goals.', 5, 'v2025'),
  ('Commitment to Professional Development — Seeks opportunities for continuous learning and shares knowledge or best practices with peers.', 5, 'v2025'),
  ('Decision-Making and Problem-Solving — Demonstrates sound judgment and critical thinking in addressing challenges related to school initiatives.', 5, 'v2025'),
  ('Communication and Advocacy — Effectively communicates the goals and importance of school initiatives to stakeholders (students, faculty, parents, and administrators).', 5, 'v2025'),
  ('Implementation and Follow-Through — Ensures that school initiatives are effectively executed and sustained over time, making necessary adjustments when needed.', 5, 'v2025'),
  ('Impact on School Community — Contributes to meaningful changes or improvements in the school environment through leadership in various initiatives.', 5, 'v2025');

COMMIT;

-- ============================================================
-- Verification queries (run these to confirm):
-- ============================================================
-- SELECT h.id, h.header, COUNT(q.id) AS q_count
--   FROM headers h LEFT JOIN questions q ON q.header_id = h.id
--  GROUP BY h.id ORDER BY h.id;
--
-- SELECT h.id, h.header, COUNT(q.id) AS q_count
--   FROM header_t h LEFT JOIN question_t q ON q.header_id = h.id
--  GROUP BY h.id ORDER BY h.id;
