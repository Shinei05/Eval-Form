import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { query: vi.fn() },
}));

vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn(() => Promise.resolve("hashed")),
	},
}));

vi.mock("../src/utils/helpers.js", () => ({
	getRandomString: vi.fn(() => "RANDOM10"),
}));

import pool from "../src/config/supabase.js";

import {
	listTeachers,
	listTeachersFaculty,
	getTeacherById,
	createTeacher,
	editTeacher,
	deleteTeacher,
} from "../src/controllers/teachers.controller.js";

describe("teachers controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("listTeachers", () => {
		it("returns active teachers with evaluation status and subjects via student_teacher", async () => {
			// Query 1: teachers via student_teacher
			// Query 2: evaluation WHERE evt_id
			pool.query
				.mockResolvedValueOnce({
					rows: [
						{
							id: 1,
							firstname: "A",
							lastname: "B",
							subject: 10,
							quarter: "Q1",
							year: "2026",
							usr_id: 100,
							email: "a@b.com",
							subject_name: "Math",
						},
					],
					rowCount: 1,
				})
				.mockResolvedValueOnce({ rows: [{ tcr_id: 1 }], rowCount: 1 });

			const req = mockReq({ body: { id: 50 } });
			const res = mockRes();

			await listTeachers(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.teachers).toHaveLength(1);
			expect(res._json.teachers[0].subject).toBe("Math");
			expect(res._json.teachers[0].evaluated).toBe("evaluated");
			expect(res._json.total).toBe(1);
		});

		it("marks teacher as 'not evaluated' when no matching evals", async () => {
			// Query 1: teachers via student_teacher
			// Query 2: evaluation WHERE evt_id
			pool.query
				.mockResolvedValueOnce({
					rows: [
						{
							id: 1,
							firstname: "A",
							lastname: "B",
							subject: null,
							quarter: "Q1",
							year: "2026",
							usr_id: 100,
							email: "a@b.com",
							subject_name: null,
						},
					],
					rowCount: 1,
				})
				.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 50 } });
			const res = mockRes();

			await listTeachers(req, res);

			expect(res._json.teachers[0].evaluated).toBe("not evaluated");
		});
	});

	describe("listTeachersFaculty", () => {
		it("returns peers with subject_id, subjects list, and excludes self", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [
						{
							id: 2,
							firstname: "X",
							lastname: "Y",
							subject: 5,
							quarter: "Q1",
							year: "2026",
							usr_id: 200,
							subject_name: "Science",
						},
						{
							id: 3,
							firstname: "A",
							lastname: "B",
							subject: 5,
							quarter: "Q1",
							year: "2026",
							usr_id: 300,
							subject_name: "Science",
						},
					],
					rowCount: 2,
				})
				.mockResolvedValueOnce({ rows: [{ tcr_id: 3 }], rowCount: 1 });

			// evaluatorId = 200 → teacher with usr_id 200 is excluded
			const req = mockReq({ body: { id: 200 } });
			const res = mockRes();

			await listTeachersFaculty(req, res);

			expect(res._json.success).toBe(true);
			// Self (usr_id 200) should be excluded
			expect(res._json.teachers).toHaveLength(1);
			expect(res._json.teachers[0].firstname).toBe("A");
			expect(res._json.teachers[0].subject_id).toBe(5);
			expect(res._json.teachers[0].evaluated).toBe("evaluated");
			// Subjects list built from ALL teachers (including self)
			expect(res._json.subjects).toEqual([{ id: 5, name: "Science" }]);
		});
	});

	describe("getTeacherById", () => {
		it("returns teacher info with subject name", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{
						firstname: "Ada",
						lastname: "Lovelace",
						subject_name: "Computer Science",
					},
				],
				rowCount: 1,
			});

			const req = mockReq({ body: { id: 1 } });
			const res = mockRes();

			await getTeacherById(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.teacher.firstnm).toBe("Ada");
			expect(res._json.teacher.lastnm).toBe("Lovelace");
			expect(res._json.teacher.sub).toBe("Computer Science");
			expect(res._json.month).toBeDefined();
		});

		it("returns 400 when teacher not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 999 } });
			const res = mockRes();

			await getTeacherById(req, res);

			expect(res._status).toBe(400);
		});
	});

	describe("editTeacher", () => {
		it("updates teacher fields", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: {
					id: 1,
					fn: "New",
					ln: "Name",
					sub: 3,
					qrt: "Q2",
					yr: "2026",
				},
			});
			const res = mockRes();

			await editTeacher(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 500 on update error", async () => {
			pool.query.mockRejectedValueOnce(new Error("update failed"));

			const req = mockReq({
				body: { id: 1, fn: "X", ln: "Y", sub: 1, qrt: "Q1", yr: "26" },
			});
			const res = mockRes();

			await editTeacher(req, res);

			expect(res._status).toBe(500);
		});
	});

	describe("deleteTeacher", () => {
		it("deletes teacher by id", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { id: 1 } });
			const res = mockRes();

			await deleteTeacher(req, res);

			expect(res._json.success).toBe(true);
		});
	});
});
