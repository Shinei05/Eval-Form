import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

// Mock supabase before importing any controller
vi.mock("../src/config/supabase.js", () => {
	return {
		default: { query: vi.fn() },
	};
});

// Mock bcrypt
vi.mock("bcryptjs", () => ({
	default: {
		compare: vi.fn(),
		hash: vi.fn(),
	},
}));

// Mock helpers & email
vi.mock("../src/utils/helpers.js", () => ({
	getRandomString: vi.fn(() => "TESTRANDOM"),
}));

vi.mock("../src/utils/email.js", () => ({
	sendEmail: vi.fn(() => Promise.resolve(true)),
}));

import pool from "../src/config/supabase.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../src/utils/email.js";

import {
	loginStudent,
	loginTeacher,
	loginAdmin,
	register,
	resetPassword,
	verifyResetCode,
	changePassword,
	emailVerifyCode,
	emailVerifySend,
	verificationCheck,
} from "../src/controllers/auth.controller.js";

describe("auth controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ───────────────────────────── loginStudent ─────────────────────────────

	describe("loginStudent", () => {
		it("returns token and userData on successful login", async () => {
			const userRow = { id: 1, email: "s@test.com", password: "hashed" };
			const studentRow = {
				id: 10,
				firstname: "John",
				lastname: "Doe",
				grade: "10",
				section: "A",
				stud_id: 12345,
			};

			pool.query
				.mockResolvedValueOnce({ rows: [userRow], rowCount: 1 })
				.mockResolvedValueOnce({ rows: [studentRow], rowCount: 1 });

			bcrypt.compare.mockResolvedValue(true);

			const req = mockReq({
				body: { email: "s@test.com", password: "pass123" },
			});
			const res = mockRes();

			await loginStudent(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.token).toBeDefined();
			expect(res._json.userData.email).toBe("s@test.com");
			expect(res._json.userData.fullname).toBe("John");
			expect(res._json.userData.lastname).toBe("Doe");
		});

		it("returns 400 when email not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({
				body: { email: "bad@test.com", password: "x" },
			});
			const res = mockRes();

			await loginStudent(req, res);

			expect(res._status).toBe(400);
			expect(res._json.error).toBe("Email not found");
		});

		it("returns 400 when password is wrong", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 1, email: "a@b.com", password: "h" }],
				rowCount: 1,
			});
			bcrypt.compare.mockResolvedValue(false);

			const req = mockReq({
				body: { email: "a@b.com", password: "wrong" },
			});
			const res = mockRes();

			await loginStudent(req, res);

			expect(res._status).toBe(400);
			expect(res._json.error).toBe("Password error");
		});
	});

	// ───────────────────────────── loginTeacher ─────────────────────────────

	describe("loginTeacher", () => {
		it("returns token and userData on successful login", async () => {
			const userRow = { id: 2, email: "t@test.com", password: "hashed" };
			const teacherRow = {
				id: 20,
				firstname: "Jane",
				lastname: "Smith",
				subject: 1,
				quarter: "Q1",
				year: "2026",
			};

			pool.query
				.mockResolvedValueOnce({ rows: [userRow], rowCount: 1 })
				.mockResolvedValueOnce({ rows: [teacherRow], rowCount: 1 });
			bcrypt.compare.mockResolvedValue(true);

			const req = mockReq({
				body: { email: "t@test.com", password: "pass" },
			});
			const res = mockRes();

			await loginTeacher(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.token).toBeDefined();
			expect(res._json.userData.fullname).toBe("Jane");
		});

		it("returns 400 when teacher record not found", async () => {
			const userRow = { id: 2, email: "t@test.com", password: "h" };

			pool.query
				.mockResolvedValueOnce({ rows: [userRow], rowCount: 1 })
				.mockResolvedValueOnce({ rows: [], rowCount: 0 });
			bcrypt.compare.mockResolvedValue(true);

			const req = mockReq({
				body: { email: "t@test.com", password: "pass" },
			});
			const res = mockRes();

			await loginTeacher(req, res);

			expect(res._status).toBe(400);
			expect(res._json.error).toBe("Teacher record not found");
		});
	});

	// ───────────────────────────── loginAdmin ───────────────────────────────

	describe("loginAdmin", () => {
		it("returns token and admin userData on success", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [{ id: 3, email: "a@t.com", password: "h" }],
					rowCount: 1,
				})
				.mockResolvedValueOnce({
					rows: [{ id: 30, firstname: "Admin", lastname: "User" }],
					rowCount: 1,
				});
			bcrypt.compare.mockResolvedValue(true);

			const req = mockReq({
				body: { email: "a@t.com", password: "admin" },
			});
			const res = mockRes();

			await loginAdmin(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.userData.fullname).toBe("Admin");
		});
	});

	// ───────────────────────────── register ─────────────────────────────────

	describe("register", () => {
		it("returns 403 because student registration is disabled", async () => {
			const req = mockReq({
				body: {
					email: "new@test.com",
					password: "abc",
					conpass: "abc",
					fn: "New",
					ln: "Student",
					id: 999,
				},
			});
			const res = mockRes();

			await register(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res._json.success).toBe(false);
			expect(res._json.error).toBe("Registration is disabled");
		});
	});

	// ───────────────────────────── resetPassword ────────────────────────────

	describe("resetPassword", () => {
		it("sends reset email on success", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ reset: "ABC123" }],
				rowCount: 1,
			});

			const req = mockReq({ body: { email: "u@test.com" } });
			const res = mockRes();

			await resetPassword(req, res);

			expect(sendEmail).toHaveBeenCalledOnce();
			expect(res._json.success).toBe(true);
		});

		it("returns 400 when email not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { email: "bad@test.com" } });
			const res = mockRes();

			await resetPassword(req, res);

			expect(res._status).toBe(400);
		});

		it("returns 500 when email send fails", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ reset: "CODE" }],
				rowCount: 1,
			});
			sendEmail.mockResolvedValueOnce(false);

			const req = mockReq({ body: { email: "u@test.com" } });
			const res = mockRes();

			await resetPassword(req, res);

			expect(res._status).toBe(500);
		});
	});

	// ───────────────────────────── verifyResetCode ──────────────────────────

	describe("verifyResetCode", () => {
		it("returns success when code matches", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 1 }],
				rowCount: 1,
			});

			const req = mockReq({
				body: { email: "u@test.com", code: "ABC" },
			});
			const res = mockRes();

			await verifyResetCode(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 400 when code doesn't match", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({
				body: { email: "u@test.com", code: "WRONG" },
			});
			const res = mockRes();

			await verifyResetCode(req, res);

			expect(res._status).toBe(400);
		});
	});

	// ───────────────────────────── changePassword ───────────────────────────

	describe("changePassword", () => {
		it("changes password successfully", async () => {
			bcrypt.hash.mockResolvedValue("new-hash");
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: {
					passwordss: "newpass",
					conpassword: "newpass",
					email: "u@t.com",
				},
			});
			const res = mockRes();

			await changePassword(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 400 when passwords don't match", async () => {
			const req = mockReq({
				body: {
					passwordss: "a",
					conpassword: "b",
					email: "u@t.com",
				},
			});
			const res = mockRes();

			await changePassword(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res._json.message).toBe("Password mismatched");
		});
	});

	// ───────────────────────────── emailVerifyCode ──────────────────────────

	describe("emailVerifyCode", () => {
		it("verifies and marks user as verified", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // SELECT verify_code match
				.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE is_verified

			const req = mockReq({
				body: { email: "u@t.com", code: "VERIFY" },
			});
			const res = mockRes();

			await emailVerifyCode(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 500 when code is wrong", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { email: "u@t.com", code: "BAD" } });
			const res = mockRes();

			await emailVerifyCode(req, res);

			expect(res._status).toBe(500);
		});
	});

	// ───────────────────────────── emailVerifySend ──────────────────────────

	describe("emailVerifySend", () => {
		it("sends verification email", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ verify_code: "VCODE" }],
				rowCount: 1,
			});

			const req = mockReq({ body: { email: "u@t.com" } });
			const res = mockRes();

			await emailVerifySend(req, res);

			expect(sendEmail).toHaveBeenCalledOnce();
			expect(res._json.success).toBe(true);
		});

		it("returns 400 when user not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { email: "bad@t.com" } });
			const res = mockRes();

			await emailVerifySend(req, res);

			expect(res._status).toBe(400);
		});
	});

	// ───────────────────────────── verificationCheck ────────────────────────

	describe("verificationCheck", () => {
		it("returns verified status", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ is_verified: true }],
				rowCount: 1,
			});

			const req = mockReq({ body: { email: "u@t.com" } });
			const res = mockRes();

			await verificationCheck(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.verified).toBe(true);
		});

		it("returns 500 when user not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { email: "bad@t.com" } });
			const res = mockRes();

			await verificationCheck(req, res);

			expect(res._status).toBe(500);
		});
	});
});
