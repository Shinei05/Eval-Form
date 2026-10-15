import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => {
	const pool = { query: vi.fn() };
	return { default: pool, pool };
});

import pool from "../src/config/supabase.js";
import { authenticate } from "../src/middleware/auth.js";
import { requireRole } from "../src/middleware/authorize.js";
import adminRoutes from "../src/routes/admin.routes.js";
import announcementRoutes from "../src/routes/announcements.routes.js";
import headerRoutes from "../src/routes/headers.routes.js";
import questionRoutes from "../src/routes/questions.routes.js";
import teacherRoutes from "../src/routes/teachers.routes.js";

const tokenFor = (userId) => jwt.sign({ user_id: userId }, process.env.JWT_SECRET);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("requireRole", () => {
	it("requires a verified identity", async () => {
		const res = mockRes();
		const next = vi.fn();
		await requireRole("admin")(mockReq(), res, next);
		expect(res._status).toBe(401);
		expect(pool.query).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects a deleted user or a non-admin", async () => {
		const next = vi.fn();
		pool.query.mockResolvedValueOnce({ rows: [] });
		const deletedRes = mockRes();
		await requireRole("admin")(mockReq({ user: { user_id: 1 } }), deletedRes, next);
		expect(deletedRes._status).toBe(401);

		pool.query.mockResolvedValueOnce({ rows: [{ is_admin: false, is_teacher: true }] });
		const teacherRes = mockRes();
		await requireRole("admin")(mockReq({ user: { user_id: 2 } }), teacherRes, next);
		expect(teacherRes._status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("allows a current admin and forwards database errors", async () => {
		const req = mockReq({ user: { user_id: 3 } });
		const res = mockRes();
		const next = vi.fn();
		pool.query.mockResolvedValueOnce({ rows: [{ is_admin: true, is_teacher: true }] });
		await requireRole("admin")(req, res, next);
		expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("is_deleted = false"), [3]);
		expect(req.user.role).toBe("admin");
		expect(next).toHaveBeenCalledWith();

		const error = new Error("database unavailable");
		pool.query.mockRejectedValueOnce(error);
		const errorNext = vi.fn();
		await requireRole("admin")(mockReq({ user: { user_id: 3 } }), mockRes(), errorNext);
		expect(errorNext).toHaveBeenCalledWith(error);
	});
});

describe("admin route protection", () => {
	const protectedRoutes = [
		[questionRoutes, "post", "/update"],
		[questionRoutes, "post", "/update-teacher"],
		[questionRoutes, "post", "/delete"],
		[questionRoutes, "post", "/delete-teacher"],
		[questionRoutes, "post", "/add"],
		[questionRoutes, "post", "/add-teacher"],
		[questionRoutes, "post", "/versions"],
		[questionRoutes, "post", "/set-active"],
		[questionRoutes, "post", "/upload"],
		...["/add", "/add-teacher", "/update", "/update-teacher", "/delete", "/delete-teacher"].map((path) => [headerRoutes, "post", path]),
		...["/create", "/edit", "/delete", "/archived", "/restore"].map((path) => [teacherRoutes, "post", path]),
		...["/csv-import", "/subjects", "/set-schedule", "/reset-schedule", "/ai-summary", "/export", "/export-teacher", "/export-all-teachers", "/teacher-report-data"].map((path) => [adminRoutes, "post", path]),
		[announcementRoutes, "post", "/"],
		[announcementRoutes, "put", "/:id"],
		[announcementRoutes, "delete", "/:id"],
	];

	it.each(protectedRoutes)("requires an admin for %s %s %s", async (router, method, path) => {
		const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route;
		expect(route.stack[0].handle).toBe(authenticate);

		const unauthenticated = mockRes();
		route.stack[0].handle(mockReq(), unauthenticated, vi.fn());
		expect(unauthenticated._status).toBe(401);

		const req = mockReq({ headers: { authorization: `Bearer ${tokenFor(7)}` } });
		const authenticatedNext = vi.fn();
		route.stack[0].handle(req, mockRes(), authenticatedNext);
		expect(authenticatedNext).toHaveBeenCalledOnce();

		pool.query.mockResolvedValueOnce({ rows: [{ is_admin: false, is_teacher: false }] });
		const forbidden = mockRes();
		const controllerNext = vi.fn();
		await route.stack[1].handle(req, forbidden, controllerNext);
		expect(forbidden._status).toBe(403);
		expect(controllerNext).not.toHaveBeenCalled();

		pool.query.mockResolvedValueOnce({ rows: [{ is_admin: true, is_teacher: false }] });
		await route.stack[1].handle(req, mockRes(), controllerNext);
		expect(controllerNext).toHaveBeenCalledOnce();
	});

	it("keeps schedule reads available to all authenticated roles", () => {
		const route = adminRoutes.stack.find((layer) => layer.route?.path === "/schedule").route;
		expect(route.stack.map((layer) => layer.handle)).toEqual([authenticate, expect.any(Function)]);
	});
});
