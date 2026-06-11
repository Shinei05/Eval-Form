import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { 
		query: vi.fn(),
		connect: vi.fn(() => ({
			query: vi.fn(),
			release: vi.fn(),
		}))
	},
}));

import pool from "../src/config/supabase.js";

import {
	getStudentQuestions,
	getStudentQuestionsAll,
	getTeacherQuestions,
	getTeacherQuestionsAll,
	updateStudentQuestion,
	updateTeacherQuestion,
	deleteStudentQuestion,
	deleteTeacherQuestion,
	addStudentQuestion,
	addTeacherQuestion,
	getQuestionVersions,
	setActiveQuestionVersion,
	uploadQuestionsDocx,
} from "../src/controllers/questions.controller.js";

describe("questions controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ──────────── getStudentQuestions ──────────────────────────

	describe("getStudentQuestions", () => {
		it("returns active headers with their questions", async () => {
			const headers = [
				{ id: 1, header: "Teaching Quality", identifier: "v1" },
				{ id: 2, header: "Communication", identifier: "v1" },
			];
			const questions = [
				{ id: 10, questions: "Rate clarity", header_id: 1, header_version: "v1" },
				{ id: 11, questions: "Rate pace", header_id: 1, header_version: "v1" },
				{ id: 12, questions: "Rate listening", header_id: 2, header_version: "v1" },
			];

			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("questionnaire_settings")) {
					return { rows: [{ value: "v1" }], rowCount: 1 };
				}
				if (sql.includes("headers") && sql.includes("identifier = $1")) {
					return { rows: headers, rowCount: 2 };
				}
				if (sql.includes("questions")) {
					return { rows: questions, rowCount: 3 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq();
			const res = mockRes();

			await getStudentQuestions(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.count).toBe(3);
			expect(res._json.header_ver).toBe("v1");
			expect(res._json.headers).toHaveLength(2);
			expect(res._json.headers[0].questions).toHaveLength(2);
			expect(res._json.headers[1].questions).toHaveLength(1);
		});

		it("returns 400 when no active headers found", async () => {
			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("questionnaire_settings")) {
					return { rows: [{ value: "v1" }], rowCount: 1 };
				}
				if (sql.includes("headers")) {
					return { rows: [], rowCount: 0 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq();
			const res = mockRes();

			await getStudentQuestions(req, res);

			expect(res._status).toBe(400);
			expect(res._json.success).toBe(false);
		});
	});

	// ──────────── getStudentQuestionsAll ───────────────────────

	describe("getStudentQuestionsAll", () => {
		it("returns specific version questions for admin", async () => {
			const headers = [{ id: 1, header: "H1", identifier: "v2" }];
			const questions = [
				{ id: 20, questions: "Q1", header_id: 1, header_version: "v2" },
			];

			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("headers") && sql.includes("identifier = $1")) {
					return { rows: headers, rowCount: 1 };
				}
				if (sql.includes("questions")) {
					return { rows: questions, rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq({ body: { version: "v2" } });
			const res = mockRes();

			await getStudentQuestionsAll(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.count).toBe(1);
			expect(res._json.header_ver).toBe("v2");
		});
	});

	// ──────────── getTeacherQuestions ──────────────────────────

	describe("getTeacherQuestions", () => {
		it("returns active teacher headers with questions", async () => {
			const headers = [{ id: 1, header: "Peer Section" }];
			const questions = [
				{ id: 30, questions: "Rate collaboration", header_id: 1 },
			];

			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("questionnaire_settings")) {
					return { rows: [{ value: "tv1" }], rowCount: 1 };
				}
				if (sql.includes("header_t")) {
					return { rows: headers, rowCount: 1 };
				}
				if (sql.includes("question_t")) {
					return { rows: questions, rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq();
			const res = mockRes();

			await getTeacherQuestions(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.count).toBe(1);
			expect(res._json.header_ver).toBe("tv1");
			expect(res._json.headers[0].questions).toHaveLength(1);
		});
	});

	// ──────────── getTeacherQuestionsAll ───────────────────────

	describe("getTeacherQuestionsAll", () => {
		it("returns all teacher headers with questions for version", async () => {
			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("header_t")) {
					return { rows: [{ id: 1, header: "PH1" }], rowCount: 1 };
				}
				if (sql.includes("question_t")) {
					return { rows: [{ id: 40, questions: "Q", header_id: 1 }], rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq({ body: { version: "tv2" } });
			const res = mockRes();

			await getTeacherQuestionsAll(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.count).toBe(1);
			expect(res._json.header_ver).toBe("tv2");
		});
	});

	// ──────────── updateStudentQuestion ────────────────────────

	describe("updateStudentQuestion", () => {
		it("updates question text successfully", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { id: 10, question: "Updated question" },
			});
			const res = mockRes();

			await updateStudentQuestion(req, res);

			expect(res._json.success).toBe(true);
		});
	});

	// ──────────── updateTeacherQuestion ────────────────────────

	describe("updateTeacherQuestion", () => {
		it("updates question_t table", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { id: 30, question: "Updated peer question" },
			});
			const res = mockRes();

			await updateTeacherQuestion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("question_t"),
				expect.any(Array),
			);
		});
	});

	// ──────────── deleteStudentQuestion ────────────────────────

	describe("deleteStudentQuestion", () => {
		it("soft-deletes question from questions table", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { id: 10 } });
			const res = mockRes();

			await deleteStudentQuestion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("questions"),
				expect.any(Array),
			);
		});
	});

	// ──────────── deleteTeacherQuestion ────────────────────────

	describe("deleteTeacherQuestion", () => {
		it("soft-deletes question from question_t table", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { id: 30 } });
			const res = mockRes();

			await deleteTeacherQuestion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("question_t"),
				expect.any(Array),
			);
		});
	});

	// ──────────── addStudentQuestion ──────────────────────────

	describe("addStudentQuestion", () => {
		it("inserts question into questions table", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { id: 1, question: "New question", identifier: "v1" },
			});
			const res = mockRes();

			await addStudentQuestion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("questions"),
				expect.any(Array),
			);
		});
	});

	// ──────────── addTeacherQuestion ──────────────────────────

	describe("addTeacherQuestion", () => {
		it("inserts question into question_t table", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { id: 2, question: "Peer question", identifier: "tv1" },
			});
			const res = mockRes();

			await addTeacherQuestion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("question_t"),
				expect.any(Array),
			);
		});
	});

	// ──────────── getQuestionVersions ─────────────────────────

	describe("getQuestionVersions", () => {
		it("returns distinct versions and active version", async () => {
			pool.query.mockImplementation(async (sql, params) => {
				if (sql.includes("DISTINCT identifier")) {
					return { rows: [{ identifier: "v1" }, { identifier: "v2" }], rowCount: 2 };
				}
				if (sql.includes("questionnaire_settings")) {
					return { rows: [{ value: "v2" }], rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			});

			const req = mockReq({ body: { type: "student" } });
			const res = mockRes();

			await getQuestionVersions(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.versions).toEqual(["v1", "v2"]);
			expect(res._json.activeVersion).toBe("v2");
		});
	});

	// ──────────── setActiveQuestionVersion ─────────────────────

	describe("setActiveQuestionVersion", () => {
		it("updates questionnaire_settings successfully", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { type: "student", version: "v2" } });
			const res = mockRes();

			await setActiveQuestionVersion(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("questionnaire_settings"),
				["active_student_version", "v2"]
			);
		});
	});
});
