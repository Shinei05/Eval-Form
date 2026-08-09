import bcrypt from "bcryptjs";
import pool from "../config/supabase.js";
import { getRandomString } from "../utils/helpers.js";

const ELEMENTARY_GRADES = new Set(["4", "5", "6"]);
const JHS_GRADES = new Set(["7", "8", "9", "10"]);

//  List teachers with evaluation status (student view)
export async function listTeachers(req, res) {
	try {
		const studentId = req.body.id;
		const usePaging = Object.prototype.hasOwnProperty.call(req.body, "page");

		if (!usePaging) {
			// Original non-paged behavior (keeps tests working)
			if (!studentId) {
				return res.json({ success: true, teachers: [], total: 0 });
			}

			const { rows: teachers } = await pool.query(
				`SELECT DISTINCT t.id, t.firstname, t.lastname, t.subject, t.quarter, t.year, t.usr_id,
				    u.email, s.subjects AS subject_name, st.section
			     FROM student_teacher st
			     JOIN teachers t ON t.id = st.teacher_id
			     JOIN users u ON u.id = t.usr_id AND u.is_deleted = false AND (u.is_admin IS FALSE OR u.is_admin IS NULL)
			     LEFT JOIN subjects s ON s.id = t.subject
			     WHERE st.student_id = $1`,
				[studentId],
			);

			// Check evaluation status for each teacher
			const { rows: evals } = await pool.query(
				"SELECT tcr_id FROM evaluation WHERE evt_id = $1",
				[studentId],
			);
			const evalSet = new Set(evals.map((e) => e.tcr_id));

			const result = teachers.map((t) => ({
				id: t.id,
				firstname: t.firstname,
				email: t.email || null,
				lastname: t.lastname,
				subject: t.subject_name || null,
				quarter: t.quarter,
				year: t.year,
				evaluated: evalSet.has(t.id) ? "evaluated" : "not evaluated",
			}));

			return res.json({
				success: true,
				teachers: result,
				total: result.length,
			});
		}
		// Paged behavior continues below
		const page = Math.max(1, Number(req.body.page) || 1);
		const perPage = Math.min(100, Math.max(1, Number(req.body.perPage) || 12));
		const offset = (page - 1) * perPage;
		const search = String(req.body.search || "").trim().toLowerCase();
		const subject = String(req.body.subject || "").trim();
		const sortBy = String(req.body.sortBy || "name").trim();
		const showEvaluated = req.body.showEvaluated !== false;

		if (!studentId) {
			return res.json({ success: true, teachers: [], total: 0 });
		}

		const baseParams = [];
		const addBaseParam = (value) => {
			baseParams.push(value);
			return `$${baseParams.length}`;
		};

		const studentParam = addBaseParam(studentId ? Number(studentId) : null);
		const evalJoin = `LEFT JOIN (SELECT DISTINCT tcr_id FROM evaluation WHERE evt_id = ${studentParam}::int) ev ON ev.tcr_id = t.id`;

		let fromSql = `FROM student_teacher st JOIN teachers t ON t.id = st.teacher_id JOIN users u ON u.id = t.usr_id AND u.is_deleted = false AND (u.is_admin IS FALSE OR u.is_admin IS NULL) LEFT JOIN subjects s ON s.id = t.subject ${evalJoin}`;
		const where = [];
		const baseWhere = [];

		where.push(`st.student_id = ${studentParam}`);
		baseWhere.push(`st.student_id = ${studentParam}`);

		if (search) {
			const likeParam = addBaseParam(`%${search}%`);
			where.push(
				`(LOWER(t.firstname || ' ' || t.lastname) LIKE ${likeParam} OR LOWER(s.subjects) LIKE ${likeParam})`,
			);
		}

		if (subject) {
			const subjectParam = addBaseParam(subject);
			where.push(`s.subjects = ${subjectParam}`);
		}

		if (!showEvaluated) {
			where.push("ev.tcr_id IS NULL");
		}

		const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
		const evalOrder = "CASE WHEN ev.tcr_id IS NULL THEN 0 ELSE 1 END ASC";
		const sortSql =
			sortBy === "subject"
				? "s.subjects, t.lastname, t.firstname"
				: "t.lastname, t.firstname";
		const orderSql = `ORDER BY ${evalOrder}, ${sortSql}`;

		const countSql = `SELECT COUNT(*) AS count, SUM(CASE WHEN tcr_id IS NULL THEN 1 ELSE 0 END) AS pending_count, SUM(CASE WHEN tcr_id IS NULL THEN 0 ELSE 1 END) AS evaluated_count FROM (SELECT t.id, ev.tcr_id ${fromSql} ${whereSql}) AS filtered`;
		const { rows: countRows } = await pool.query(countSql, baseParams);
		const total = Number(countRows[0]?.count) || 0;
		const pendingCount = Number(countRows[0]?.pending_count) || 0;
		const evaluatedCount = Number(countRows[0]?.evaluated_count) || 0;

		const dataParams = [...baseParams];
		const addDataParam = (value) => {
			dataParams.push(value);
			return `$${dataParams.length}`;
		};
		const limitParam = addDataParam(perPage);
		const offsetParam = addDataParam(offset);

		const dataSql = `SELECT t.id, t.firstname, t.lastname, t.subject, t.quarter, t.year, t.usr_id, u.email, s.subjects AS subject_name, CASE WHEN ev.tcr_id IS NULL THEN 'not evaluated' ELSE 'evaluated' END AS evaluated ${fromSql} ${whereSql} ${orderSql} LIMIT ${limitParam} OFFSET ${offsetParam}`;
		const { rows: teachers } = await pool.query(dataSql, dataParams);

		const result = teachers.map((t) => ({
			id: t.id,
			firstname: t.firstname,
			email: t.email || null,
			lastname: t.lastname,
			subject: t.subject_name || null,
			quarter: t.quarter,
			year: t.year,
			evaluated: t.evaluated,
		}));

		const baseWhereSql = baseWhere.length
			? `WHERE ${baseWhere.join(" AND ")}`
			: "";
		const subjectSql = `SELECT DISTINCT s.subjects AS name ${fromSql} ${baseWhereSql} ORDER BY s.subjects`;
		const subjectParams = [studentId];
		const { rows: subjectRows } = await pool.query(subjectSql, subjectParams);
		const subjects = subjectRows
			.map((row) => row.name)
			.filter((name) => name);

		return res.json({
			success: true,
			teachers: result,
			subjects,
			total,
			pendingCount,
			evaluatedCount,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  List teachers for faculty/peer view
export async function listTeachersFaculty(req, res) {
	try {
		const evaluatorUserId = req.body.id;
		let evaluatorTeacherId = null;
		
		if (evaluatorUserId) {
			const { rows } = await pool.query("SELECT id FROM teachers WHERE usr_id = $1 LIMIT 1", [evaluatorUserId]);
			if (rows.length > 0) {
				evaluatorTeacherId = rows[0].id;
			}
		}

		const usePaging = Object.prototype.hasOwnProperty.call(req.body, "page");

		if (!usePaging) {
			// Original non-paged behavior
			const { rows: teachers } = await pool.query(
				`SELECT t.id, t.firstname, t.lastname, t.subject, t.quarter, t.year, t.usr_id, u.email,
			    s.subjects AS subject_name
			 FROM teachers t
			 JOIN users u ON u.id = t.usr_id AND u.is_deleted = false AND (u.is_admin IS FALSE OR u.is_admin IS NULL)
			 LEFT JOIN subjects s ON s.id = t.subject`,
			);

			// Exclude the logged-in teacher from the list
			const filtered = evaluatorUserId
				? teachers.filter((t) => t.usr_id !== evaluatorUserId)
				: teachers;

			// Check peer evaluation status
			let evalSet = new Set();
			if (evaluatorTeacherId) {
				const { rows: evals } = await pool.query(
					"SELECT tcr_id FROM evaluation_p WHERE evt_id = $1",
					[evaluatorTeacherId],
				);
				evalSet = new Set(evals.map((e) => e.tcr_id));
			}

			const result = filtered.map((t) => ({
				id: t.id,
				firstname: t.firstname,
				lastname: t.lastname,
				email: t.email || null,
				subject: t.subject_name || null,
				subject_id: t.subject || null,
				quarter: t.quarter,
				year: t.year,
				evaluated: evalSet.has(t.id) ? "evaluated" : "not evaluated",
			}));

			// Build a distinct list of subjects for the filter dropdown from all teachers
			const subjectMap = new Map();
			for (const t of teachers) {
				if (t.subject && t.subject_name) {
					subjectMap.set(t.subject, t.subject_name);
				}
			}
			const subjects = Array.from(subjectMap, ([id, name]) => ({ id, name }));
			subjects.sort((a, b) => a.name.localeCompare(b.name));

			return res.json({
				success: true,
				teachers: result,
				subjects,
				total: result.length,
			});
		}

		// Paged behavior continues below
		const page = Math.max(1, Number(req.body.page) || 1);
		const perPage = Math.min(100, Math.max(1, Number(req.body.perPage) || 12));
		const offset = (page - 1) * perPage;
		const search = String(req.body.search || "").trim().toLowerCase();
		const subjectId = String(req.body.subject || "").trim();
		const sortBy = String(req.body.sortBy || "name").trim();
		const hideEvaluated = req.body.hideEvaluated === true;

		const baseParams = [];
		const addBaseParam = (value) => {
			baseParams.push(value);
			return `$${baseParams.length}`;
		};

		let evalJoin = "";
		if (evaluatorTeacherId) {
			const evalParam = addBaseParam(Number(evaluatorTeacherId));
			evalJoin = `LEFT JOIN (SELECT DISTINCT tcr_id FROM evaluation_p WHERE evt_id = ${evalParam}) ev ON ev.tcr_id = t.id`;
		} else {
			evalJoin = `LEFT JOIN (SELECT DISTINCT tcr_id FROM evaluation_p WHERE 1=0) ev ON ev.tcr_id = t.id`;
		}

		const fromSql = `FROM teachers t JOIN users u ON u.id = t.usr_id AND u.is_deleted = false AND (u.is_admin IS FALSE OR u.is_admin IS NULL) LEFT JOIN subjects s ON s.id = t.subject ${evalJoin}`;
		const where = [];

		if (evaluatorUserId) {
			const userParam = addBaseParam(Number(evaluatorUserId));
			where.push(`t.usr_id != ${userParam}`);
		}

		if (search) {
			const likeParam = addBaseParam(`%${search}%`);
			where.push(
				`(LOWER(t.firstname || ' ' || t.lastname) LIKE ${likeParam} OR LOWER(s.subjects) LIKE ${likeParam})`,
			);
		}

		if (subjectId) {
			const subjectParam = addBaseParam(Number(subjectId));
			where.push(`t.subject = ${subjectParam}`);
		}

		if (hideEvaluated) {
			where.push("ev.tcr_id IS NULL");
		}

		const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
		const evalOrder = "CASE WHEN ev.tcr_id IS NULL THEN 0 ELSE 1 END ASC";
		const sortSql =
			sortBy === "subject"
				? "s.subjects, t.lastname, t.firstname"
				: sortBy === "quarter"
					? "t.quarter, t.lastname, t.firstname"
					: "t.lastname, t.firstname";
		const orderSql = `ORDER BY ${evalOrder}, ${sortSql}`;

		const countSql = `SELECT COUNT(*) AS count, SUM(CASE WHEN tcr_id IS NULL THEN 1 ELSE 0 END) AS pending_count, SUM(CASE WHEN tcr_id IS NULL THEN 0 ELSE 1 END) AS evaluated_count FROM (SELECT t.id, ev.tcr_id ${fromSql} ${whereSql}) AS filtered`;
		const { rows: countRows } = await pool.query(countSql, baseParams);
		const total = Number(countRows[0]?.count) || 0;
		const pendingCount = Number(countRows[0]?.pending_count) || 0;
		const evaluatedCount = Number(countRows[0]?.evaluated_count) || 0;

		const dataParams = [...baseParams];
		const addDataParam = (value) => {
			dataParams.push(value);
			return `$${dataParams.length}`;
		};
		const limitParam = addDataParam(perPage);
		const offsetParam = addDataParam(offset);

		const dataSql = `SELECT t.id, t.firstname, t.lastname, t.subject, t.quarter, t.year, t.usr_id, u.email, s.subjects AS subject_name, CASE WHEN ev.tcr_id IS NULL THEN 'not evaluated' ELSE 'evaluated' END AS evaluated ${fromSql} ${whereSql} ${orderSql} LIMIT ${limitParam} OFFSET ${offsetParam}`;
		const { rows: teachers } = await pool.query(dataSql, dataParams);

		const result = teachers.map((t) => ({
			id: t.id,
			firstname: t.firstname,
			lastname: t.lastname,
			email: t.email || null,
			subject: t.subject_name || null,
			subject_id: t.subject || null,
			quarter: t.quarter,
			year: t.year,
			evaluated: t.evaluated,
		}));

		const subjectSql = `SELECT DISTINCT t.subject AS id, s.subjects AS name FROM teachers t LEFT JOIN subjects s ON s.id = t.subject JOIN users u ON u.id = t.usr_id AND u.is_deleted = false ORDER BY s.subjects`;
		const { rows: subjectRows } = await pool.query(subjectSql);
		const subjects = subjectRows
			.filter((row) => row.name)
			.map((row) => ({ id: row.id, name: row.name }));

		return res.json({
			success: true,
			teachers: result,
			subjects,
			total,
			pendingCount,
			evaluatedCount,
		});
	} catch (err) {
		console.error("listTeachersFaculty error:", err);
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get teacher by ID
export async function getTeacherById(req, res) {
	try {
		const id = Number(req.body.id);

		const { rows } = await pool.query(
			`SELECT t.firstname, t.lastname, s.subjects AS subject_name
 FROM teachers t
 LEFT JOIN subjects s ON s.id = t.subject
 WHERE t.id = $1 LIMIT 1`,
			[id],
		);
		const teacher = rows[0];

		if (!teacher) {
			return res
				.status(400)
				.json({ success: false, message: "error teacher not found" });
		}

		const now = new Date();
		const month = now.toLocaleString("en-US", { month: "long" });

		return res.json({
			success: true,
			teacher: {
				firstnm: teacher.firstname,
				lastnm: teacher.lastname,
				sub: teacher.subject_name,
			},
			month,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Create teacher (admin)
export async function createTeacher(req, res) {
	try {
		const { email, fn, ln, ps, cpas, sub, qrt, yr } = req.body;

		if (ps !== cpas) {
			return res
				.status(400)
				.json({ success: false, error: "Passwords do not match" });
		}

		const { rows: existingRows } = await pool.query(
			"SELECT id FROM users WHERE email = $1 LIMIT 1",
			[email],
		);

		if (existingRows.length > 0) {
			return res.status(400).json({
				success: false,
				error: "Error",
				message: "User already exist",
			});
		}

		const hash = await bcrypt.hash(ps, 10);
		const resetCode = getRandomString(10);
		const verifyCode = getRandomString(10);

		const { rows: newUserRows } = await pool.query(
			"INSERT INTO users (email, password, reset, verify_code, is_teacher) VALUES ($1, $2, $3, $4, true) RETURNING id",
			[email, hash, resetCode, verifyCode],
		);
		const newUser = newUserRows[0];

		if (!newUser) {
			return res
				.status(500)
				.json({ success: false, error: "Error creating user" });
		}

		await pool.query(
			"INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			[fn, ln, sub, qrt, yr, resetCode, newUser.id],
		);

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Edit teacher (admin)
export async function editTeacher(req, res) {
	try {
		const { id, fn, ln, sub, qrt, yr } = req.body;

		await pool.query(
			"UPDATE teachers SET firstname = $1, lastname = $2, subject = $3, quarter = $4, year = $5 WHERE id = $6",
			[fn, ln, sub, qrt, yr, id],
		);

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Delete teacher
export async function deleteTeacher(req, res) {
	try {
		const id = Number(req.body.id);

		// Look up the user ID before deleting the teacher record
		const { rows } = await pool.query(
			"SELECT usr_id FROM teachers WHERE id = $1 LIMIT 1",
			[id],
		);

		// Soft-delete the associated user record so they can no longer log in
		if (rows[0]?.usr_id) {
			await pool.query(
				"UPDATE users SET is_deleted = true WHERE id = $1",
				[rows[0].usr_id],
			);
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}
//  List archived teachers
export async function listArchivedTeachers(req, res) {
	try {
		const { rows: teachers } = await pool.query(
			`SELECT t.id, t.firstname, t.lastname, t.subject, t.quarter, t.year, t.usr_id, u.email, s.subjects AS subject_name 
			 FROM teachers t 
			 JOIN users u ON u.id = t.usr_id 
			 LEFT JOIN subjects s ON s.id = t.subject 
			 WHERE u.is_deleted = true 
			 ORDER BY t.lastname, t.firstname`
		);

		const result = teachers.map((t) => ({
			id: t.id,
			firstname: t.firstname,
			email: t.email || null,
			lastname: t.lastname,
			subject: t.subject_name || null,
			quarter: t.quarter,
			year: t.year,
		}));

		return res.json({ success: true, teachers: result, total: result.length });
	} catch (err) {
		console.error("listArchivedTeachers error:", err);
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Restore archived teacher
export async function restoreTeacher(req, res) {
	try {
		const id = Number(req.body.id);

		// Look up the user ID
		const { rows } = await pool.query(
			"SELECT usr_id FROM teachers WHERE id = $1 LIMIT 1",
			[id],
		);

		if (rows[0]?.usr_id) {
			await pool.query(
				"UPDATE users SET is_deleted = false WHERE id = $1",
				[rows[0].usr_id],
			);
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}
