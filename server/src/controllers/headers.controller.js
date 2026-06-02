import pool from "../config/supabase.js";

//  Add student header 
export async function addStudentHeader(req, res) {
try {
const { header, identifier } = req.body;

await pool.query(
"INSERT INTO headers (header, identifier) VALUES ($1, $2)",
[header, identifier]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Add teacher header 
export async function addTeacherHeader(req, res) {
try {
const { header, identifier } = req.body;

await pool.query(
"INSERT INTO header_t (header, identifier) VALUES ($1, $2)",
[header, identifier]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Update student header text 
export async function updateStudentHeader(req, res) {
try {
const { id, newHeader } = req.body;

await pool.query(
"UPDATE headers SET header = $1 WHERE id = $2",
[newHeader, id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Update teacher header text 
export async function updateTeacherHeader(req, res) {
try {
const { id, newHeader } = req.body;

await pool.query(
"UPDATE header_t SET header = $1 WHERE id = $2",
[newHeader, id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Soft-delete student header 
export async function deleteStudentHeader(req, res) {
try {
const { header_id } = req.body;

await pool.query(
"UPDATE headers SET is_deleted = true WHERE id = $1",
[header_id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

//  Soft-delete teacher header 
export async function deleteTeacherHeader(req, res) {
try {
const { header_id } = req.body;

await pool.query(
"UPDATE header_t SET is_deleted = true WHERE id = $1",
[header_id]
);

return res.json({ success: true });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}
