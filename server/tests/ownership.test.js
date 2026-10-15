import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => {
	const pool = { query: vi.fn() };
	return { pool, default: pool };
});

import pool from "../src/config/supabase.js";
import { requireEvaluationOwner, requireSelfUserId, requireStudentOwner } from "../src/middleware/ownership.js";
import evaluationRoutes from "../src/routes/evaluations.routes.js";
import studentRoutes from "../src/routes/students.routes.js";
import teacherRoutes from "../src/routes/teachers.routes.js";
import authRoutes from "../src/routes/auth.routes.js";

const handles = (router, path) =>
	router.stack.find((layer) => layer.route?.path === path).route.stack.map((layer) => layer.handle);

describe("resource ownership", () => {
	beforeEach(() => vi.clearAllMocks());

	it("allows the signed-in student's own record", async () => {
		pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
		const req = mockReq({ user: { user_id: 1 }, body: { stid: 10 } });
		const next = vi.fn();
		await requireStudentOwner("stid")(req, mockRes(), next);
		expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("usr_id = $2"), [10, 1]);
		expect(next).toHaveBeenCalledOnce();
	});

	it("rejects a different student's record", async () => {
		pool.query.mockResolvedValueOnce({ rows: [] });
		const res = mockRes();
		const next = vi.fn();
		await requireStudentOwner("stid")(mockReq({ user: { user_id: 1 }, body: { stid: 20 } }), res, next);
		expect(res._status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects a forged peer evaluator user ID", () => {
		const res = mockRes();
		const next = vi.fn();
		requireSelfUserId("stid")(mockReq({ user: { user_id: 1 }, body: { stid: 2 } }), res, next);
		expect(res._status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("matches evaluation status to the signed-in role and record", async () => {
		const res = mockRes();
		const next = vi.fn();
		await requireEvaluationOwner(
			mockReq({ user: { user_id: 1, role: "teacher" }, body: { type: "student", evaluatorId: 10 } }),
			res,
			next,
		);
		expect(res._status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("wires ownership before evaluation submissions and status reads", () => {
		expect(handles(evaluationRoutes, "/submit-student")).toHaveLength(4);
		expect(handles(evaluationRoutes, "/submit-teacher")).toHaveLength(4);
		expect(handles(evaluationRoutes, "/check-status")).toHaveLength(4);
		expect(handles(teacherRoutes, "/list")).toHaveLength(4);
		expect(handles(teacherRoutes, "/list-faculty")).toHaveLength(4);
	});

	it("limits report and student identity endpoints to admins", () => {
		for (const path of ["/answers-student", "/answers-teacher", "/merge-student", "/merge-teacher", "/view-student", "/view-teacher", "/chart-student", "/chart-teacher", "/list-student-evaluators", "/list-teacher-evaluators"]) {
			expect(handles(evaluationRoutes, path)).toHaveLength(3);
		}
		for (const path of ["/get-by-id", "/get-evaluator-id", "/count"]) {
			expect(handles(studentRoutes, path)).toHaveLength(3);
		}
		expect(handles(authRoutes, "/update-password")).toHaveLength(2);
	});
});
