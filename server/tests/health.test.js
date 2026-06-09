import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import pool from "../src/config/supabase.js";

// Mock the PG pool
vi.mock("../src/config/supabase.js", () => {
	const mockPool = {
		query: vi.fn(),
		on: vi.fn(),
	};
	return {
		pool: mockPool,
		default: mockPool,
	};
});

describe("Health API and Dashboard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("GET /health returns the HTML page", async () => {
		const res = await request(app)
			.get("/health")
			.expect(200);

		expect(res.headers["content-type"]).toContain("text/html");
		expect(res.text).toContain("<!DOCTYPE html>");
		expect(res.text).toContain("ProjectEVAL Status");
	});

	it("GET /api/health/details returns system statistics on database success", async () => {
		// Mock database query to resolve
		pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

		const res = await request(app)
			.get("/api/health/details")
			.expect(200);

		expect(res.body.status).toBe("ok");
		expect(res.body.database.status).toBe("connected");
		expect(res.body).toHaveProperty("uptime");
		expect(res.body).toHaveProperty("memory");
		expect(res.body).toHaveProperty("cpu");
		expect(res.body.database.error).toBeNull();
	});

	it("GET /api/health/details handles database connection failure", async () => {
		// Mock database query to reject
		pool.query.mockRejectedValueOnce(new Error("Connection timeout"));

		const res = await request(app)
			.get("/api/health/details")
			.expect(200);

		expect(res.body.status).toBe("ok");
		expect(res.body.database.status).toBe("error");
		expect(res.body.database.error).toBe("Connection timeout");
	});
});
