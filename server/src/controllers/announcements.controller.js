import { pool } from "../config/supabase.js";

// Fetch all announcements for admin (newest first)
export const getAnnouncements = async (req, res, next) => {
	try {
		const result = await pool.query(
			"SELECT * FROM announcements ORDER BY created_at DESC"
		);
		res.json({ success: true, announcements: result.rows });
	} catch (error) {
		next(error);
	}
};

// Fetch feed for user (with read status)
export const getAnnouncementsFeed = async (req, res, next) => {
	try {
		const userId = req.user.user_id || req.user.id;
		
		const query = `
			SELECT 
				a.*,
				CASE WHEN ar.id IS NOT NULL THEN true ELSE false END as is_read
			FROM announcements a
			LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = $1
			ORDER BY a.is_pinned DESC, a.created_at DESC
		`;
		
		const result = await pool.query(query, [userId]);
		res.json({ success: true, announcements: result.rows });
	} catch (error) {
		next(error);
	}
};

// Create a new announcement
export const createAnnouncement = async (req, res, next) => {
	try {
		const { title, content, author_id, category = 'GENERAL', is_pinned = false } = req.body;

		if (!title || !content || !author_id) {
			return res.status(400).json({ success: false, error: "Missing required fields" });
		}

		const result = await pool.query(
			"INSERT INTO announcements (title, content, author_id, category, is_pinned) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[title, content, author_id, category, is_pinned]
		);

		res.json({ success: true, announcement: result.rows[0] });
	} catch (error) {
		next(error);
	}
};

// Delete an announcement
export const deleteAnnouncement = async (req, res, next) => {
	try {
		const { id } = req.params;

		const result = await pool.query(
			"DELETE FROM announcements WHERE id = $1 RETURNING *",
			[id]
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ success: false, error: "Announcement not found" });
		}

		res.json({ success: true, message: "Announcement deleted successfully" });
	} catch (error) {
		next(error);
	}
};

// Update an announcement
export const updateAnnouncement = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, content, category, is_pinned } = req.body;

		if (!title || !content) {
			return res.status(400).json({ success: false, error: "Missing required fields" });
		}

		const result = await pool.query(
			"UPDATE announcements SET title = $1, content = $2, category = COALESCE($3, category), is_pinned = COALESCE($4, is_pinned), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
			[title, content, category, is_pinned, id]
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ success: false, error: "Announcement not found" });
		}

		res.json({ success: true, announcement: result.rows[0] });
	} catch (error) {
		next(error);
	}
};

// Mark an announcement as read
export const markAsRead = async (req, res, next) => {
	try {
		const userId = req.user.user_id || req.user.id;
		const { id } = req.params;

		await pool.query(
			"INSERT INTO announcement_reads (user_id, announcement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			[userId, id]
		);

		res.json({ success: true });
	} catch (error) {
		next(error);
	}
};

// Mark all announcements as read
export const markAllAsRead = async (req, res, next) => {
	try {
		const userId = req.user.user_id || req.user.id;
		
		// Insert a read record for all existing announcements
		const query = `
			INSERT INTO announcement_reads (user_id, announcement_id)
			SELECT $1, id FROM announcements
			ON CONFLICT DO NOTHING
		`;
		
		await pool.query(query, [userId]);
		res.json({ success: true });
	} catch (error) {
		next(error);
	}
};
