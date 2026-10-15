import pool from "../config/supabase.js";

const forbidden = (res) => res.status(403).json({ success: false, error: "Forbidden" });

/** Ensure a student record in the request belongs to the signed-in user. */
export function requireStudentOwner(field) {
	return async (req, res, next) => {
		const studentId = Number(req.body?.[field]);
		if (!Number.isSafeInteger(studentId) || studentId < 1) return forbidden(res);

		try {
			const { rows } = await pool.query(
				"SELECT id FROM students WHERE id = $1 AND usr_id = $2 LIMIT 1",
				[studentId, req.user.user_id],
			);
			return rows.length ? next() : forbidden(res);
		} catch (error) {
			return next(error);
		}
	};
}

/** Peer evaluation IDs refer to the evaluator's user ID. */
export function requireSelfUserId(field, { allowAdmin = false } = {}) {
	return (req, res, next) => {
		if (allowAdmin && req.user.role === "admin") return next();
		const userId = Number(req.body?.[field]);
		return Number.isSafeInteger(userId) && userId === Number(req.user.user_id)
			? next()
			: forbidden(res);
	};
}

export async function requireEvaluationOwner(req, res, next) {
	const { type, evaluatorId } = req.body || {};
	if (type === "teacher" && req.user.role === "teacher") {
		return requireSelfUserId("evaluatorId")(req, res, next);
	}
	if (type === "student" && req.user.role === "student") {
		return requireStudentOwner("evaluatorId")(req, res, next);
	}
	return forbidden(res);
}
