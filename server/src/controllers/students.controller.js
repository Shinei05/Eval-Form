import pool from "../config/supabase.js";

//  Get student by ID 
export async function getStudentById(req, res) {
try {
const id = Number(req.body.id || req.body.evt);

const { rows } = await pool.query(
"SELECT id, firstname, lastname, stud_id, grade, section, teacher FROM students WHERE id = $1 LIMIT 1",
[id]
);
const student = rows[0];

if (!student) {
return res
.status(400)
.json({ success: false, message: "Student not found" });
}

// Get teacher info
let teacherData = null;
if (student.teacher) {
const { rows: tRows } = await pool.query(
"SELECT id, firstname, lastname FROM teachers WHERE id = $1 LIMIT 1",
[student.teacher]
);
teacherData = tRows[0] || null;
}

const now = new Date();
const month = now.toLocaleString("en-US", { month: "long" });

return res.json({
success: true,
student: {
firstname: student.firstname,
lastname: student.lastname,
stid: student.stud_id,
firstnm: student.firstname,
lastnm: student.lastname,
studid: student.stud_id,
grade: student.grade,
section: student.section,
teacher: teacherData
? `${teacherData.firstname} ${teacherData.lastname}`
: null,
},
month,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

// Get total student count
export async function getStudentCount(req, res) {
try {
const { rows } = await pool.query("SELECT COUNT(*) as count FROM students");
return res.json({ success: true, count: parseInt(rows[0].count) });
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}
//  Get evaluator (teacher) by user ID 
export async function getEvaluatorById(req, res) {
try {
const id = Number(req.body.id || req.body.evt);

const { rows } = await pool.query(
"SELECT id, firstname, lastname FROM teachers WHERE usr_id = $1 LIMIT 1",
[id]
);
const teacher = rows[0];

if (!teacher) {
return res
.status(400)
.json({ success: false, message: "Teacher not found" });
}

const now = new Date();
const month = now.toLocaleString("en-US", { month: "long" });

return res.json({
success: true,
teacher: {
id: teacher.id,
firstname: teacher.firstname,
lastname: teacher.lastname,
firstnm: teacher.firstname,
lastnm: teacher.lastname,
},
student: {
id: teacher.id,
firstname: teacher.firstname,
lastname: teacher.lastname,
firstnm: teacher.firstname,
lastnm: teacher.lastname,
},
month,
});
} catch (err) {
return res
.status(500)
.json({ success: false, error: "Internal server error" });
}
}

