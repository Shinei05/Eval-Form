import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/supabase.js";
import { getRandomString, getCurrentPeriod } from "../utils/helpers.js";
import { sendEmail } from "../utils/email.js";

const JWT_SECRET = process.env.JWT_SECRET || "eval";
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN) || 3600;

//  Fetch current user profile
export async function getProfile(req, res) {
	try {
		const userId = req.user?.user_id;
		if (!userId) {
			return res
				.status(401)
				.json({ success: false, error: "Unauthorized" });
		}

		const { rows: userRows } = await pool.query(
			"SELECT id, email, is_admin, is_teacher, is_verified FROM users WHERE id = $1 AND is_deleted = false LIMIT 1",
			[userId],
		);
		const user = userRows[0];
		if (!user) {
			return res
				.status(404)
				.json({ success: false, error: "User not found" });
		}

		let role = "Student";
		let firstname = "";
		let lastname = "";
		let studentId = null;
		let teacherId = null;
		let subject = null;
		let quarter = null;
		let year = null;

		if (user.is_admin) {
			role = "Admin";
			const { rows } = await pool.query(
				"SELECT id, firstname, lastname, subject, quarter, year FROM teachers WHERE usr_id = $1 LIMIT 1",
				[user.id],
			);
			const admin = rows[0];
			if (admin) {
				teacherId = admin.id;
				firstname = admin.firstname || "";
				lastname = admin.lastname || "";
				subject = admin.subject || null;
				quarter = admin.quarter || null;
				year = admin.year || null;
			}
		} else if (user.is_teacher) {
			role = "Teacher";
			const { rows } = await pool.query(
				"SELECT id, firstname, lastname, subject, quarter, year FROM teachers WHERE usr_id = $1 LIMIT 1",
				[user.id],
			);
			const teacher = rows[0];
			if (!teacher) {
				return res
					.status(404)
					.json({ success: false, error: "Teacher record not found" });
			}
			teacherId = teacher.id;
			firstname = teacher.firstname || "";
			lastname = teacher.lastname || "";
			subject = teacher.subject || null;
			quarter = teacher.quarter || null;
			year = teacher.year || null;
		} else {
			const { rows } = await pool.query(
				"SELECT id, firstname, lastname, grade, section FROM students WHERE usr_id = $1 LIMIT 1",
				[user.id],
			);
			const student = rows[0];
			if (!student) {
				return res
					.status(404)
					.json({ success: false, error: "Student record not found" });
			}
			studentId = student.id;
			firstname = student.firstname || "";
			lastname = student.lastname || "";
		}

		const fullname = `${firstname} ${lastname}`.trim();

		return res.json({
			success: true,
			profile: {
				userId: user.id,
				email: user.email,
				role,
				firstname,
				lastname,
				fullname,
				studentId,
				teacherId,
				subject,
				quarter,
				year,
				isVerified: user.is_verified,
			},
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Student login
export async function loginStudent(req, res) {
	try {
		const email = req.body.email || req.body.id;
		const password = req.body.password || req.body.ps;

		const { rows: userRows } = await pool.query(
			"SELECT id, email, password, is_verified FROM users WHERE email = $1 AND is_deleted = false LIMIT 1",
			[email],
		);
		const user = userRows[0];

		if (!user) {
			return res
				.status(400)
				.json({ success: false, error: "Email not found" });
		}

		// Verify password first
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res
				.status(400)
				.json({ success: false, error: "Password error" });
		}

		// Then check if an evaluation period is active
		const { rows: schedRows } = await pool.query(
			"SELECT * FROM schedules WHERE is_deleted = false ORDER BY id DESC LIMIT 1",
		);
		const activePeriod = getCurrentPeriod(schedRows[0]);
		if (!activePeriod) {
			return res.json({ success: true, scheduleClosed: true });
		}

		const { rows: stRows } = await pool.query(
			"SELECT id, firstname, lastname, grade, section, stud_id FROM students WHERE usr_id = $1 LIMIT 1",
			[user.id],
		);
		const student = stRows[0];

		if (!student) {
			return res
				.status(400)
				.json({ success: false, error: "Student record not found" });
		}

		const token = jwt.sign(
			{
				user_id: user.id,
				email: user.email,
				iat: Math.floor(Date.now() / 1000),
			},
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN },
		);

		return res.json({
			success: true,
			token,
			userData: {
				id: student.id,
				email: user.email,
				firstname: student.firstname,
				lastname: student.lastname,
				fullname: `${student.firstname} ${student.lastname}`.trim(),
				grade: student.grade,
				section: student.section,
				isVerified: user.is_verified,
			},
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Teacher login
export async function loginTeacher(req, res) {
	try {
		const email = req.body.email || req.body.id;
		const password = req.body.password || req.body.ps;

		const { rows: userRows } = await pool.query(
			"SELECT id, email, password, is_verified FROM users WHERE email = $1 AND is_teacher = true AND is_deleted = false LIMIT 1",
			[email],
		);
		const user = userRows[0];

		if (!user) {
			return res
				.status(400)
				.json({ success: false, error: "Email not found" });
		}

		// Verify password first
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res
				.status(400)
				.json({ success: false, error: "Password error" });
		}

		// Then check if an evaluation period is active
		const { rows: schedRows } = await pool.query(
			"SELECT * FROM schedules WHERE is_deleted = false ORDER BY id DESC LIMIT 1",
		);
		const activePeriod = getCurrentPeriod(schedRows[0]);
		if (!activePeriod) {
			return res.json({ success: true, scheduleClosed: true });
		}

		const { rows: tRows } = await pool.query(
			"SELECT id, firstname, lastname, subject, quarter, year FROM teachers WHERE usr_id = $1 LIMIT 1",
			[user.id],
		);
		const teacher = tRows[0];

		if (!teacher) {
			return res
				.status(400)
				.json({ success: false, error: "Teacher record not found" });
		}

		const token = jwt.sign(
			{
				user_id: user.id,
				email: user.email,
				iat: Math.floor(Date.now() / 1000),
			},
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN },
		);

		return res.json({
			success: true,
			token,
			userData: {
				id: user.id,
				email: user.email,
				firstname: teacher.firstname,
				lastname: teacher.lastname,
				fullname: `${teacher.firstname} ${teacher.lastname}`.trim(),
				subject: teacher.subject,
				quarter: teacher.quarter,
				year: teacher.year,
				isVerified: user.is_verified,
			},
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Admin login
export async function loginAdmin(req, res) {
	try {
		const email = req.body.email || req.body.id;
		const password = req.body.password || req.body.ps;

		const { rows: userRows } = await pool.query(
			"SELECT id, email, password, is_verified FROM users WHERE email = $1 AND is_admin = true AND is_deleted = false LIMIT 1",
			[email],
		);
		const user = userRows[0];

		if (!user) {
			return res
				.status(400)
				.json({ success: false, error: "Email not found" });
		}

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res
				.status(400)
				.json({ success: false, error: "Password error" });
		}

		const { rows: tRows } = await pool.query(
			"SELECT id, firstname, lastname FROM teachers WHERE usr_id = $1 LIMIT 1",
			[user.id],
		);
		const teacher = tRows[0];

		if (!teacher) {
			return res
				.status(400)
				.json({ success: false, error: "Admin record not found" });
		}

		const token = jwt.sign(
			{
				user_id: user.id,
				email: user.email,
				iat: Math.floor(Date.now() / 1000),
			},
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN },
		);

		return res.json({
			success: true,
			token,
			userData: {
				id: user.id,
				email: user.email,
				firstname: teacher.firstname,
				lastname: teacher.lastname,
				fullname: `${teacher.firstname} ${teacher.lastname}`.trim(),
				isVerified: user.is_verified,
			},
		});
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Register student (Disabled)
export async function register(req, res) {
	return res.status(403).json({
		success: false,
		error: "Registration is disabled",
		message: "Student registration has been disabled."
	});
}

//  Reset password  send code via email
export async function resetPassword(req, res) {
	try {
		const { email } = req.body;

		const { rows } = await pool.query(
			"SELECT reset FROM users WHERE email = $1 LIMIT 1",
			[email],
		);
		const user = rows[0];

		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "Email not found" });
		}

		const code = user.reset;
		const html = `
    <center style="font-family: Arial, sans-serif; background: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; text-align: center;">
        <br>
        <h2 style="color: #2d3748; font-size: 22px; margin-bottom: 25px; font-weight: 600;">Enter this code to reset your password</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px solid #e2e8f0; display: inline-block;">
          <h1 style="color: #2d3748; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
            ${code}
          </h1>
        </div>
        <br>
        <p style="color: #e53e3e; font-size: 16px; font-weight: bold; background: #fed7d7; padding: 12px 20px; border-radius: 8px; border: 1px solid #e53e3e; display: inline-block;">
           Do not share this code with anyone
        </p>
        <div style="margin-top: 30px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="color: #4a5568; font-size: 14px; margin: 5px 0;">If you didn't request this, please ignore this message</p>
        </div>
      </div>
    </center>`;
		const text = "Enter this code to reset your password: " + code;

		const sent = await sendEmail(email, html, text);
		if (!sent) {
			return res
				.status(500)
				.json({ success: false, message: "Failed to send email" });
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Verify reset code
export async function verifyResetCode(req, res) {
	try {
		const { email, code } = req.body;

		const { rows } = await pool.query(
			"SELECT id FROM users WHERE email = $1 AND reset = $2 LIMIT 1",
			[email, code],
		);

		if (rows.length === 0) {
			return res.status(400).json({ success: false });
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Change password
export async function changePassword(req, res) {
	try {
		const { passwordss, conpassword, email } = req.body;

		if (passwordss !== conpassword) {
			return res
				.status(400)
				.json({ success: false, message: "Password mismatched" });
		}

		const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-+=<>?]).{8,}$/;
		if (!passwordRegex.test(passwordss)) {
			return res.status(400).json({ success: false, error: "Password must be at least 8 characters long and include numbers and symbols." });
		}

		const hash = await bcrypt.hash(passwordss, 10);
		const newCode = getRandomString(10);

		const { rowCount } = await pool.query(
			"UPDATE users SET password = $1, reset = $2, is_verified = true WHERE email = $3",
			[hash, newCode, email],
		);

		if (rowCount === 0) {
			return res
				.status(500)
				.json({ success: false, error: "User not found" });
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

// Update password (with current password verification)
export async function updatePassword(req, res) {
	try {
		const { email, currentPassword, newPassword, confirmPassword } = req.body;

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ success: false, error: "Passwords do not match." });
		}

		const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-+=<>?]).{8,}$/;
		if (!passwordRegex.test(newPassword)) {
			return res.status(400).json({ success: false, error: "Password must be at least 8 characters long and include numbers and symbols." });
		}

		const { rows } = await pool.query(
			"SELECT id, password FROM users WHERE email = $1 LIMIT 1",
			[email]
		);
		const user = rows[0];

		if (!user) {
			return res.status(400).json({ success: false, error: "User not found." });
		}

		const valid = await bcrypt.compare(currentPassword, user.password);
		if (!valid) {
			return res.status(400).json({ success: false, error: "Current password is incorrect." });
		}

		const hash = await bcrypt.hash(newPassword, 10);

		await pool.query("UPDATE users SET password = $1, is_verified = true WHERE id = $2", [hash, user.id]);

		return res.json({ success: true, message: "Password updated successfully." });
	} catch (err) {
		return res.status(500).json({ success: false, error: "Internal server error" });
	}
}

//  Email verify  check code & mark verified
export async function emailVerifyCode(req, res) {
	try {
		const { email, code } = req.body;

		const { rows } = await pool.query(
			"SELECT id FROM users WHERE email = $1 AND verify_code = $2 LIMIT 1",
			[email, code],
		);

		if (rows.length === 0) {
			return res.status(500).json({ success: false, message: "Error" });
		}

		const { rowCount } = await pool.query(
			"UPDATE users SET is_verified = true WHERE email = $1",
			[email],
		);

		if (rowCount === 0) {
			return res.status(500).json({ success: false, message: "Error" });
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Email verify  send verification code via SMTP
export async function emailVerifySend(req, res) {
	try {
		const { email } = req.body;

		const { rows } = await pool.query(
			"SELECT verify_code FROM users WHERE email = $1 LIMIT 1",
			[email],
		);
		const user = rows[0];

		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}

		const code = user.verify_code;
		const html = `
    <center style="font-family: Arial, sans-serif; background: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; text-align: center;">
        <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 30px; font-weight: 600; line-height: 1.4;">
          Enter this code to verify that the Email you provided is yours.
        </h1>
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border: 2px solid #e2e8f0; display: inline-block;">
          <h1 style="color: #2d3748; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">
            ${code}
          </h1>
        </div>
        <br>
        <p style="color: #e53e3e; font-size: 16px; font-weight: bold; background: #fed7d7; padding: 15px 25px; border-radius: 8px; border: 1px solid #e53e3e; display: inline-block;">
           Do not share this code with anyone
        </p>
        <br>
        <div style="margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="color: #4a5568; font-size: 14px; margin: 8px 0;">If you didn't request this, please ignore this message</p>
        </div>
      </div>
    </center>`;
		const text = "Enter this code to verify your account: " + code;

		const sent = await sendEmail(email, html, text);
		if (!sent) {
			return res.status(500).json({ success: false, message: "error" });
		}

		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}

//  Check if user is verified
export async function verificationCheck(req, res) {
	try {
		const { email } = req.body;

		const { rows } = await pool.query(
			"SELECT is_verified FROM users WHERE email = $1 LIMIT 1",
			[email],
		);
		const data = rows[0];

		if (!data) {
			return res.status(500).json({ success: false, message: "error" });
		}

		return res.json({ success: true, verified: data.is_verified });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false, error: "Internal server error" });
	}
}
