import pool from "../config/supabase.js";

//  Get student questions (active only) 
export async function getStudentQuestions(req, res) {
try {
const { rows: headers } = await pool.query(
"SELECT id, header, identifier FROM headers WHERE is_deleted = false ORDER BY id ASC"
);

if (!headers || headers.length === 0) {
return res.status(400).json({ success: false });
}

const headerIds = headers.map((h) => h.id);
const identifiers = headers.map((h) => h.identifier);

const { rows: questions } = await pool.query(
"SELECT id, questions, header_id, header_version FROM questions WHERE header_id = ANY($1::int[]) AND header_version = ANY($2::text[]) AND is_deleted = false",
[headerIds, identifiers]
);

let questionCount = 0;
const allHeaders = headers.map((h) => ({
header_id: h.id,
header: h.header,
questions: [],
}));

for (const q of questions) {
const target = allHeaders.find((h) => h.header_id === q.header_id);
if (target) {
target.questions.push({
question_id: q.id,
question: q.questions,
});
questionCount++;
}
}

return res.json({
count: questionCount,
header_ver: identifiers[0],
success: true,
headers: allHeaders,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Get ALL student questions for admin (non-deleted headers, all questions regardless of version) 
export async function getStudentQuestionsAll(req, res) {
try {
// Only fetch non-deleted headers so admin sees active sections
const { rows: headers } = await pool.query(
"SELECT id, header, identifier FROM headers WHERE is_deleted = false ORDER BY id ASC"
);

if (!headers || headers.length === 0) {
return res.status(400).json({ success: false });
}

const headerIds = headers.map((h) => h.id);
const identifiers = headers.map((h) => h.identifier);

// Fetch ALL non-deleted questions for these headers, regardless of header_version,
// so the admin view matches exactly what is stored in the database.
const { rows: questions } = await pool.query(
"SELECT id, questions, header_id, header_version FROM questions WHERE header_id = ANY($1::int[]) AND is_deleted = false",
[headerIds]
);

let questionCount = 0;
const allHeaders = headers.map((h) => ({
header_id: h.id,
header: h.header,
questions: [],
}));

for (const q of questions) {
const target = allHeaders.find((h) => h.header_id === q.header_id);
if (target) {
target.questions.push({
question_id: q.id,
question: q.questions,
});
questionCount++;
}
}

return res.json({
count: questionCount,
header_ver: identifiers[0],
success: true,
headers: allHeaders,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Get teacher questions (active only) 
export async function getTeacherQuestions(req, res) {
try {
const { rows: headers } = await pool.query(
"SELECT id, header FROM header_t WHERE is_deleted = false ORDER BY id ASC"
);

if (!headers || headers.length === 0) {
return res
.status(500)
.json({ success: false, message: "no headers fetched" });
}

const headerIds = headers.map((h) => h.id);

const { rows: questions } = await pool.query(
"SELECT id, questions, header_id FROM question_t WHERE header_id = ANY($1::int[])",
[headerIds]
);

let questionCount = 0;
const allHeaders = headers.map((h) => ({
header_id: h.id,
header: h.header,
questions: [],
}));

for (const q of questions) {
const target = allHeaders.find((h) => h.header_id === q.header_id);
if (target) {
target.questions.push({
question_id: q.id,
question: q.questions,
});
questionCount++;
}
}

// Build header_ver from header_t identifiers
const { rows: identifierRows } = await pool.query(
"SELECT identifier FROM header_t WHERE identifier IS NOT NULL LIMIT 1"
);
const headerVer = identifierRows[0]?.identifier || null;

return res.json({
count: questionCount,
success: true,
headers: allHeaders,
header_ver: headerVer,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Get ALL teacher questions for admin (non-deleted headers only) 
export async function getTeacherQuestionsAll(req, res) {
try {
// Only fetch non-deleted headers so admin sees active sections
const { rows: headers } = await pool.query(
"SELECT id, header FROM header_t WHERE is_deleted = false ORDER BY id ASC"
);

if (!headers || headers.length === 0) {
return res
.status(500)
.json({ success: false, message: "no headers fetched" });
}

const headerIds = headers.map((h) => h.id);

// Fetch ALL questions for these headers (teacher questions have no is_deleted column)
const { rows: questions } = await pool.query(
"SELECT id, questions, header_id FROM question_t WHERE header_id = ANY($1::int[])",
[headerIds]
);

let questionCount = 0;
const allHeaders = headers.map((h) => ({
header_id: h.id,
header: h.header,
questions: [],
}));

for (const q of questions) {
const target = allHeaders.find((h) => h.header_id === q.header_id);
if (target) {
target.questions.push({
question_id: q.id,
question: q.questions,
});
questionCount++;
}
}

return res.json({
count: questionCount,
success: true,
headers: allHeaders,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Update student question text 
export async function updateStudentQuestion(req, res) {
try {
const { id, question } = req.body;

await pool.query(
"UPDATE questions SET questions = $1 WHERE id = $2",
[question, id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Update teacher question text 
export async function updateTeacherQuestion(req, res) {
try {
const { id, question } = req.body;

await pool.query(
"UPDATE question_t SET questions = $1 WHERE id = $2",
[question, id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Delete student question 
export async function deleteStudentQuestion(req, res) {
try {
const { id } = req.body;

await pool.query("DELETE FROM questions WHERE id = $1", [id]);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Delete teacher question 
export async function deleteTeacherQuestion(req, res) {
try {
const { id } = req.body;

await pool.query("DELETE FROM question_t WHERE id = $1", [id]);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Add student question 
export async function addStudentQuestion(req, res) {
try {
const { id: headerId, question, identifier } = req.body;

await pool.query(
"INSERT INTO questions (questions, header_id, header_version) VALUES ($1, $2, $3)",
[question, headerId, identifier]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Add teacher question 
export async function addTeacherQuestion(req, res) {
try {
const { id: headerId, question, identifier } = req.body;

await pool.query(
"INSERT INTO question_t (questions, header_id, header_version) VALUES ($1, $2, $3)",
[question, headerId, identifier]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}
