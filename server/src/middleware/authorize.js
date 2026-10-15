import pool from "../config/supabase.js";

/** Check a signed-in user's current role against the database. */
export function requireRole(...allowedRoles) {
	return async (req, res, next) => {
		if (!req.user?.user_id) {
			return res.status(401).json({ success: false, error: "Unauthorized" });
		}

		try {
			const { rows } = await pool.query(
				"SELECT is_admin, is_teacher FROM users WHERE id = $1 AND is_deleted = false LIMIT 1",
				[req.user.user_id],
			);
			const user = rows[0];
			if (!user) {
				return res.status(401).json({ success: false, error: "Unauthorized" });
			}

			const role = user.is_admin ? "admin" : user.is_teacher ? "teacher" : "student";
			if (!allowedRoles.includes(role)) {
				return res.status(403).json({ success: false, error: "Forbidden" });
			}

			req.user.role = role;
			return next();
		} catch (error) {
			return next(error);
		}
	};
}
