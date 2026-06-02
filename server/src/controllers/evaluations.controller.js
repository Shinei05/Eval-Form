import pool from "../config/supabase.js";
import { getRandomString, getSentiment } from "../utils/helpers.js";

//  Submit student  teacher evaluation
export async function submitStudent(req, res) {
	try {
		const { id: teacherId, feedback, answers, stid: studentId } = req.body;

		const { rows: existing } = await pool.query(
			"SELECT id FROM evaluation WHERE tcr_id = $1 AND evt_id = $2 LIMIT 1",
			[teacherId, studentId],
		);
		if (existing.length > 0) {
			return res.status(400).json({ success: false, error: "You have already submitted an evaluation for this teacher." });
		}

		// Enforce relationship check
		const { rows: rel } = await pool.query(
			"SELECT id FROM student_teacher WHERE student_id = $1 AND teacher_id = $2 LIMIT 1",
			[studentId, teacherId],
		);
		if (rel.length === 0) {
			return res.status(403).json({ success: false, error: "You are not assigned to this teacher." });
		}

		const scores = Object.values(answers).map(Number);
		const average = scores.reduce((a, b) => a + b, 0) / scores.length;
		const sentiment = getSentiment(average);
		const identifier = getRandomString(10);

		const { rows: evalRows } = await pool.query(
			"INSERT INTO evaluation (tcr_id, evt_id, identifier, feedback, avg, sentiment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			[teacherId, studentId, identifier, feedback, average, sentiment],
		);
		const evalRow = evalRows[0];

		if (!evalRow) {
			return res
				.status(500)
				.json({ success: false, message: "Error creating evaluation" });
		}

		const answerRows = Object.entries(answers).map(([qid, score]) => ({
			session_id: evalRow.id,
			question_id: Number(qid),
			score: Number(score),
		}));

		// Batch insert answers
		if (answerRows.length > 0) {
			const values = answerRows
				.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
				.join(", ");
			const params = answerRows.flatMap((a) => [
				a.session_id,
				a.question_id,
				a.score,
			]);

			await pool.query(
				`INSERT INTO evaluation_answer (session_id, question_id, score) VALUES ${values}`,
				params,
			);
		}
		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Submit teacher  teacher (peer) evaluation
export async function submitTeacher(req, res) {
	try {
		const {
			id: teacherId,
			feedback,
			answers,
			stid: evaluatorId,
		} = req.body;

		const { rows: existing } = await pool.query(
			"SELECT id FROM evaluation_p WHERE tcr_id = $1 AND evt_id = $2 LIMIT 1",
			[teacherId, evaluatorId],
		);
		if (existing.length > 0) {
			return res.status(400).json({ success: false, error: "You have already submitted an evaluation for this teacher." });
		}

		const scores = Object.values(answers).map(Number);
		const average = scores.reduce((a, b) => a + b, 0) / scores.length;
		const sentiment = getSentiment(average);
		const identifier = getRandomString(10);

		const { rows: evalRows } = await pool.query(
			"INSERT INTO evaluation_p (evt_id, tcr_id, identifier, feedback, avg, sentiment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			[evaluatorId, teacherId, identifier, feedback, average, sentiment],
		);
		const evalRow = evalRows[0];

		if (!evalRow) {
			return res
				.status(500)
				.json({ success: false, message: "Error creating evaluation" });
		}

		const answerRows = Object.entries(answers).map(([qid, score]) => ({
			session_id: evalRow.id,
			question_id: Number(qid),
			score: Number(score),
		}));

		if (answerRows.length > 0) {
			const values = answerRows
				.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
				.join(", ");
			const params = answerRows.flatMap((a) => [
				a.session_id,
				a.question_id,
				a.score,
			]);

			await pool.query(
				`INSERT INTO evaluation_ans_p (session_id, question_id, score) VALUES ${values}`,
				params,
			);
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get student evaluation answers for a specific eval
export async function getStudentAnswers(req, res) {
	try {
		const id = Number(req.body.id);
		const evt = Number(req.body.evt);
		const tcr = Number(req.body.tcr);

		const { rows: evals } = await pool.query(
			"SELECT id, feedback, created_at, avg FROM evaluation WHERE id = $1 AND evt_id = $2 AND tcr_id = $3",
			[id, evt, tcr],
		);

		if (!evals || evals.length === 0) {
			return res.json({
				success: false,
				message: "Error at first query",
			});
		}

		const sessionIds = evals.map((e) => e.id);

		const { rows: answers } = await pool.query(
			"SELECT session_id, question_id, score FROM evaluation_answer WHERE session_id = ANY($1::int[])",
			[sessionIds],
		);

		const allContents = {};
		for (const e of evals) {
			allContents[e.id] = {
				feedback: e.feedback,
				time: e.created_at,
				avg: e.avg,
				answer: [],
			};
		}

		for (const a of answers) {
			if (allContents[a.session_id]) {
				allContents[a.session_id].answer.push({
					question_id: a.question_id,
					score: a.score,
				});
			}
		}

		return res.json({ success: true, answer: allContents });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get teacher (peer) evaluation answers
export async function getTeacherAnswers(req, res) {
	try {
		const id = Number(req.body.id);
		const evt = Number(req.body.evt);
		const tcr = Number(req.body.tcr);

		const { rows: evals } = await pool.query(
			"SELECT id, feedback, created_at, avg FROM evaluation_p WHERE id = $1 AND tcr_id = $2 AND evt_id = $3",
			[id, tcr, evt],
		);

		if (!evals || evals.length === 0) {
			return res
				.status(500)
				.json({ success: false, message: "Error at first query" });
		}

		const sessionIds = evals.map((e) => e.id);

		const { rows: answers } = await pool.query(
			"SELECT session_id, question_id, score FROM evaluation_ans_p WHERE session_id = ANY($1::int[])",
			[sessionIds],
		);

		const allContents = {};
		for (const e of evals) {
			allContents[e.id] = {
				feedback: e.feedback,
				time: e.created_at,
				avg: e.avg,
				answer: [],
			};
		}

		for (const a of answers) {
			if (allContents[a.session_id]) {
				allContents[a.session_id].answer.push({
					question_id: a.question_id,
					score: a.score,
				});
			}
		}

		return res.json({ success: true, answer: allContents });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Merge student evaluation answers (averages per question)
export async function mergeStudentAnswers(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id || req.body.tcr);

		const { rows: evals } = await pool.query(
			"SELECT id, created_at, avg, feedback FROM evaluation WHERE tcr_id = $1",
			[tcrId],
		);

		if (!evals || evals.length === 0) {
			return res.json({ success: false, message: "No evaluation found" });
		}

		const sessionIds = evals.map((e) => e.id);

		const { rows: answers } = await pool.query(
			"SELECT session_id, question_id, score FROM evaluation_answer WHERE session_id = ANY($1::int[])",
			[sessionIds],
		);

		// Group scores by question_id
		const grouped = {};
		for (const a of answers) {
			if (!grouped[a.question_id]) grouped[a.question_id] = [];
			grouped[a.question_id].push(Number(a.score));
		}

		const merged = Object.entries(grouped).map(([qid, scores]) => ({
			question_id: String(qid),
			score: scores.reduce((a, b) => a + b, 0) / scores.length,
		}));

		return res.json({ success: true, merged, answer: merged });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Merge teacher evaluation answers
export async function mergeTeacherAnswers(req, res) {
	try {
		const tcrId = Number(req.body.tcr);

		const { rows: evals } = await pool.query(
			"SELECT id, created_at, avg, feedback FROM evaluation_p WHERE tcr_id = $1",
			[tcrId],
		);

		if (!evals || evals.length === 0) {
			return res.json({ success: false, message: "No evaluation found" });
		}

		const sessionIds = evals.map((e) => e.id);

		const { rows: answers } = await pool.query(
			"SELECT session_id, question_id, score FROM evaluation_ans_p WHERE session_id = ANY($1::int[])",
			[sessionIds],
		);

		const grouped = {};
		for (const a of answers) {
			if (!grouped[a.question_id]) grouped[a.question_id] = [];
			grouped[a.question_id].push(Number(a.score));
		}

		const merged = Object.entries(grouped).map(([qid, scores]) => ({
			question_id: String(qid),
			score: scores.reduce((a, b) => a + b, 0) / scores.length,
		}));

		return res.json({
			success: true,
			answer: merged,
			sessions: sessionIds.join(","),
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  View all student evaluations (admin) — grouped by teacher
export async function viewStudentEvaluations(req, res) {
	try {
		const usePaging = Object.prototype.hasOwnProperty.call(req.body, "page");

		if (!usePaging) {
			// Original non-paged behavior (keeps tests expectations)
			const { rows: evals } = await pool.query(
				"SELECT id, tcr_id, evt_id, sentiment, avg FROM evaluation",
			);

			if (!evals || evals.length === 0) {
				return res.json({ success: true, evaluations: [], total: 0 });
			}

			const teacherIds = [...new Set(evals.map((e) => e.tcr_id))];

			const { rows: teachers } = await pool.query(
				`SELECT id, firstname, lastname, quarter, year, subject FROM teachers WHERE id = ANY($1::int[])`,
				[teacherIds],
			);

			const subjectIds = [...new Set(teachers.map((t) => t.subject).filter(Boolean))];
			const { rows: subjects } = await pool.query(
				"SELECT id, subjects FROM subjects WHERE id = ANY($1::int[])",
				[subjectIds],
			);

			const subjectMap = {};
			for (const s of subjects) subjectMap[s.id] = s.subjects;

			const teacherMap = {};
			for (const t of teachers) {
				teacherMap[t.id] = {
					firstname: t.firstname,
					lastname: t.lastname,
					quarter: t.quarter,
					year: t.year,
					subject: subjectMap[t.subject] || null,
				};
			}

			const grouped = {};
			for (const e of evals) {
				if (!grouped[e.tcr_id]) grouped[e.tcr_id] = { eval_count: 0, avg_sum: 0 };
				grouped[e.tcr_id].eval_count += 1;
				grouped[e.tcr_id].avg_sum += Number(e.avg) || 0;
			}

			const evaluations = Object.keys(grouped).map((tid) => {
				const info = grouped[tid];
				const avg_score = info.avg_sum / info.eval_count || 0;
				return {
					teacher_id: Number(tid),
					eval_count: info.eval_count,
					teacher: {
						...teacherMap[Number(tid)],
						sentiment: getSentiment(Number(avg_score) || 0),
					},
				};
			});

			const { rows: countRows } = await pool.query(
				"SELECT COUNT(DISTINCT tcr_id) AS count FROM evaluation",
			);
			const total = Number(countRows[0]?.count) || 0;

			return res.json({ success: true, evaluations, total });
		}

		// Paged behavior continues below
		const page = Math.max(1, Number(req.body.page) || 1);
		const perPage = Math.min(100, Math.max(1, Number(req.body.perPage) || 12));
		const offset = (page - 1) * perPage;

		const { rows: countRows } = await pool.query(
			"SELECT COUNT(DISTINCT tcr_id) AS count FROM evaluation",
		);
		const total = Number(countRows[0]?.count) || 0;
		if (total === 0) {
			return res.json({ success: true, evaluations: [], total: 0 });
		}

		const { rows } = await pool.query(
			`SELECT e.tcr_id AS teacher_id,
	        COUNT(e.id) AS eval_count,
	        AVG(e.avg) AS avg_score,
	        t.firstname,
	        t.lastname,
	        t.quarter,
	        t.year,
	        s.subjects AS subject
	       FROM evaluation e
	       JOIN teachers t ON t.id = e.tcr_id
	       LEFT JOIN subjects s ON s.id = t.subject
	       GROUP BY e.tcr_id, t.firstname, t.lastname, t.quarter, t.year, s.subjects
	       ORDER BY t.lastname, t.firstname
	       LIMIT $1 OFFSET $2`,
			[perPage, offset],
		);

		const evaluations = rows.map((r) => ({
			teacher_id: r.teacher_id,
			eval_count: Number(r.eval_count),
			teacher: {
				firstname: r.firstname,
				lastname: r.lastname,
				quarter: r.quarter,
				year: r.year,
				subject: r.subject || null,
				sentiment: getSentiment(Number(r.avg_score) || 0),
			},
		}));

		return res.json({ success: true, evaluations, total });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  View all teacher (peer) evaluations (admin) — grouped by teacher
export async function viewTeacherEvaluations(req, res) {
	try {
		const usePaging = Object.prototype.hasOwnProperty.call(req.body, "page");

		if (!usePaging) {
			// Original non-paged behavior
			const { rows: evals } = await pool.query(
				"SELECT id, tcr_id, evt_id, sentiment, avg FROM evaluation_p",
			);

			if (!evals || evals.length === 0) {
				return res.json({ success: true, evaluations: [], total: 0 });
			}

			const teacherIds = [...new Set(evals.map((e) => e.tcr_id))];

			const { rows: teachers } = await pool.query(
				`SELECT id, firstname, lastname, quarter, year, subject FROM teachers WHERE id = ANY($1::int[])`,
				[teacherIds],
			);

			const grouped = {};
			for (const e of evals) {
				if (!grouped[e.tcr_id]) grouped[e.tcr_id] = { eval_count: 0, avg_sum: 0 };
				grouped[e.tcr_id].eval_count += 1;
				grouped[e.tcr_id].avg_sum += Number(e.avg) || 0;
			}

			const teacherMap = {};
			for (const t of teachers) {
				teacherMap[t.id] = {
					firstname: t.firstname,
					lastname: t.lastname,
					quarter: t.quarter,
					year: t.year,
					subject: t.subject || null,
				};
			}

			const evaluations = Object.keys(grouped).map((tid) => {
				const info = grouped[tid];
				const avg_score = info.avg_sum / info.eval_count || 0;
				return {
					teacher_id: Number(tid),
					eval_count: info.eval_count,
					teacher: {
						...teacherMap[Number(tid)],
						sentiment: getSentiment(Number(avg_score) || 0),
					},
				};
			});

			const { rows: countRows } = await pool.query(
				"SELECT COUNT(DISTINCT tcr_id) AS count FROM evaluation_p",
			);
			const total = Number(countRows[0]?.count) || 0;

			return res.json({ success: true, evaluations, total });
		}

		// Paged behavior continues below
		const page = Math.max(1, Number(req.body.page) || 1);
		const perPage = Math.min(100, Math.max(1, Number(req.body.perPage) || 12));
		const offset = (page - 1) * perPage;

		const { rows: countRows } = await pool.query(
			"SELECT COUNT(DISTINCT tcr_id) AS count FROM evaluation_p",
		);
		const total = Number(countRows[0]?.count) || 0;
		if (total === 0) {
			return res.json({ success: true, evaluations: [], total: 0 });
		}

		const { rows } = await pool.query(
			`SELECT e.tcr_id AS teacher_id,
	        COUNT(e.id) AS eval_count,
	        AVG(e.avg) AS avg_score,
	        t.firstname,
	        t.lastname,
	        t.quarter,
	        t.year,
	        s.subjects AS subject
	       FROM evaluation_p e
	       JOIN teachers t ON t.id = e.tcr_id
	       LEFT JOIN subjects s ON s.id = t.subject
	       GROUP BY e.tcr_id, t.firstname, t.lastname, t.quarter, t.year, s.subjects
	       ORDER BY t.lastname, t.firstname
	       LIMIT $1 OFFSET $2`,
			[perPage, offset],
		);

		const evaluations = rows.map((r) => ({
			teacher_id: r.teacher_id,
			eval_count: Number(r.eval_count),
			teacher: {
				firstname: r.firstname,
				lastname: r.lastname,
				quarter: r.quarter,
				year: r.year,
				subject: r.subject || null,
				sentiment: getSentiment(Number(r.avg_score) || 0),
			},
		}));

		return res.json({ success: true, evaluations, total });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Chart data  student eval averages
export async function getChartDataStudent(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id);

		const { rows: data } = await pool.query(
			`SELECT h.header, AVG(ea.score) as avg
			 FROM evaluation e
			 JOIN evaluation_answer ea ON ea.session_id = e.id
			 JOIN questions q ON q.id = ea.question_id
			 JOIN headers h ON h.id = q.header_id
			 WHERE e.tcr_id = $1
			 GROUP BY h.id, h.header
			 ORDER BY h.id ASC`,
			[tcrId],
		);

		if (!data || data.length === 0) {
			return res.status(500).json({ success: false, message: "error" });
		}

		const average = data.map((r) => ({ section: r.header, average: Number(r.avg) }));
		return res.json({ success: true, average });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Chart data  teacher eval averages
export async function getChartDataTeacher(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id);

		const { rows: data } = await pool.query(
			`SELECT h.header, AVG(ea.score) as avg
			 FROM evaluation_p e
			 JOIN evaluation_ans_p ea ON ea.session_id = e.id
			 JOIN question_t q ON q.id = ea.question_id
			 JOIN header_t h ON h.id = q.header_id
			 WHERE e.tcr_id = $1
			 GROUP BY h.id, h.header
			 ORDER BY h.id ASC`,
			[tcrId],
		);

		if (!data || data.length === 0) {
			return res.status(500).json({ success: false, message: "error" });
		}

		const average = data.map((r) => ({ section: r.header, average: Number(r.avg) }));
		return res.json({ success: true, average });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  List individual student evaluators for a teacher
export async function listStudentEvaluators(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id);

		const { rows: evals } = await pool.query(
			"SELECT id, evt_id, avg, sentiment, created_at FROM evaluation WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId],
		);

		if (!evals || evals.length === 0) {
			return res.json({ success: true, evaluators: [] });
		}

		const studentIds = [...new Set(evals.map((e) => e.evt_id))];

		const { rows: students } = await pool.query(
			"SELECT id, firstname, lastname, stud_id, section FROM students WHERE id = ANY($1::int[])",
			[studentIds],
		);

		const studentMap = {};
		for (const s of students) {
			studentMap[s.id] = {
				firstname: s.firstname,
				lastname: s.lastname,
				stud_id: s.stud_id,
				section: s.section,
			};
		}

		const evaluators = evals.map((e) => ({
			eval_id: e.id,
			evaluator_id: e.evt_id,
			avg: e.avg,
			sentiment: e.sentiment,
			date: e.created_at,
			evaluator: studentMap[e.evt_id] || {},
		}));

		return res.json({ success: true, evaluators });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  List individual teacher evaluators (peer) for a teacher
export async function listTeacherEvaluators(req, res) {
	try {
		const tcrId = Number(req.body.tcr_id);

		const { rows: evals } = await pool.query(
			"SELECT id, evt_id, avg, sentiment, created_at FROM evaluation_p WHERE tcr_id = $1 ORDER BY created_at DESC",
			[tcrId],
		);

		if (!evals || evals.length === 0) {
			return res.json({ success: true, evaluators: [] });
		}

		const evaluatorIds = [...new Set(evals.map((e) => e.evt_id))];

		// Teacher evaluators are stored by user ID, look up via teachers joined to users
		const { rows: evaluatorTeachers } = await pool.query(
			`SELECT t.firstname, t.lastname, t.usr_id
             FROM teachers t
             WHERE t.usr_id = ANY($1::int[])`,
			[evaluatorIds],
		);

		const userMap = {};
		for (const t of evaluatorTeachers) {
			userMap[t.usr_id] = {
				firstname: t.firstname,
				lastname: t.lastname,
			};
		}

		const evaluators = evals.map((e) => ({
			eval_id: e.id,
			evaluator_id: e.evt_id,
			avg: e.avg,
			sentiment: e.sentiment,
			date: e.created_at,
			evaluator: userMap[e.evt_id] || {},
		}));

		return res.json({ success: true, evaluators });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

// Get the logged in teacher's own evaluations for the score distribution
export async function getMyEvaluations(req, res) {
	try {
		const userId = req.user.user_id;
		const { rows: tRows } = await pool.query("SELECT id FROM teachers WHERE usr_id = $1 LIMIT 1", [userId]);
		
		if (!tRows || tRows.length === 0) {
			return res.json({ success: true, evaluators: [] });
		}
		
		const tcrId = tRows[0].id;

		const { rows: evalsStudent } = await pool.query(
			"SELECT id, avg, sentiment, created_at FROM evaluation WHERE tcr_id = $1",
			[tcrId]
		);
		const { rows: evalsTeacher } = await pool.query(
			"SELECT id, avg, sentiment, created_at FROM evaluation_p WHERE tcr_id = $1",
			[tcrId]
		);

		const allEvals = [
			...evalsStudent.map(e => ({ ...e, type: 'student' })),
			...evalsTeacher.map(e => ({ ...e, type: 'peer' }))
		];

		return res.json({ success: true, evaluators: allEvals });
	} catch (err) {
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}

export async function checkEvalStatus(req, res) {
	try {
		const { teacherId, evaluatorId, type } = req.body;
		if (type === "student") {
			const { rows } = await pool.query(
				"SELECT id FROM evaluation WHERE tcr_id = $1 AND evt_id = $2 LIMIT 1",
				[teacherId, evaluatorId],
			);
			return res.json({ success: true, alreadyEvaluated: rows.length > 0 });
		} else {
			const { rows } = await pool.query(
				"SELECT id FROM evaluation_p WHERE tcr_id = $1 AND evt_id = $2 LIMIT 1",
				[teacherId, evaluatorId],
			);
			return res.json({ success: true, alreadyEvaluated: rows.length > 0 });
		}
	} catch (err) {
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}
