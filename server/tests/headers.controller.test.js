import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => ({
	default: { query: vi.fn() },
}));

import pool from "../src/config/supabase.js";

import {
	addStudentHeader,
	addTeacherHeader,
	updateStudentHeader,
	updateTeacherHeader,
	deleteStudentHeader,
	deleteTeacherHeader,
} from "../src/controllers/headers.controller.js";

describe("headers controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("addStudentHeader", () => {
		it("inserts a student header", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { header: "New Section", identifier: "v1" },
			});
			const res = mockRes();

			await addStudentHeader(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("INSERT INTO headers"),
				["New Section", "v1"],
			);
		});

		it("returns 500 on insert error", async () => {
			pool.query.mockRejectedValueOnce(new Error("duplicate"));

			const req = mockReq({ body: { header: "X", identifier: "X" } });
			const res = mockRes();

			await addStudentHeader(req, res);

			expect(res._status).toBe(500);
		});
	});

	describe("addTeacherHeader", () => {
		it("inserts a teacher header", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { header: "Peer Header", identifier: "tv1" },
			});
			const res = mockRes();

			await addTeacherHeader(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("INSERT INTO header_t"),
				["Peer Header", "tv1"],
			);
		});
	});

	describe("updateStudentHeader", () => {
		it("updates a student header", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({
				body: { id: 1, newHeader: "Updated Header" },
			});
			const res = mockRes();

			await updateStudentHeader(req, res);

			expect(res._json.success).toBe(true);
		});

		it("returns 500 on update error", async () => {
			pool.query.mockRejectedValueOnce(new Error("update failed"));

			const req = mockReq({ body: { id: 1, newHeader: "X" } });
			const res = mockRes();

			await updateStudentHeader(req, res);

			expect(res._status).toBe(500);
		});
	});

	describe("updateTeacherHeader", () => {
		it("updates a teacher header", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { id: 2, newHeader: "New Text" } });
			const res = mockRes();

			await updateTeacherHeader(req, res);

			expect(res._json.success).toBe(true);
		});
	});

	describe("deleteStudentHeader", () => {
		it("soft-deletes a student header (is_deleted = true)", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { header_id: 3 } });
			const res = mockRes();

			await deleteStudentHeader(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("is_deleted = true"),
				[3],
			);
		});
	});

	describe("deleteTeacherHeader", () => {
		it("soft-deletes a teacher header (is_deleted = true)", async () => {
			pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

			const req = mockReq({ body: { header_id: 4 } });
			const res = mockRes();

			await deleteTeacherHeader(req, res);

			expect(res._json.success).toBe(true);
			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining("is_deleted = true"),
				[4],
			);
		});
	});
});
