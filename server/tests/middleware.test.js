import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../src/middleware/auth.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { mockReq, mockRes } from "./helpers.js";

describe("authenticate middleware", () => {
	const secret = process.env.JWT_SECRET;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when no Authorization header is provided", () => {
		const req = mockReq({ headers: {} });
		const res = mockRes();
		const next = vi.fn();

		authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res._json).toEqual({
			success: false,
			error: "No token provided",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 401 when Authorization header has wrong format", () => {
		const req = mockReq({ headers: { authorization: "Basic abc123" } });
		const res = mockRes();
		const next = vi.fn();

		authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res._json.error).toBe("No token provided");
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 401 for an invalid token", () => {
		const req = mockReq({
			headers: { authorization: "Bearer invalid-token" },
		});
		const res = mockRes();
		const next = vi.fn();

		authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res._json.error).toBe("Invalid or expired token");
		expect(next).not.toHaveBeenCalled();
	});

	it("calls next() and attaches user for a valid token", () => {
		const payload = { user_id: 1, email: "test@test.com" };
		const token = jwt.sign(payload, secret, { expiresIn: 3600 });
		const req = mockReq({
			headers: { authorization: `Bearer ${token}` },
		});
		const res = mockRes();
		const next = vi.fn();

		authenticate(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(req.user).toBeDefined();
		expect(req.user.user_id).toBe(1);
		expect(req.user.email).toBe("test@test.com");
	});

	it("returns 401 for an expired token", () => {
		const payload = { user_id: 1, email: "test@test.com" };
		const token = jwt.sign(payload, secret, { expiresIn: -10 });
		const req = mockReq({
			headers: { authorization: `Bearer ${token}` },
		});
		const res = mockRes();
		const next = vi.fn();

		authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res._json.error).toBe("Invalid or expired token");
		expect(next).not.toHaveBeenCalled();
	});
});

describe("errorHandler middleware", () => {
	it("returns 500 with error message in non-production mode", () => {
		const err = new Error("Something went wrong");
		const req = mockReq();
		const res = mockRes();
		const next = vi.fn();

		errorHandler(err, req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res._json).toEqual({
			success: false,
			error: "Something went wrong",
		});
	});

	it("uses err.statusCode if provided", () => {
		const err = new Error("Not found");
		err.statusCode = 404;
		const req = mockReq();
		const res = mockRes();
		const next = vi.fn();

		errorHandler(err, req, res, next);

		expect(res.status).toHaveBeenCalledWith(404);
	});

	it("returns generic message in production mode", () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";

		const err = new Error("Secret internal details");
		const req = mockReq();
		const res = mockRes();
		const next = vi.fn();

		errorHandler(err, req, res, next);

		expect(res._json.error).toBe("Internal server error");

		process.env.NODE_ENV = originalEnv;
	});
});
