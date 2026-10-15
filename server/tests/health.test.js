import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "./helpers.js";

vi.mock("../src/config/supabase.js", () => {
	const pool = { query: vi.fn() };
	return { pool, default: pool };
});

import pool from "../src/config/supabase.js";
import healthRoutes from "../src/routes/health.routes.js";

const handlerFor = (path) =>
	healthRoutes.stack.find((layer) => layer.route?.path === path).route.stack[0].handle;

describe("Health API and Dashboard", () => {
	beforeEach(() => vi.clearAllMocks());

	it("serves the health dashboard HTML", () => {
		const res = mockRes();
		res.sendFile = vi.fn((path) => { res._sent = readFileSync(path, "utf8"); });
		handlerFor("/health")(mockReq(), res);
		expect(res._sent).toContain("<!DOCTYPE html>");
		expect(res._sent).toContain("System Diagnostics");
	});

	it("returns system statistics when the database connects", async () => {
		pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
		const res = mockRes();
		await handlerFor("/api/health/details")(mockReq(), res);
		expect(res._json.status).toBe("ok");
		expect(res._json.database.status).toBe("connected");
		expect(res._json).toHaveProperty("uptime");
		expect(res._json).toHaveProperty("memory");
		expect(res._json).toHaveProperty("cpu");
		expect(res._json.database.error).toBeNull();
	});

	it("reports a database connection failure", async () => {
		pool.query.mockRejectedValueOnce(new Error("Connection timeout"));
		const res = mockRes();
		await handlerFor("/api/health/details")(mockReq(), res);
		expect(res._json.status).toBe("ok");
		expect(res._json.database.status).toBe("error");
		expect(res._json.database.error).toBe("Connection timeout");
	});
});
