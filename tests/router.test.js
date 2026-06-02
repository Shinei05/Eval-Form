import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth module before importing router
vi.mock("../src/utils/auth", () => ({
	isAuthenticated: vi.fn(() => false),
}));

import { isAuthenticated } from "../src/utils/auth";

// We need to test the router config by importing it
// Vue Router createWebHistory uses browser APIs, so we mock it
vi.mock("vue-router", async () => {
	const actual = await vi.importActual("vue-router");
	return {
		...actual,
		createWebHistory: vi.fn(() => actual.createMemoryHistory()),
	};
});

import router from "../src/router/index.js";

describe("router configuration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ────────────────── Route definitions ──────────────────

	it("has a Dashboard route at /", () => {
		const route = router.getRoutes().find((r) => r.path === "/");
		expect(route).toBeDefined();
		expect(route.name).toBe("Dashboard");
		expect(route.meta.requiresAuth).toBe(false);
	});

	it("has a Student route requiring auth", () => {
		const route = router.getRoutes().find((r) => r.name === "Student");
		expect(route).toBeDefined();
		expect(route.path).toBe("/student");
		expect(route.meta.requiresAuth).toBe(true);
	});

	it("has a Teacher route requiring auth", () => {
		const route = router.getRoutes().find((r) => r.name === "Teacher");
		expect(route).toBeDefined();
		expect(route.meta.requiresAuth).toBe(true);
	});

	it("has a Principal route requiring auth", () => {
		const route = router.getRoutes().find((r) => r.name === "Principal");
		expect(route).toBeDefined();
		expect(route.meta.requiresAuth).toBe(true);
	});

	it("has student-eval route with :id param", () => {
		const route = router.getRoutes().find((r) => r.name === "student-eval");
		expect(route).toBeDefined();
		expect(route.path).toBe("/student-eval/:id");
		expect(route.meta.requiresAuth).toBe(true);
	});

	it("does not have a Register Student route", () => {
		const route = router
			.getRoutes()
			.find((r) => r.name === "RegisterStudent");
		expect(route).toBeUndefined();
	});

	it("has a 404 catch-all route", () => {
		const route = router.getRoutes().find((r) => r.name === "NotFound");
		expect(route).toBeDefined();
	});

	it("has printable form routes with params", () => {
		const student = router
			.getRoutes()
			.find((r) => r.name === "printable-form");
		expect(student).toBeDefined();
		expect(student.path).toContain(":id");
		expect(student.path).toContain(":tcrid");

		const teacher = router
			.getRoutes()
			.find((r) => r.name === "printable-form1");
		expect(teacher).toBeDefined();
	});

	it("has merge printable form routes", () => {
		const merge1 = router
			.getRoutes()
			.find((r) => r.name === "printable-form2");
		expect(merge1).toBeDefined();
		expect(merge1.path).toContain(":tcrid");

		const merge2 = router
			.getRoutes()
			.find((r) => r.name === "printable-form3");
		expect(merge2).toBeDefined();
	});

	// ────────────────── Auth guard ─────────────────────────

	describe("navigation guard", () => {
		it("redirects to /login when unauthenticated on protected route", async () => {
			isAuthenticated.mockReturnValue(false);

			await router.push("/student");
			await router.isReady();

			// Should redirect to login
			expect(router.currentRoute.value.path).toBe("/login");
		});

		it("allows access to public routes without auth", async () => {
			isAuthenticated.mockReturnValue(false);

			await router.push("/");
			await router.isReady();

			expect(router.currentRoute.value.path).toBe("/");
		});

		it("allows access to protected routes when authenticated", async () => {
			isAuthenticated.mockReturnValue(true);

			await router.push("/student");
			await router.isReady();

			expect(router.currentRoute.value.path).toBe("/student");
		});
	});
});
