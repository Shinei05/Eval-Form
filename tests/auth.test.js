import { describe, it, expect, beforeEach } from "vitest";
import {
	isAuthenticated,
	getToken,
	setToken,
	removeToken,
	getUserData,
	setUserData,
} from "../src/utils/auth.js";

describe("auth utilities", () => {
	beforeEach(() => {
		removeToken();
	});

	// ────────────────── isAuthenticated ────────────────────

	describe("isAuthenticated", () => {
		it("returns false when no token exists", () => {
			expect(isAuthenticated()).toBe(false);
		});

		it("returns true when token exists", () => {
			setToken("abc123");
			expect(isAuthenticated()).toBe(true);
		});

		it("returns false for empty string token", () => {
			setToken("");
			expect(isAuthenticated()).toBe(false);
		});
	});

	// ────────────────── getToken ───────────────────────────

	describe("getToken", () => {
		it("returns null when no token set", () => {
			expect(getToken()).toBeNull();
		});

		it("returns the stored token", () => {
			setToken("mytoken");
			expect(getToken()).toBe("mytoken");
		});
	});

	// ────────────────── setToken ───────────────────────────

	describe("setToken", () => {
		it("stores token in localStorage", () => {
			setToken("newtoken");
			expect(getToken()).toBe("newtoken");
		});
	});

	// ────────────────── removeToken ────────────────────────

	describe("removeToken", () => {
		it("removes both token and userData", () => {
			setToken("tok");
			setUserData({ name: "test" });
			removeToken();
			expect(getToken()).toBeNull();
			expect(getUserData()).toBeNull();
		});
	});

	// ────────────────── getUserData ────────────────────────

	describe("getUserData", () => {
		it("returns null when no userData", () => {
			expect(getUserData()).toBeNull();
		});

		it("parses and returns stored user data", () => {
			const data = { id: 1, name: "Test" };
			setUserData(data);
			expect(getUserData()).toEqual(data);
		});
	});

	// ────────────────── setUserData ────────────────────────

	describe("setUserData", () => {
		it("stores serialized user data", () => {
			const data = { id: 2, role: "admin" };
			setUserData(data);
			expect(getUserData()).toEqual(data);
		});
	});
});
