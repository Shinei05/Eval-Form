import bcrypt from "bcryptjs";
import pool from "../config/supabase.js";
import { getRandomString, getCurrentPeriod } from "../utils/helpers.js";
import { aiSummarize } from "../utils/ai.js";

const ELEMENTARY_GRADES = new Set(["4", "5", "6"]);
const JHS_GRADES = new Set(["7", "8", "9", "10"]);

//  CSV Import (students + teacher assignments)
export async function csvImport(req, res) {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ success: false, message: "No file uploaded" });
		}

		const content = req.file.buffer.toString("utf-8");
		const lines = content.split(/\r?\n/).filter((l) => l.trim());
		const results = [];

		// Skip header row if it starts with "student_email"
		const startIdx =
			lines[0] && lines[0].toLowerCase().startsWith("student_email")
				? 1
				: 0;

		for (let i = startIdx; i < lines.length; i++) {
			const row = lines[i].split(",").map((c) => c.trim());
			const studentEmail = row[0] || null;
			const studentFirstname = row[1] || null;
			const studentLastname = row[2] || null;
			const studId = row[3] ? Number(row[3]) : null;
			const studentGrade = row[4] || null;
			const studentSection = row[5] || null;
			const studentPassword = row[6] || null;
			const teacherEmail = row[7] || null;
			const teacherFirstname = row[8] || null;
			const teacherLastname = row[9] || null;
			const teacherPassword = row[10] || null;
			const subjectName = row[11] || null;
			const quarter = row[12] ? Number(row[12]) : null;
			const year = row[13] ? Number(row[13]) : null;

			if (!studentEmail || !studentFirstname || !studentLastname || studId === null) {
				results.push({
					row: i + 1,
					email: studentEmail,
					success: false,
					message: "Missing required student fields",
				});
				continue;
			}

			if (!teacherEmail || !quarter || !year) {
				results.push({
					row: i + 1,
					email: studentEmail,
					success: false,
					message: "Missing teacher_email, quarter, or year",
				});
				continue;
			}

			try {
				// 1. Resolve or create subject
				let subjectId = null;
				if (subjectName) {
					const { rows: subjectRows } = await pool.query(
						"SELECT id FROM subjects WHERE LOWER(subjects) = LOWER($1)",
						[subjectName],
					);
					if (subjectRows.length > 0) {
						subjectId = subjectRows[0].id;
					} else {
						const { rows: newSubjectRows } = await pool.query(
							"INSERT INTO subjects (subjects) VALUES ($1) RETURNING id",
							[subjectName],
						);
						subjectId = newSubjectRows[0]?.id;
					}
				}

				// 2. Find or create the student's user account
				let studentUserId = null;
				let studentRecordId = null;
				let isNewStudent = false;

				const { rows: existingUsers } = await pool.query(
					"SELECT id FROM users WHERE email = $1 AND is_deleted = false",
					[studentEmail],
				);

				if (existingUsers.length > 0) {
					studentUserId = existingUsers[0].id;

					// Get existing student record
					const { rows: existingStudents } = await pool.query(
						"SELECT id FROM students WHERE usr_id = $1",
						[studentUserId],
					);
					if (existingStudents.length > 0) {
						studentRecordId = existingStudents[0].id;
					}
				} else {
					// Create new user + student
					isNewStudent = true;
					const password = studentPassword || `${studentLastname}${studId}`;
					const hash = await bcrypt.hash(password, 10);
					const resetCode = getRandomString(10);
					const verifyCode = getRandomString(10);

					const { rows: newUserRows } = await pool.query(
						"INSERT INTO users (email, password, reset, verify_code) VALUES ($1, $2, $3, $4) RETURNING id",
						[studentEmail, hash, resetCode, verifyCode],
					);
					studentUserId = newUserRows[0]?.id;

					if (!studentUserId) {
						results.push({
							row: i + 1,
							email: studentEmail,
							success: false,
							message: "Failed to create user",
						});
						continue;
					}

					const { rows: newStudentRows } = await pool.query(
						"INSERT INTO students (firstname, lastname, stud_id, usr_id, grade, section) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
						[studentFirstname, studentLastname, studId, studentUserId, studentGrade, studentSection],
					);
					studentRecordId = newStudentRows[0]?.id;
				}

				if (!studentRecordId) {
					results.push({
						row: i + 1,
						email: studentEmail,
						success: false,
						message: "Student record not found",
					});
					continue;
				}

				// If student exists, update section and grade with values in CSV row
				if (!isNewStudent) {
					await pool.query(
						"UPDATE students SET grade = $1, section = $2 WHERE id = $3",
						[studentGrade, studentSection, studentRecordId],
					);
				}

				// Calculate elementary/JHS flags
				const gradeStr = studentGrade ? String(studentGrade).trim() : "";
				const isElementary = ELEMENTARY_GRADES.has(gradeStr);
				const isJhs = JHS_GRADES.has(gradeStr);

				// 3. Find or create teacher
				let teacherId = null;
				let teacherUserId = null;

				const { rows: existingTeacherUsers } = await pool.query(
					"SELECT id FROM users WHERE email = $1 AND is_deleted = false",
					[teacherEmail],
				);

				if (existingTeacherUsers.length > 0) {
					teacherUserId = existingTeacherUsers[0].id;
					const { rows: existingTeachers } = await pool.query(
						"SELECT id, is_elementary, is_jhs FROM teachers WHERE usr_id = $1",
						[teacherUserId],
					);
					if (existingTeachers.length > 0) {
						const existingTeacher = existingTeachers[0];
						teacherId = existingTeacher.id;

						// Update flags if assigned student grade falls in those ranges
						const updateElementary = existingTeacher.is_elementary || isElementary;
						const updateJhs = existingTeacher.is_jhs || isJhs;
						if (updateElementary !== existingTeacher.is_elementary || updateJhs !== existingTeacher.is_jhs) {
							await pool.query(
								"UPDATE teachers SET is_elementary = $1, is_jhs = $2 WHERE id = $3",
								[updateElementary, updateJhs, teacherId],
							);
						}
					}
				} else {
					// Create new teacher user + record
					const password = teacherPassword || `${teacherLastname}123`;
					const hash = await bcrypt.hash(password, 10);
					const resetCode = getRandomString(10);
					const verifyCode = getRandomString(10);

					const { rows: newTUserRows } = await pool.query(
						"INSERT INTO users (email, password, reset, verify_code, is_teacher) VALUES ($1, $2, $3, $4, true) RETURNING id",
						[teacherEmail, hash, resetCode, verifyCode],
					);
					teacherUserId = newTUserRows[0]?.id;

					if (!teacherUserId) {
						results.push({
							row: i + 1,
							email: studentEmail,
							success: false,
							message: `Failed to create teacher user: ${teacherEmail}`,
						});
						continue;
					}

					const { rows: newTeacherRows } = await pool.query(
						"INSERT INTO teachers (firstname, lastname, subject, quarter, year, identifier, usr_id, is_elementary, is_jhs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
						[
							teacherFirstname,
							teacherLastname,
							subjectId,
							quarter,
							year,
							resetCode,
							teacherUserId,
							isElementary,
							isJhs,
						],
					);
					teacherId = newTeacherRows[0]?.id;
				}

				if (!teacherId) {
					results.push({
						row: i + 1,
						email: studentEmail,
						success: false,
						message: `Teacher record not found for: ${teacherEmail}`,
					});
					continue;
				}

				// 4. Create student-teacher assignment (skip duplicates)
				await pool.query(
					`INSERT INTO student_teacher (student_id, teacher_id, subject_id, quarter, year, section)
					 VALUES ($1, $2, $3, $4, $5, $6)
					 ON CONFLICT (student_id, teacher_id, quarter, year) DO NOTHING`,
					[
						studentRecordId,
						teacherId,
						subjectId,
						quarter,
						year,
						studentSection,
					],
				);

				results.push({
					row: i + 1,
					email: studentEmail,
					success: true,
					message: "ok",
				});
			} catch (rowErr) {
				results.push({
					row: i + 1,
					email: studentEmail,
					success: false,
					message: rowErr.message,
				});
			}
		}

		return res.json({ success: true, results });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get all subjects
export async function getSubjects(req, res) {
	try {
		const { rows: subjects } = await pool.query(
			"SELECT id, subjects FROM subjects",
		);

		if (!subjects || subjects.length === 0) {
			return res.status(400).json({ success: false, message: "error" });
		}

		return res.json({ success: true, subjects });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get current schedule
export async function getSchedule(req, res) {
	try {
		const { rows } = await pool.query(
			"SELECT * FROM schedules WHERE is_deleted = false ORDER BY id DESC LIMIT 1",
		);
		const schedule = rows[0];

		if (!schedule) {
			return res.status(500).json({ success: false, message: "error" });
		}

		const currentPeriod = getCurrentPeriod(schedule);
		return res.json({ success: true, times: schedule, currentPeriod });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Set (or overwrite) a schedule period & notify via email
export async function setSchedule(req, res) {
	try {
		const periodNumber = Number(req.body.period);
		const schoolYear = String(req.body.school_year || "").trim();
		const date_start = req.body.date_start || null;
		const time_start = req.body.time_start || null;
		const date_end = req.body.date_end || null;
		const time_end = req.body.time_end || null;

		if (![1, 2, 3, 4].includes(periodNumber)) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid period" });
		}

		if (!date_start || !time_start || !date_end || !time_end) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}

		if (!schoolYear) {
			return res
				.status(400)
				.json({ success: false, message: "School year is required" });
		}

		const { rows } = await pool.query(
			"SELECT * FROM schedules WHERE is_deleted = false ORDER BY id DESC LIMIT 1",
		);
		const current = rows[0] || null;

		if (current) {
			// Always UPDATE — periods can now be edited/overwritten
			await pool.query(
				`UPDATE schedules SET
					school_year = $1,
					p${periodNumber}_time_start = $2,
					p${periodNumber}_date_start = $3,
					p${periodNumber}_time_end = $4,
					p${periodNumber}_date_end = $5
				WHERE id = $6`,
				[schoolYear, time_start, date_start, time_end, date_end, current.id],
			);
		} else {
			await pool.query(
				`INSERT INTO schedules (school_year, p${periodNumber}_time_start, p${periodNumber}_date_start, p${periodNumber}_time_end, p${periodNumber}_date_end, is_deleted)
				 VALUES ($1, $2, $3, $4, $5, false)`,
				[schoolYear, time_start, date_start, time_end, date_end],
			);
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Reset (clear) a specific schedule period
export async function resetSchedule(req, res) {
	try {
		const periodNumber = Number(req.body.period);

		if (![1, 2, 3, 4].includes(periodNumber)) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid period" });
		}

		const { rows } = await pool.query(
			"SELECT id FROM schedules WHERE is_deleted = false ORDER BY id DESC LIMIT 1",
		);
		const current = rows[0];

		if (!current) {
			return res
				.status(404)
				.json({ success: false, message: "No schedule found" });
		}

		await pool.query(
			`UPDATE schedules SET
				p${periodNumber}_date_start = NULL,
				p${periodNumber}_time_start = NULL,
				p${periodNumber}_date_end = NULL,
				p${periodNumber}_time_end = NULL
			WHERE id = $1`,
			[current.id],
		);

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  AI summarise evaluation
export async function aiSummary(req, res) {
	const { feedback, questions, answers, id: teacherId } = req.body;

	try {
		// If teacher ID provided, fetch data automatically
		if (teacherId && !feedback) {
			const { rows: evals } = await pool.query(
				"SELECT id, feedback, avg FROM evaluation WHERE tcr_id = $1",
				[Number(teacherId)],
			);

			if (!evals || evals.length === 0) {
				return res.json({
					success: false,
					message: "No evaluations found",
				});
			}

			const sessionIds = evals.map((e) => e.id);
			const { rows: evalAnswers } = await pool.query(
				"SELECT session_id, question_id, score FROM evaluation_answer WHERE session_id = ANY($1::int[])",
				[sessionIds],
			);

			// Get questions
			const { rows: headers } = await pool.query(
				"SELECT id, header FROM headers WHERE is_deleted = false",
			);

			const headerIds = (headers || []).map((h) => h.id);
			let qs = [];
			if (headerIds.length > 0) {
				const { rows } = await pool.query(
					"SELECT id, questions, header_id FROM questions WHERE header_id = ANY($1::int[])",
					[headerIds],
				);
				qs = rows;
			}

			const feedbackList = evals.map((e) => e.feedback).filter(Boolean);
			const questionList = (qs || []).map((q) => q.questions);
			const answerList = (evalAnswers || []).map(
				(a) => `Q${a.question_id}: ${a.score}`,
			);

			const summary = await aiSummarize(
				feedbackList.join("\n"),
				questionList.join("\n"),
				answerList.join("\n"),
			);
			return res.json({ success: true, summary, response: summary });
		}

		const summary = await aiSummarize(feedback, questions, answers);
		return res.json({ success: true, summary, response: summary });
	} catch (err) {
		console.error("AI Summarizer Error:", err.message);
		return res
			.status(500)
			.json({ success: false, message: "AI summarization failed" });
	}
}

//  Export data as CSV
export async function exportCSV(req, res) {
	try {
		const tableName = req.body.table || "evaluation";

		// Whitelist allowed tables for safety
		const allowed = [
			"users",
			"students",
			"teachers",
			"subjects",
			"headers",
			"header_t",
			"questions",
			"question_t",
			"evaluation",
			"evaluation_answer",
			"evaluation_p",
			"evaluation_ans_p",
			"schedules",
		];

		if (!allowed.includes(tableName)) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid table" });
		}

		const { rows: data } = await pool.query(`SELECT * FROM "${tableName}"`);

		if (!data || data.length === 0) {
			return res
				.status(400)
				.json({ success: false, message: "No data to export" });
		}

		// Build CSV
		const csvHeaders = Object.keys(data[0]);
		const csvLines = [
			csvHeaders.join(","),
			...data.map((row) =>
				csvHeaders
					.map((h) => {
						const val = row[h] === null ? "" : String(row[h]);
						return val.includes(",") || val.includes('"')
							? `"${val.replace(/"/g, '""')}"`
							: val;
					})
					.join(","),
			),
		];

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${tableName}_export.csv"`,
		);
		return res.send(csvLines.join("\n"));
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

// Export teacher performance and summary report
export async function exportTeacherReport(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id || req.body.id);
		if (!tcrId) {
			return res.status(400).json({ success: false, message: "Missing teacher ID" });
		}

		// 1. Get teacher details
		const { rows: teachers } = await pool.query(
			`SELECT t.id, t.firstname, t.lastname, t.quarter, t.year, u.email, s.subjects AS subject_name
			 FROM teachers t
			 JOIN users u ON u.id = t.usr_id
			 LEFT JOIN subjects s ON s.id = t.subject
			 WHERE t.id = $1`,
			[tcrId]
		);
		if (teachers.length === 0) {
			return res.status(404).json({ success: false, message: "Teacher not found" });
		}
		const teacher = teachers[0];

		// 2. Fetch student evaluations and averages
		const { rows: studentEvals } = await pool.query(
			"SELECT created_at, avg, sentiment, feedback FROM evaluation WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId]
		);

		// 3. Fetch peer evaluations and averages
		const { rows: peerEvals } = await pool.query(
			"SELECT created_at, avg, sentiment, feedback FROM evaluation_p WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId]
		);

		// 4. Fetch average score per category (student evaluation headers)
		const { rows: studentCategories } = await pool.query(
			`SELECT h.header, AVG(ea.score) as avg_score
			 FROM evaluation e
			 JOIN evaluation_answer ea ON ea.session_id = e.id
			 JOIN questions q ON q.id = ea.question_id
			 JOIN headers h ON h.id = q.header_id
			 WHERE e.tcr_id = $1
			 GROUP BY h.header, h.id
			 ORDER BY h.id ASC`,
			[tcrId]
		);

		// 5. Fetch average score per category (peer evaluation headers)
		const { rows: peerCategories } = await pool.query(
			`SELECT ht.header, AVG(eap.score) as avg_score
			 FROM evaluation_p ep
			 JOIN evaluation_ans_p eap ON eap.session_id = ep.id
			 JOIN question_t qt ON qt.id = eap.question_id
			 JOIN header_t ht ON ht.id = qt.header_id
			 WHERE ep.tcr_id = $1
			 GROUP BY ht.header, ht.id
			 ORDER BY ht.id ASC`,
			[tcrId]
		);

		// Calculate combined stats
		const studentCount = studentEvals.length;
		const peerCount = peerEvals.length;
		const totalCount = studentCount + peerCount;

		const studentAvg = studentCount > 0
			? studentEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) / studentCount
			: 0;
		const peerAvg = peerCount > 0
			? peerEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) / peerCount
			: 0;

		const totalSum = studentEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) +
			peerEvals.reduce((sum, ev) => sum + Number(ev.avg), 0);
		const combinedAvg = totalCount > 0 ? totalSum / totalCount : 0;

		// Format CSV helper function
		const clean = (val) => {
			if (val === null || val === undefined) return "";
			const str = String(val);
			return str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")
				? `"${str.replace(/"/g, '""')}"`
				: str;
		};

		const csvLines = [];
		csvLines.push("TEACHER EVALUATION PERFORMANCE & SUMMARY REPORT");
		csvLines.push(`Teacher Name,${clean(teacher.firstname + " " + teacher.lastname)}`);
		csvLines.push(`Email,${clean(teacher.email)}`);
		csvLines.push(`Subject,${clean(teacher.subject_name)}`);
		csvLines.push(`Quarter,${clean(teacher.quarter)}`);
		csvLines.push(`Year,${clean(teacher.year)}`);
		csvLines.push("");

		csvLines.push("OVERALL RATINGS SUMMARY");
		csvLines.push("Evaluation Type,Total Evaluators,Average Score");
		csvLines.push(`Student Evaluations,${studentCount},${studentAvg.toFixed(2)}`);
		csvLines.push(`Peer/Teacher Evaluations,${peerCount},${peerAvg.toFixed(2)}`);
		csvLines.push(`Combined Evaluations,${totalCount},${combinedAvg.toFixed(2)}`);
		csvLines.push("");

		csvLines.push("PERFORMANCE RATING BY CATEGORY (STUDENT EVALUATIONS)");
		csvLines.push("Category/Header,Average Rating");
		if (studentCategories.length > 0) {
			studentCategories.forEach(c => {
				csvLines.push(`${clean(c.header)},${Number(c.avg_score).toFixed(2)}`);
			});
		} else {
			csvLines.push("No data,N/A");
		}
		csvLines.push("");

		csvLines.push("PERFORMANCE RATING BY CATEGORY (PEER/TEACHER EVALUATIONS)");
		csvLines.push("Category/Header,Average Rating");
		if (peerCategories.length > 0) {
			peerCategories.forEach(c => {
				csvLines.push(`${clean(c.header)},${Number(c.avg_score).toFixed(2)}`);
			});
		} else {
			csvLines.push("No data,N/A");
		}
		csvLines.push("");

		csvLines.push("INDIVIDUAL EVALUATION COMMENTS & FEEDBACK LOG");
		csvLines.push("Date,Evaluation Type,Average Score,Sentiment,Comments/Feedback");

		const allIndividual = [];
		studentEvals.forEach(e => {
			allIndividual.push({
				date: new Date(e.created_at).toLocaleDateString(),
				type: "Student",
				avg: Number(e.avg).toFixed(2),
				sentiment: e.sentiment || "N/A",
				feedback: e.feedback || ""
			});
		});
		peerEvals.forEach(e => {
			allIndividual.push({
				date: new Date(e.created_at).toLocaleDateString(),
				type: "Peer",
				avg: Number(e.avg).toFixed(2),
				sentiment: e.sentiment || "N/A",
				feedback: e.feedback || ""
			});
		});

		if (allIndividual.length > 0) {
			allIndividual.forEach(item => {
				csvLines.push(`${clean(item.date)},${clean(item.type)},${clean(item.avg)},${clean(item.sentiment)},${clean(item.feedback)}`);
			});
		} else {
			csvLines.push("N/A,N/A,N/A,N/A,No evaluations submitted yet");
		}

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="teacher_${teacher.lastname}_report.csv"`
		);
		return res.send(csvLines.join("\r\n"));

	} catch (err) {
		console.error("Export teacher error:", err.message);
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}

// Fetch raw evaluation data for generating detailed teacher summary report
export async function getTeacherReportData(req, res) {
	try {
		const { tcr_id: tcrId } = req.body;
		if (!tcrId) {
			return res.status(400).json({ success: false, message: "Missing teacher ID" });
		}

		// 1. Get teacher details
		const { rows: teachers } = await pool.query(
			`SELECT t.id, t.firstname, t.lastname, t.quarter, t.year, u.email, s.subjects AS subject_name
			 FROM teachers t
			 JOIN users u ON u.id = t.usr_id
			 LEFT JOIN subjects s ON s.id = t.subject
			 WHERE t.id = $1`,
			[tcrId]
		);
		if (teachers.length === 0) {
			return res.status(404).json({ success: false, message: "Teacher not found" });
		}
		const teacher = teachers[0];

		// 2. Fetch student evaluations and averages
		const { rows: studentEvals } = await pool.query(
			"SELECT created_at, avg, sentiment, feedback FROM evaluation WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId]
		);

		// 3. Fetch peer evaluations and averages
		const { rows: peerEvals } = await pool.query(
			"SELECT created_at, avg, sentiment, feedback FROM evaluation_p WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId]
		);

		// 4. Fetch average score per category (student evaluation headers)
		const { rows: studentCategories } = await pool.query(
			`SELECT h.header, AVG(ea.score) as avg_score
			 FROM evaluation e
			 JOIN evaluation_answer ea ON ea.session_id = e.id
			 JOIN questions q ON q.id = ea.question_id
			 JOIN headers h ON h.id = q.header_id
			 WHERE e.tcr_id = $1
			 GROUP BY h.header, h.id
			 ORDER BY h.id ASC`,
			[tcrId]
		);

		// 5. Fetch average score per category (peer evaluation headers)
		const { rows: peerCategories } = await pool.query(
			`SELECT ht.header, AVG(eap.score) as avg_score
			 FROM evaluation_p ep
			 JOIN evaluation_ans_p eap ON eap.session_id = ep.id
			 JOIN question_t qt ON qt.id = eap.question_id
			 JOIN header_t ht ON ht.id = qt.header_id
			 WHERE ep.tcr_id = $1
			 GROUP BY ht.header, ht.id
			 ORDER BY ht.id ASC`,
			[tcrId]
		);

		// Calculate combined stats
		const studentCount = studentEvals.length;
		const peerCount = peerEvals.length;
		const totalCount = studentCount + peerCount;

		const studentAvg = studentCount > 0
			? studentEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) / studentCount
			: 0;
		const peerAvg = peerCount > 0
			? peerEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) / peerCount
			: 0;

		const totalSum = studentEvals.reduce((sum, ev) => sum + Number(ev.avg), 0) +
			peerEvals.reduce((sum, ev) => sum + Number(ev.avg), 0);
		const combinedAvg = totalCount > 0 ? totalSum / totalCount : 0;

		return res.json({
			success: true,
			teacher,
			studentEvals,
			peerEvals,
			studentCategories,
			peerCategories,
			stats: {
				studentCount,
				peerCount,
				totalCount,
				studentAvg: Number(studentAvg.toFixed(2)),
				peerAvg: Number(peerAvg.toFixed(2)),
				combinedAvg: Number(combinedAvg.toFixed(2))
			}
		});

	} catch (err) {
		console.error("Get teacher report data error:", err.message);
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}

// Export consolidated summary report of all teachers
export async function exportAllTeachersReport(req, res) {
	try {
		// 1. Get all teachers
		const { rows: teachers } = await pool.query(
			`SELECT t.id, t.firstname, t.lastname, t.quarter, t.year, u.email, s.subjects AS subject_name
			 FROM teachers t
			 JOIN users u ON u.id = t.usr_id
			 LEFT JOIN subjects s ON s.id = t.subject
			 WHERE u.is_deleted = false`
		);

		// 2. Fetch all student evaluations summary
		const { rows: studentSummary } = await pool.query(
			`SELECT tcr_id, COUNT(*) as count, AVG(avg) as avg_score
			 FROM evaluation
			 GROUP BY tcr_id`
		);

		// 3. Fetch all peer evaluations summary
		const { rows: peerSummary } = await pool.query(
			`SELECT tcr_id, COUNT(*) as count, AVG(avg) as avg_score
			 FROM evaluation_p
			 GROUP BY tcr_id`
		);

		// Convert summaries to maps for easy access
		const studentMap = {};
		studentSummary.forEach(s => {
			studentMap[s.tcr_id] = {
				count: Number(s.count),
				avg: Number(s.avg_score)
			};
		});

		const peerMap = {};
		peerSummary.forEach(p => {
			peerMap[p.tcr_id] = {
				count: Number(p.count),
				avg: Number(p.avg_score)
			};
		});

		const clean = (val) => {
			if (val === null || val === undefined) return "";
			const str = String(val);
			return str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")
				? `"${str.replace(/"/g, '""')}"`
				: str;
		};

		const csvLines = [];
		csvLines.push("ALL TEACHERS EVALUATION SUMMARY REPORT");
		csvLines.push("");
		csvLines.push("Teacher ID,First Name,Last Name,Email,Subject,Quarter,Year,Student Evals Count,Student Avg Score,Peer Evals Count,Peer Avg Score,Combined Evals Count,Combined Avg Score");

		teachers.forEach(t => {
			const sInfo = studentMap[t.id] || { count: 0, avg: 0 };
			const pInfo = peerMap[t.id] || { count: 0, avg: 0 };
			const totalCount = sInfo.count + pInfo.count;

			const sTotal = sInfo.count * sInfo.avg;
			const pTotal = pInfo.count * pInfo.avg;
			const combinedAvg = totalCount > 0 ? (sTotal + pTotal) / totalCount : 0;

			csvLines.push([
				t.id,
				clean(t.firstname),
				clean(t.lastname),
				clean(t.email),
				clean(t.subject_name),
				clean(t.quarter),
				clean(t.year),
				sInfo.count,
				sInfo.avg.toFixed(2),
				pInfo.count,
				pInfo.avg.toFixed(2),
				totalCount,
				combinedAvg.toFixed(2)
			].join(","));
		});

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="all_teachers_report.csv"`
		);
		return res.send(csvLines.join("\r\n"));

	} catch (err) {
		console.error("Export all teachers error:", err.message);
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}
