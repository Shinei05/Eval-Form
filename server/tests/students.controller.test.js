import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { query: vi.fn() },
}));

import pool from "../src/config/supabase.js";

import {
	getStudentById,
	getEvaluatorById,
} from "../src/controllers/students.controller.js";

describe("students controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ───────────────────────────── getStudentById ───────────────────────────

	describe("getStudentById", () => {
		it("returns student with dual field names and teacher info", async () => {
			const studentRow = {
				id: 10,
				firstname: "John",
				lastname: "Doe",
				stud_id: 12345,
				grade: "10",
				section: "A",
				teacher: 5,
			};
			const teacherRow = {
				id: 5,
				firstname: "Jane",
				lastname: "Smith",
			};

			pool.query
				.mockResolvedValueOnce({ rows: [studentRow], rowCount: 1 })
				.mockResolvedValueOnce({ rows: [teacherRow], rowCount: 1 });

			const req = mockReq({ body: { id: 10 } });
			const res = mockRes();

			await getStudentById(req, res);

			expect(res._json.success).toBe(true);
			// Dual field names
			expect(res._json.student.firstname).toBe("John");
			expect(res._json.student.firstnm).toBe("John");
			expect(res._json.student.lastname).toBe("Doe");
			expect(res._json.student.lastnm).toBe("Doe");
			expect(res._json.student.stid).toBe(12345);
			expect(res._json.student.studid).toBe(12345);
			expect(res._json.student.teacher).toBe("Jane Smith");
			expect(res._json.month).toBeDefined();
		});

		it("accepts evt field as alias for id", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{
						id: 10,
						firstname: "A",
						lastname: "B",
						stud_id: 1,
						grade: "9",
						section: "B",
						teacher: null,
					},
				],
				rowCount: 1,
			});

			const req = mockReq({ body: { evt: 10 } });
			const res = mockRes();

			await getStudentById(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.student.teacher).toBeNull();
		});

		it("returns 400 when student not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 999 } });
			const res = mockRes();

			await getStudentById(req, res);

			expect(res._status).toBe(400);
			expect(res._json.message).toBe("Student not found");
		});
	});

	// ───────────────────────────── getEvaluatorById ─────────────────────────

	describe("getEvaluatorById", () => {
		it("returns both teacher and student keys with dual field names", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{
						id: 5,
						firstname: "Maria",
						lastname: "Garcia",
					},
				],
				rowCount: 1,
			});

			const req = mockReq({ body: { id: 5 } });
			const res = mockRes();

			await getEvaluatorById(req, res);

			expect(res._json.success).toBe(true);
			// Both keys present
			expect(res._json.teacher).toBeDefined();
			expect(res._json.student).toBeDefined();
			// Dual field names
			expect(res._json.teacher.firstname).toBe("Maria");
			expect(res._json.teacher.firstnm).toBe("Maria");
			expect(res._json.student.lastname).toBe("Garcia");
			expect(res._json.student.lastnm).toBe("Garcia");
			expect(res._json.month).toBeDefined();
		});

		it("accepts evt as alias for id", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 5, firstname: "X", lastname: "Y" }],
				rowCount: 1,
			});

			const req = mockReq({ body: { evt: 5 } });
			const res = mockRes();

			await getEvaluatorById(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 400 when teacher not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 999 } });
			const res = mockRes();

			await getEvaluatorById(req, res);

			expect(res._status).toBe(400);
		});
	});
});
