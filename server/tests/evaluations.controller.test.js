import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { query: vi.fn() },
}));

vi.mock("../src/utils/helpers.js", () => ({
	getRandomString: vi.fn(() => "RAND123456"),
	getSentiment: vi.fn(() => "Good"),
}));

import pool from "../src/config/supabase.js";

import {
	submitStudent,
	submitTeacher,
	getStudentAnswers,
	getTeacherAnswers,
	mergeStudentAnswers,
	mergeTeacherAnswers,
	viewStudentEvaluations,
	viewTeacherEvaluations,
	getChartDataStudent,
	getChartDataTeacher,
} from "../src/controllers/evaluations.controller.js";

describe("evaluations controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ────────────────────── submitStudent ──────────────────────

	describe("submitStudent", () => {
		it("inserts evaluation and answers", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check duplicate (none)
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // check relationship (exists)
				.mockResolvedValueOnce({ rows: [{ id: 100 }], rowCount: 1 }) // insert evaluation
				.mockResolvedValueOnce({ rows: [], rowCount: 2 }); // batch insert answers

			const req = mockReq({
				body: {
					id: 1,
					stid: 10,
					feedback: "Great teacher",
					answers: { 1: 5, 2: 4 },
				},
			});
			const res = mockRes();

			await submitStudent(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 403 when student is not assigned to the teacher", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check duplicate (none)
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // check relationship (does not exist)

			const req = mockReq({
				body: {
					id: 1,
					stid: 10,
					feedback: "Great teacher",
					answers: { 1: 5, 2: 4 },
				},
			});
			const res = mockRes();

			await submitStudent(req, res);

			expect(res._status).toBe(403);
			expect(res._json.success).toBe(false);
			expect(res._json.error).toContain("not assigned to this teacher");
		});

		it("returns 500 when evaluation insert fails", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check duplicate (none)
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // check relationship (exists)
				.mockRejectedValueOnce(new Error("insert failed")); // insert evaluation fails

			const req = mockReq({
				body: { id: 1, stid: 10, feedback: "", answers: { 1: 3 } },
			});
			const res = mockRes();

			await submitStudent(req, res);

			expect(res._status).toBe(500);
			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── submitTeacher ──────────────────────

	describe("submitTeacher", () => {
		it("inserts peer evaluation and answers", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [{ id: 200 }], rowCount: 1 }) // insert evaluation_p
				.mockResolvedValueOnce({ rows: [], rowCount: 2 }); // batch insert answers

			const req = mockReq({
				body: {
					id: 2,
					stid: 20,
					feedback: "Good colleague",
					answers: { 1: 4, 2: 5 },
				},
			});
			const res = mockRes();

			await submitTeacher(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 500 when answer insert fails", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [{ id: 200 }], rowCount: 1 }) // insert eval ok
				.mockRejectedValueOnce(new Error("answer insert failed")); // answers fail

			const req = mockReq({
				body: { id: 2, stid: 20, feedback: "", answers: { 1: 3 } },
			});
			const res = mockRes();

			await submitTeacher(req, res);

			expect(res._status).toBe(500);
		});
	});

	// ────────────────────── getStudentAnswers ──────────────────

	describe("getStudentAnswers", () => {
		it("returns grouped evaluation answers by session", async () => {
			const evals = [
				{ id: 1, feedback: "Good", created_at: "2026-01-01", avg: 4 },
			];
			const answers = [
				{ session_id: 1, question_id: 10, score: 4 },
				{ session_id: 1, question_id: 11, score: 5 },
			];

			pool.query
				.mockResolvedValueOnce({ rows: evals, rowCount: 1 })
				.mockResolvedValueOnce({ rows: answers, rowCount: 2 });

			const req = mockReq({ body: { id: 1, evt: 10, tcr: 1 } });
			const res = mockRes();

			await getStudentAnswers(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.answer["1"]).toBeDefined();
			expect(res._json.answer["1"].answer).toHaveLength(2);
		});

		it("returns failure when no evaluations found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 99, evt: 10, tcr: 1 } });
			const res = mockRes();

			await getStudentAnswers(req, res);

			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── getTeacherAnswers ─────────────────

	describe("getTeacherAnswers", () => {
		it("returns grouped peer evaluation answers", async () => {
			const evals = [
				{ id: 5, feedback: "Nice", created_at: "2026-02", avg: 3.5 },
			];
			const answers = [{ session_id: 5, question_id: 1, score: 4 }];

			pool.query
				.mockResolvedValueOnce({ rows: evals, rowCount: 1 })
				.mockResolvedValueOnce({ rows: answers, rowCount: 1 });

			const req = mockReq({ body: { id: 5, evt: 20, tcr: 2 } });
			const res = mockRes();

			await getTeacherAnswers(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.answer["5"].answer).toHaveLength(1);
		});
	});

	// ────────────────────── mergeStudentAnswers ────────────────

	describe("mergeStudentAnswers", () => {
		it("returns averaged scores across sessions", async () => {
			const evals = [
				{ id: 1, created_at: "2026-01-01", avg: 4, feedback: "" },
				{ id: 2, created_at: "2026-01-02", avg: 3, feedback: "" },
			];
			const answers = [
				{ session_id: 1, question_id: 10, score: 4 },
				{ session_id: 2, question_id: 10, score: 2 },
				{ session_id: 1, question_id: 11, score: 5 },
				{ session_id: 2, question_id: 11, score: 3 },
			];

			pool.query
				.mockResolvedValueOnce({ rows: evals, rowCount: 2 })
				.mockResolvedValueOnce({ rows: answers, rowCount: 4 });

			const req = mockReq({ body: { tcr: 1 } });
			const res = mockRes();

			await mergeStudentAnswers(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.merged).toEqual(res._json.answer);

			const q10 = res._json.merged.find((m) => m.question_id === "10");
			expect(q10.score).toBe(3); // (4+2)/2

			const q11 = res._json.merged.find((m) => m.question_id === "11");
			expect(q11.score).toBe(4); // (5+3)/2
		});

		it("returns failure when no evaluations found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { tcr: 999 } });
			const res = mockRes();

			await mergeStudentAnswers(req, res);

			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── mergeTeacherAnswers ────────────────

	describe("mergeTeacherAnswers", () => {
		it("returns merged teacher answers with sessions string", async () => {
			const evals = [
				{ id: 10, created_at: "2026-01", avg: 4, feedback: "" },
			];
			const answers = [
				{ session_id: 10, question_id: 1, score: 3 },
				{ session_id: 10, question_id: 2, score: 5 },
			];

			pool.query
				.mockResolvedValueOnce({ rows: evals, rowCount: 1 })
				.mockResolvedValueOnce({ rows: answers, rowCount: 2 });

			const req = mockReq({ body: { tcr: 2 } });
			const res = mockRes();

			await mergeTeacherAnswers(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.answer).toHaveLength(2);
			expect(res._json.sessions).toBe("10");
		});
	});

	// ────────────────────── viewStudentEvaluations ─────────────

	describe("viewStudentEvaluations", () => {
		it("returns evaluations with teacher info and subject names", async () => {
			const evals = [
				{ id: 1, tcr_id: 100, evt_id: 50, sentiment: "Good" },
			];
			const teachers = [
				{
					id: 100,
					firstname: "Jane",
					lastname: "Doe",
					quarter: "Q1",
					year: 2026,
					subject: 5,
				},
			];
			const subjects = [{ id: 5, subjects: "Math" }];

			pool.query
				.mockResolvedValueOnce({ rows: evals, rowCount: 1 }) // evaluations
				.mockResolvedValueOnce({ rows: teachers, rowCount: 1 }) // teachers
				.mockResolvedValueOnce({ rows: subjects, rowCount: 1 }) // subjects
				.mockResolvedValueOnce({
					rows: [{ count: "42" }],
					rowCount: 1,
				}); // COUNT

			const req = mockReq();
			const res = mockRes();

			await viewStudentEvaluations(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.evaluations).toHaveLength(1);
			expect(res._json.evaluations[0].teacher.firstname).toBe("Jane");
			expect(res._json.evaluations[0].teacher.subject).toBe("Math");
			expect(res._json.total).toBe(42);
		});
	});

	// ────────────────────── viewTeacherEvaluations ─────────────

	describe("viewTeacherEvaluations", () => {
		it("returns peer evaluations with teacher info", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [{ id: 1, tcr_id: 10, evt_id: 20 }],
					rowCount: 1,
				}) // eval_p
				.mockResolvedValueOnce({
					rows: [
						{
							id: 10,
							firstname: "Bob",
							lastname: "Smith",
							quarter: "Q2",
							year: 2026,
							subject: null,
						},
					],
					rowCount: 1,
				}) // teachers
				.mockResolvedValueOnce({
					rows: [{ count: "10" }],
					rowCount: 1,
				}); // COUNT

			const req = mockReq();
			const res = mockRes();

			await viewTeacherEvaluations(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.evaluations[0].teacher.firstname).toBe("Bob");
			expect(res._json.total).toBe(10);
		});
	});

	// ────────────────────── getChartDataStudent ────────────────

	describe("getChartDataStudent", () => {
		it("returns average scores for chart", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ avg: 4.2 }, { avg: 3.8 }],
				rowCount: 2,
			});

			const req = mockReq({ body: { tcr_id: 1 } });
			const res = mockRes();

			await getChartDataStudent(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.average).toHaveLength(2);
			expect(res._json.average[0].average).toBe(4.2);
		});

		it("returns 500 when no data found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { tcr_id: 999 } });
			const res = mockRes();

			await getChartDataStudent(req, res);

			expect(res._status).toBe(500);
		});
	});

	// ────────────────────── getChartDataTeacher ────────────────

	describe("getChartDataTeacher", () => {
		it("returns average scores for teacher chart", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ avg: 3.5 }],
				rowCount: 1,
			});

			const req = mockReq({ body: { tcr_id: 2 } });
			const res = mockRes();

			await getChartDataTeacher(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.average[0].average).toBe(3.5);
		});
	});
});
