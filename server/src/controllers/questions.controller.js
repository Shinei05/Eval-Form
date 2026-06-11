import pool from "../config/supabase.js";
import mammoth from "mammoth";

// Helper parsing functions

function cleanQuestionText(text) {
	// Replace weird characters, en-dash, em-dash with clean em-dash formatting
	let cleaned = text.replace(/[\uFFFD\u2013\u2014]/g, " — ");
	cleaned = cleaned.replace(/\s+/g, " ");
	cleaned = cleaned.replace(/^\d+[\.\s\-]+\s*/, "");
	return cleaned.trim();
}

function parseTeacherEvaluation(paragraphs) {
	const headers = [];
	let currentHeader = null;
	let currentQuestions = [];

	const ignorePatterns = [
		/^\d+$/,
		/^outstanding$/, /^very satisfactory$/, /^satisfactory$/, /^unsatisfactory$/, /^poor$/,
		/^indicators$/, /^rating$/, /^description$/, /^peer evaluation/i, /^name of/i, /^please rate/i,
		/^rating scale$/i, /^professional feedback$/i, /^feedback$/i, /^indicator/i, /^puntos/i
	];

	for (const p of paragraphs) {
		const trimmed = p.trim();
		if (!trimmed) continue;
		const lower = trimmed.toLowerCase();

		if (ignorePatterns.some(pat => pat.test(lower))) {
			continue;
		}

		const hasDash = /[\u2013\u2014\-]/.test(trimmed);
		const isQuestion = hasDash || (trimmed.length > 50 && (trimmed.endsWith(".") || trimmed.endsWith("?")));

		if (isQuestion) {
			const cleaned = cleanQuestionText(trimmed);
			if (cleaned && currentHeader) {
				currentQuestions.push(cleaned);
			}
		} else {
			if (currentHeader && currentQuestions.length > 0) {
				headers.push({ header: currentHeader, questions: currentQuestions });
			}
			currentHeader = trimmed;
			currentQuestions = [];
		}
	}

	if (currentHeader && currentQuestions.length > 0) {
		headers.push({ header: currentHeader, questions: currentQuestions });
	}

	return headers;
}

function parseStudentEvaluation(paragraphs) {
	let studentStart = 0;
	for (let i = 0; i < paragraphs.length; i++) {
		if (paragraphs[i].toLowerCase().includes("student evaluation tool")) {
			studentStart = i;
			break;
		}
	}

	const studentParas = paragraphs.slice(studentStart);

	const headers = [];
	let currentHeaderParts = [];
	let currentQuestions = [];

	const headerKeywords = [
		{ eng: "expertise of content", fil: "kadalubhasaan sa nilalaman" },
		{ eng: "instructional skillfulness", fil: "kahusayan sa pagtuturo" },
		{ eng: "teaching for independent learning", fil: "pagtuturo ng malayang pagkatuto" },
		{ eng: "administration of learning", fil: "pamamahala sa pagtuturo" },
		{ eng: "flexibility in learning modality", fil: "kakayahang umangkop" },
		{ eng: "classroom management", fil: "pamamahala ng silid-aralan" }
	];

	const ignorePatterns = [
		/^\d+$/, /^very$/i, /^evident$/i, /^palagiang$/i, /^nakikita$/i, /^sometimes$/i,
		/^paminsan-minsang$/i, /^not$/i, /^hindi$/i, /^student evaluation/i, /^pangalan ng/i,
		/^grade/i, /^subject teacher/i, /^rating scale$/i, /^description$/i, /^indicators$/i,
		/^indikeytors$/i, /^ratings$/i, /^puntos$/i, /^karagdagang mensahe/i, /^_____/
	];

	for (const p of studentParas) {
		const trimmed = p.trim();
		if (!trimmed) continue;
		const lower = trimmed.toLowerCase();

		if (ignorePatterns.some(pat => pat.test(lower))) {
			continue;
		}

		let isHeader = false;
		for (const kw of headerKeywords) {
			if (lower.includes(kw.eng) || lower.includes(kw.fil)) {
				isHeader = true;
				break;
			}
		}

		if (isHeader) {
			if (currentHeaderParts.length > 0 && currentQuestions.length > 0) {
				headers.push({
					header: currentHeaderParts.join(" / "),
					questions: currentQuestions
				});
				currentHeaderParts = [];
				currentQuestions = [];
			}
			currentHeaderParts.push(trimmed);
		} else {
			if (trimmed.length > 25 && (trimmed.endsWith(".") || trimmed.endsWith("?"))) {
				const cleaned = cleanQuestionText(trimmed);
				if (cleaned) {
					currentQuestions.push(cleaned);
				}
			}
		}
	}

	if (currentHeaderParts.length > 0 && currentQuestions.length > 0) {
		headers.push({
			header: currentHeaderParts.join(" / "),
			questions: currentQuestions
		});
	}

	return headers;
}

//  Get student questions (active version only) 
export async function getStudentQuestions(req, res) {
	try {
		// Fetch active version
		const { rows: settingRows } = await pool.query(
			"SELECT value FROM questionnaire_settings WHERE key = 'active_student_version'"
		);
		let activeVer = settingRows[0]?.value;

		if (!activeVer) {
			// Fallback to first available non-deleted header's version
			const { rows: fallbackRows } = await pool.query(
				"SELECT identifier FROM headers WHERE is_deleted = false ORDER BY id ASC LIMIT 1"
			);
			activeVer = fallbackRows[0]?.identifier || "v2025";
		}

		const { rows: headers } = await pool.query(
			"SELECT id, header, identifier FROM headers WHERE identifier = $1 AND is_deleted = false ORDER BY id ASC",
			[activeVer]
		);

		if (!headers || headers.length === 0) {
			return res.status(400).json({ success: false, message: "No active student questions found." });
		}

		const headerIds = headers.map((h) => h.id);

		const { rows: questions } = await pool.query(
			"SELECT id, questions, header_id, header_version FROM questions WHERE header_id = ANY($1::int[]) AND header_version = $2 AND is_deleted = false",
			[headerIds, activeVer]
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
			header_ver: activeVer,
			success: true,
			headers: allHeaders,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get student questions for admin (specific version or fallback to active version) 
export async function getStudentQuestionsAll(req, res) {
	try {
		let version = req.body.version;
		if (!version) {
			const { rows: settingRows } = await pool.query(
				"SELECT value FROM questionnaire_settings WHERE key = 'active_student_version'"
			);
			version = settingRows[0]?.value;
			if (!version) {
				const { rows: fallbackRows } = await pool.query(
					"SELECT identifier FROM headers WHERE is_deleted = false ORDER BY id ASC LIMIT 1"
				);
				version = fallbackRows[0]?.identifier || "v2025";
			}
		}

		const { rows: headers } = await pool.query(
			"SELECT id, header, identifier FROM headers WHERE identifier = $1 AND is_deleted = false ORDER BY id ASC",
			[version]
		);

		if (!headers || headers.length === 0) {
			return res.json({
				count: 0,
				header_ver: version,
				success: true,
				headers: [],
			});
		}

		const headerIds = headers.map((h) => h.id);

		const { rows: questions } = await pool.query(
			"SELECT id, questions, header_id, header_version FROM questions WHERE header_id = ANY($1::int[]) AND header_version = $2 AND is_deleted = false",
			[headerIds, version]
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
			header_ver: version,
			success: true,
			headers: allHeaders,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get teacher questions (active version only) 
export async function getTeacherQuestions(req, res) {
	try {
		// Fetch active version
		const { rows: settingRows } = await pool.query(
			"SELECT value FROM questionnaire_settings WHERE key = 'active_teacher_version'"
		);
		let activeVer = settingRows[0]?.value;

		if (!activeVer) {
			// Fallback to first available non-deleted header_t's version
			const { rows: fallbackRows } = await pool.query(
				"SELECT identifier FROM header_t WHERE is_deleted = false ORDER BY id ASC LIMIT 1"
			);
			activeVer = fallbackRows[0]?.identifier || "v2025";
		}

		const { rows: headers } = await pool.query(
			"SELECT id, header FROM header_t WHERE identifier = $1 AND is_deleted = false ORDER BY id ASC",
			[activeVer]
		);

		if (!headers || headers.length === 0) {
			return res
				.status(500)
				.json({ success: false, message: "no headers fetched" });
		}

		const headerIds = headers.map((h) => h.id);

		const { rows: questions } = await pool.query(
			"SELECT id, questions, header_id FROM question_t WHERE header_id = ANY($1::int[]) AND header_version = $2 AND is_deleted = false",
			[headerIds, activeVer]
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
			header_ver: activeVer,
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Get teacher questions for admin (specific version or fallback to active version) 
export async function getTeacherQuestionsAll(req, res) {
	try {
		let version = req.body.version;
		if (!version) {
			const { rows: settingRows } = await pool.query(
				"SELECT value FROM questionnaire_settings WHERE key = 'active_teacher_version'"
			);
			version = settingRows[0]?.value;
			if (!version) {
				const { rows: fallbackRows } = await pool.query(
					"SELECT identifier FROM header_t WHERE is_deleted = false ORDER BY id ASC LIMIT 1"
				);
				version = fallbackRows[0]?.identifier || "v2025";
			}
		}

		const { rows: headers } = await pool.query(
			"SELECT id, header FROM header_t WHERE identifier = $1 AND is_deleted = false ORDER BY id ASC",
			[version]
		);

		if (!headers || headers.length === 0) {
			return res.json({
				count: 0,
				success: true,
				headers: [],
				header_ver: version
			});
		}

		const headerIds = headers.map((h) => h.id);

		const { rows: questions } = await pool.query(
			"SELECT id, questions, header_id FROM question_t WHERE header_id = ANY($1::int[]) AND header_version = $2 AND is_deleted = false",
			[headerIds, version]
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
			header_ver: version
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

		await pool.query("UPDATE questions SET is_deleted = true WHERE id = $1", [id]);

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

		await pool.query("UPDATE question_t SET is_deleted = true WHERE id = $1", [id]);

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

//  Get all versions and the active version for a role 
export async function getQuestionVersions(req, res) {
	try {
		const { type } = req.body;
		if (!type) {
			return res.status(400).json({ success: false, message: "Type (student/teacher) is required" });
		}

		const headerTable = type === "student" ? "headers" : "header_t";

		// Fetch distinct versions
		const { rows: versionRows } = await pool.query(
			`SELECT DISTINCT identifier FROM ${headerTable} WHERE identifier IS NOT NULL AND is_deleted = false ORDER BY identifier ASC`
		);
		const versions = versionRows.map(r => r.identifier);

		// Fetch active version
		const settingKey = type === "student" ? "active_student_version" : "active_teacher_version";
		const { rows: settingRows } = await pool.query(
			"SELECT value FROM questionnaire_settings WHERE key = $1",
			[settingKey]
		);
		let activeVersion = settingRows[0]?.value || null;

		// Fallback if none configured
		if (!activeVersion && versions.length > 0) {
			const { rows: fallbackRows } = await pool.query(
				`SELECT identifier FROM ${headerTable} WHERE is_deleted = false ORDER BY id ASC LIMIT 1`
			);
			activeVersion = fallbackRows[0]?.identifier || null;
		}

		return res.json({
			success: true,
			versions,
			activeVersion
		});
	} catch (err) {
		return res.status(500).json({ success: false, error: err.message });
	}
}

//  Set active version for a role 
export async function setActiveQuestionVersion(req, res) {
	try {
		const { type, version } = req.body;
		if (!type || !version) {
			return res.status(400).json({ success: false, message: "Type and version name are required" });
		}

		const settingKey = type === "student" ? "active_student_version" : "active_teacher_version";
		await pool.query(
			`INSERT INTO questionnaire_settings (key, value) VALUES ($1, $2)
			 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
			[settingKey, version]
		);

		return res.json({ success: true, message: `Active version for ${type} set to ${version}` });
	} catch (err) {
		return res.status(500).json({ success: false, error: err.message });
	}
}

//  Upload and parse Word questionnaire (.docx) 
export async function uploadQuestionsDocx(req, res) {
	try {
		const { type, version } = req.body;
		if (!type || !version) {
			return res.status(400).json({ success: false, message: "Type and version are required" });
		}
		if (!req.file) {
			return res.status(400).json({ success: false, message: "No file uploaded" });
		}

		// Parse docx using mammoth
		const docxBuffer = req.file.buffer;
		const result = await mammoth.extractRawText({ buffer: docxBuffer });
		const paragraphs = result.value.split("\n").map(p => p.trim()).filter(Boolean);

		if (paragraphs.length === 0) {
			return res.status(400).json({ success: false, message: "The uploaded document appears to be empty." });
		}

		// Filter paragraphs based on role
		let startIdx = 0;
		let endIdx = paragraphs.length;
		if (type === "student") {
			const idx = paragraphs.findIndex(p => p.toLowerCase().includes("student evaluation tool"));
			if (idx !== -1) startIdx = idx;
		} else if (type === "teacher") {
			const idx = paragraphs.findIndex(p => p.toLowerCase().includes("student evaluation tool"));
			if (idx !== -1) endIdx = idx;
		}

		const roleParas = paragraphs.slice(startIdx, endIdx);
		let parsedData = [];

		if (type === "student") {
			parsedData = parseStudentEvaluation(roleParas);
		} else {
			parsedData = parseTeacherEvaluation(roleParas);
		}

		if (parsedData.length === 0) {
			return res.status(400).json({ 
				success: false, 
				message: `Could not parse questionnaire. Make sure the file contains appropriate sections for ${type} evaluations.` 
			});
		}

		const headerTable = type === "student" ? "headers" : "header_t";
		const questionTable = type === "student" ? "questions" : "question_t";

		// DB Transaction
		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			// Clear existing of same version (soft delete)
			await client.query(`UPDATE ${headerTable} SET is_deleted = true WHERE identifier = $1`, [version]);
			await client.query(`UPDATE ${questionTable} SET is_deleted = true WHERE header_version = $1`, [version]);

			for (const sec of parsedData) {
				const headerInsert = await client.query(
					`INSERT INTO ${headerTable} (header, identifier) VALUES ($1, $2) RETURNING id`,
					[sec.header, version]
				);
				const headerId = headerInsert.rows[0].id;

				for (const q of sec.questions) {
					await client.query(
						`INSERT INTO ${questionTable} (questions, header_id, header_version) VALUES ($1, $2, $3)`,
						[q, headerId, version]
					);
				}
			}

			// Save active version setting
			const settingKey = type === "student" ? "active_student_version" : "active_teacher_version";
			await client.query(
				`INSERT INTO questionnaire_settings (key, value) VALUES ($1, $2)
				 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
				[settingKey, version]
			);

			await client.query("COMMIT");
		} catch (txErr) {
			await client.query("ROLLBACK");
			throw txErr;
		} finally {
			client.release();
		}

		return res.json({
			success: true,
			message: `Successfully parsed and saved ${type} questions for version ${version}`,
			parsed: parsedData
		});
	} catch (err) {
		console.error("Upload Error:", err.message);
		return res.status(500).json({ success: false, error: err.message });
	}
}
