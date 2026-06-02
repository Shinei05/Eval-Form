import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { query: vi.fn() },
}));

vi.mock("bcryptjs", () => ({
	default: { hash: vi.fn(() => Promise.resolve("$hashed$")) },
}));

vi.mock("../src/utils/helpers.js", () => ({
	getRandomString: vi.fn(() => "RAND123456"),
}));

vi.mock("../src/utils/email.js", () => ({
	sendEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock("../src/utils/ai.js", () => ({
	aiSummarize: vi.fn(() => Promise.resolve("AI summary text")),
}));

import pool from "../src/config/supabase.js";

import {
	csvImport,
	getSubjects,
	getSchedule,
	setSchedule,
	aiSummary,
	exportCSV,
	exportTeacherReport,
	exportAllTeachersReport,
	getTeacherReportData,
} from "../src/controllers/admin.controller.js";

describe("admin controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ────────────────────── csvImport ──────────────────────────

	describe("csvImport", () => {
		it("returns 400 when no file uploaded", async () => {
			const req = mockReq({ file: undefined });
			const res = mockRes();

			await csvImport(req, res);

			expect(res._status).toBe(400);
			expect(res._json.success).toBe(false);
		});

		it("parses CSV and creates students with teacher assignments", async () => {
			const csvContent =
				"test@mail.com,John,Doe,12345,10,Block A,studpass,teacher@mail.com,Jane,Doe,teachpass,Mathematics,1,2026";
			const req = mockReq({
				file: { buffer: Buffer.from(csvContent) },
			});
			const res = mockRes();

			pool.query
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // resolve subject (not found)
				.mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 }) // insert subject
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check existing student user
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // insert student user
				.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 }) // insert student record
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check existing teacher user
				.mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 }) // insert teacher user
				.mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 }) // insert teacher record
				.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // insert assignment

			await csvImport(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.results).toHaveLength(1);
			expect(res._json.results[0].success).toBe(true);
		});

		it("reports error when teacher user creation fails", async () => {
			const csvContent =
				"test@mail.com,John,Doe,12345,10,Block A,studpass,teacher@mail.com,Jane,Doe,teachpass,Mathematics,1,2026";
			const req = mockReq({
				file: { buffer: Buffer.from(csvContent) },
			});
			const res = mockRes();

			pool.query
				.mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 }) // resolve subject (exists)
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check student user
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // insert student user
				.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 }) // insert student record
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check teacher user
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // insert teacher user fails

			await csvImport(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.results[0].success).toBe(false);
			expect(res._json.results[0].message).toContain("Failed to create teacher user");
		});

		it("reports error for rows with missing required fields", async () => {
			const csvContent = "onlyemail@mail.com,,,,,,,,,,,,,";
			const req = mockReq({
				file: { buffer: Buffer.from(csvContent) },
			});
			const res = mockRes();

			await csvImport(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.results).toHaveLength(1);
			expect(res._json.results[0].success).toBe(false);
			expect(res._json.results[0].message).toContain("Missing required student fields");
		});

		it("skips header row starting with student_email", async () => {
			const csvContent =
				"student_email,student_firstname,student_lastname,student_id,student_grade,student_section,student_password,teacher_email,teacher_firstname,teacher_lastname,teacher_password,subject_name,quarter,year\ntest@mail.com,John,Doe,12345,10,Block A,studpass,teacher@mail.com,Jane,Doe,teachpass,Mathematics,1,2026";
			const req = mockReq({
				file: { buffer: Buffer.from(csvContent) },
			});
			const res = mockRes();

			pool.query
				.mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 }) // resolve subject
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check student user
				.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // insert student user
				.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 }) // insert student record
				.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check teacher user
				.mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 }) // insert teacher user
				.mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 }) // insert teacher record
				.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // insert assignment

			await csvImport(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.results).toHaveLength(1); // only data row, not header
			expect(res._json.results[0].success).toBe(true);
		});
	});

	// ────────────────────── getSubjects ────────────────────────

	describe("getSubjects", () => {
		it("returns list of subjects", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{ id: 1, subjects: "Math" },
					{ id: 2, subjects: "Science" },
				],
				rowCount: 2,
			});

			const req = mockReq();
			const res = mockRes();

			await getSubjects(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.subjects).toHaveLength(2);
		});

		it("returns 400 when no subjects found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq();
			const res = mockRes();

			await getSubjects(req, res);

			expect(res._status).toBe(400);
			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── getSchedule ───────────────────────

	describe("getSchedule", () => {
		it("returns the latest schedule", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{
						id: 1,
						time_start: "08:00",
						date_start: "2026-01-01",
						time_end: "17:00",
						date_end: "2026-01-31",
					},
				],
				rowCount: 1,
			});

			const req = mockReq();
			const res = mockRes();

			await getSchedule(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.times.time_start).toBe("08:00");
		});

		it("returns 500 when no schedule found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq();
			const res = mockRes();

			await getSchedule(req, res);

			expect(res._status).toBe(500);
			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── setSchedule ───────────────────────

	describe("setSchedule", () => {
		it("inserts schedule and returns emails", async () => {
			pool.query
				.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insert schedule
				.mockResolvedValueOnce({
					rows: [{ email: "a@b.com" }, { email: "c@d.com" }],
					rowCount: 2,
				}); // select emails

			const req = mockReq({
				body: {
					time_start: "08:00",
					date_start: "2026-01-01",
					time_end: "17:00",
					date_end: "2026-01-31",
				},
			});
			const res = mockRes();

			await setSchedule(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.emails).toHaveLength(2);
		});

		it("returns 500 when insert fails", async () => {
			pool.query.mockRejectedValueOnce(new Error("db error"));

			const req = mockReq({
				body: {
					time_start: "08:00",
					date_start: "2026-01-01",
					time_end: "17:00",
					date_end: "2026-01-31",
				},
			});
			const res = mockRes();

			await setSchedule(req, res);

			expect(res._status).toBe(500);
		});
	});

	// ────────────────────── aiSummary ─────────────────────────

	describe("aiSummary", () => {
		it("returns summary from direct feedback", async () => {
			const req = mockReq({
				body: {
					feedback: "Teacher is great",
					questions: "Q1",
					answers: "A1",
				},
			});
			const res = mockRes();

			await aiSummary(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.summary).toBe("AI summary text");
			expect(res._json.response).toBe("AI summary text");
		});

		it("auto-fetches data when teacherId provided without feedback", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [
						{ id: 1, feedback: "Good", avg: 4 },
						{ id: 2, feedback: "Nice", avg: 3.5 },
					],
					rowCount: 2,
				}) // evaluations
				.mockResolvedValueOnce({
					rows: [{ session_id: 1, question_id: 1, score: 4 }],
					rowCount: 1,
				}) // answers
				.mockResolvedValueOnce({
					rows: [{ id: 10, header: "Section 1" }],
					rowCount: 1,
				}) // headers
				.mockResolvedValueOnce({
					rows: [{ id: 1, questions: "Rate clarity", header_id: 10 }],
					rowCount: 1,
				}); // questions

			const req = mockReq({ body: { id: 100 } });
			const res = mockRes();

			await aiSummary(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.summary).toBe("AI summary text");
		});

		it("returns failure when no evaluations found for teacher", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { id: 50 } });
			const res = mockRes();

			await aiSummary(req, res);

			expect(res._json.success).toBe(false);
		});
	});

	// ────────────────────── exportCSV ─────────────────────────

	describe("exportCSV", () => {
		it("rejects non-whitelisted table names", async () => {
			const req = mockReq({ body: { table: "secret_data" } });
			const res = mockRes();

			await exportCSV(req, res);

			expect(res._status).toBe(400);
			expect(res._json.message).toBe("Invalid table");
		});

		it("exports CSV with correct headers", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [
					{ id: 1, name: "Math", active: true },
					{ id: 2, name: "Science", active: false },
				],
				rowCount: 2,
			});

			const req = mockReq({ body: { table: "subjects" } });
			const res = mockRes();

			await exportCSV(req, res);

			expect(res._headers["Content-Type"]).toBe("text/csv");
			expect(res._headers["Content-Disposition"]).toContain(
				"subjects_export.csv",
			);
			expect(res._sent).toContain("id,name,active");
		});

		it("returns 400 when no data to export", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

			const req = mockReq({ body: { table: "evaluation" } });
			const res = mockRes();

			await exportCSV(req, res);

			expect(res._status).toBe(400);
			expect(res._json.message).toBe("No data to export");
		});

		it("uses default table when none specified", async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 1, avg: 4.0 }],
				rowCount: 1,
			});

			const req = mockReq({ body: {} });
			const res = mockRes();

			await exportCSV(req, res);

			// Should default to "evaluation"
			expect(res._headers["Content-Disposition"]).toContain(
				"evaluation_export.csv",
			);
		});
	});

	// ────────────────────── exportTeacherReport ────────────────
	describe("exportTeacherReport", () => {
		it("returns 400 when no teacher ID is provided", async () => {
			const req = mockReq({ body: {} });
			const res = mockRes();

			await exportTeacherReport(req, res);

			expect(res._status).toBe(400);
			expect(res._json.message).toBe("Missing teacher ID");
		});

		it("returns 404 when teacher is not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // teacher lookup

			const req = mockReq({ body: { tcr_id: 999 } });
			const res = mockRes();

			await exportTeacherReport(req, res);

			expect(res._status).toBe(404);
			expect(res._json.message).toBe("Teacher not found");
		});

		it("exports detailed CSV for a teacher", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [{ id: 1, firstname: "Jane", lastname: "Doe", subject_name: "Math", quarter: 1, year: 2026, email: "jane@test.com" }],
					rowCount: 1,
				}) // teacher details
				.mockResolvedValueOnce({
					rows: [{ created_at: "2026-05-20T00:00:00Z", avg: 4.5, sentiment: "Positive", feedback: "Great teacher" }],
					rowCount: 1,
				}) // student evaluations
				.mockResolvedValueOnce({
					rows: [{ created_at: "2026-05-20T00:00:00Z", avg: 4.8, sentiment: "Positive", feedback: "Excellent" }],
					rowCount: 1,
				}) // peer evaluations
				.mockResolvedValueOnce({
					rows: [{ header: "Teaching Skills", avg_score: 4.5 }],
					rowCount: 1,
				}) // student categories
				.mockResolvedValueOnce({
					rows: [{ header: "Professionalism", avg_score: 4.8 }],
					rowCount: 1,
				}); // peer categories

			const req = mockReq({ body: { tcr_id: 1 } });
			const res = mockRes();

			await exportTeacherReport(req, res);

			expect(res._headers["Content-Type"]).toBe("text/csv");
			expect(res._headers["Content-Disposition"]).toContain("teacher_Doe_report.csv");
			expect(res._sent).toContain("TEACHER EVALUATION PERFORMANCE & SUMMARY REPORT");
			expect(res._sent).toContain("Jane Doe");
			expect(res._sent).toContain("Teaching Skills");
			expect(res._sent).toContain("Professionalism");
		});
	});

	// ────────────────────── exportAllTeachersReport ────────────
	describe("exportAllTeachersReport", () => {
		it("exports consolidated summary of all teachers", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [{ id: 1, firstname: "Jane", lastname: "Doe", subject_name: "Math", quarter: 1, year: 2026, email: "jane@test.com" }],
					rowCount: 1,
				}) // all teachers
				.mockResolvedValueOnce({
					rows: [{ tcr_id: 1, count: 5, avg_score: 4.3 }],
					rowCount: 1,
				}) // student summary
				.mockResolvedValueOnce({
					rows: [{ tcr_id: 1, count: 2, avg_score: 4.6 }],
					rowCount: 1,
				}); // peer summary

			const req = mockReq({ body: {} });
			const res = mockRes();

			await exportAllTeachersReport(req, res);

			expect(res._headers["Content-Type"]).toBe("text/csv");
			expect(res._headers["Content-Disposition"]).toContain("all_teachers_report.csv");
			expect(res._sent).toContain("ALL TEACHERS EVALUATION SUMMARY REPORT");
			expect(res._sent).toContain("Jane,Doe,jane@test.com,Math,1,2026,5,4.30,2,4.60");
		});
	});

	// ────────────────────── getTeacherReportData ───────────────
	describe("getTeacherReportData", () => {
		it("returns 400 when no teacher ID is provided", async () => {
			const req = mockReq({ body: {} });
			const res = mockRes();

			await getTeacherReportData(req, res);

			expect(res._status).toBe(400);
			expect(res._json.message).toBe("Missing teacher ID");
		});

		it("returns 404 when teacher is not found", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // teacher lookup

			const req = mockReq({ body: { tcr_id: 999 } });
			const res = mockRes();

			await getTeacherReportData(req, res);

			expect(res._status).toBe(404);
			expect(res._json.message).toBe("Teacher not found");
		});

		it("returns evaluation report data in JSON format", async () => {
			pool.query
				.mockResolvedValueOnce({
					rows: [{ id: 1, firstnm: "Jane", lastnm: "Doe", sub: "Math", quarter: 1, year: 2026, email: "jane@test.com" }],
					rowCount: 1,
				}) // teacher details
				.mockResolvedValueOnce({
					rows: [{ created_at: "2026-05-20T00:00:00Z", avg: 4.5, sentiment: "Positive", feedback: "Great teacher" }],
					rowCount: 1,
				}) // student evaluations
				.mockResolvedValueOnce({
					rows: [{ created_at: "2026-05-20T00:00:00Z", avg: 4.8, sentiment: "Positive", feedback: "Excellent" }],
					rowCount: 1,
				}) // peer evaluations
				.mockResolvedValueOnce({
					rows: [{ header: "Teaching Skills", avg_score: 4.5 }],
					rowCount: 1,
				}) // student categories
				.mockResolvedValueOnce({
					rows: [{ header: "Professionalism", avg_score: 4.8 }],
					rowCount: 1,
				}); // peer categories

			const req = mockReq({ body: { tcr_id: 1 } });
			const res = mockRes();

			await getTeacherReportData(req, res);

			expect(res._json.success).toBe(true);
			expect(res._json.teacher.firstnm).toBe("Jane");
			expect(res._json.stats.studentCount).toBe(1);
			expect(res._json.stats.peerCount).toBe(1);
			expect(res._json.stats.combinedAvg).toBe(4.65);
			expect(res._json.studentCategories[0].header).toBe("Teaching Skills");
		});
	});
});
