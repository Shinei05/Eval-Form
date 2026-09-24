import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	fetchWithTimeout,
	DEFAULT_REQUEST_TIMEOUT_MS,
	TimeoutError,
} from "../src/utils/fetchWithTimeout.js";
import { useApi } from "../src/composables/useApi.js";
import * as authUtils from "../src/utils/auth.js";

describe("Network Timeout & API Handling", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("fetchWithTimeout", () => {
		it("has a sensible default timeout of 20 seconds", () => {
			expect(DEFAULT_REQUEST_TIMEOUT_MS).toBe(20000);
		});

		it("resolves successfully when fetch completes before timeout", async () => {
			const mockResponse = new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
			globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

			const res = await fetchWithTimeout("https://example.com/api/test", {
				timeout: 5000,
			});

			expect(globalThis.fetch).toHaveBeenCalledTimes(1);
			expect(res).toBe(mockResponse);
		});

		it("throws TimeoutError when request exceeds specified timeout", async () => {
			vi.useFakeTimers();

			globalThis.fetch = vi.fn().mockImplementation((url, options) => {
				return new Promise((resolve, reject) => {
					options.signal?.addEventListener("abort", () => {
						const err = new Error("The operation was aborted");
						err.name = "AbortError";
						reject(err);
					});
				});
			});

			const promise = fetchWithTimeout("https://example.com/api/slow", {
				timeout: 3000,
			});

			vi.advanceTimersByTime(3001);

			await expect(promise).rejects.toThrow(TimeoutError);
			await expect(promise).rejects.toThrow(/Request timed out after 3 seconds/);
		});

		it("supports external AbortSignal cancellation", async () => {
			const externalController = new AbortController();

			globalThis.fetch = vi.fn().mockImplementation((url, options) => {
				return new Promise((resolve, reject) => {
					options.signal?.addEventListener("abort", () => {
						const err = new Error("External abort");
						err.name = "AbortError";
						reject(err);
					});
				});
			});

			const promise = fetchWithTimeout("https://example.com/api/cancel", {
				signal: externalController.signal,
				timeout: 10000,
			});

			externalController.abort();

			await expect(promise).rejects.toThrow();
		});

		it("passes headers, method, and body correctly to fetch", async () => {
			const mockResponse = new Response(JSON.stringify({ success: true }));
			globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

			await fetchWithTimeout("https://example.com/api/data", {
				method: "PUT",
				headers: { "X-Custom": "123" },
				body: JSON.stringify({ key: "value" }),
				timeout: 5000,
			});

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://example.com/api/data",
				expect.objectContaining({
					method: "PUT",
					headers: { "X-Custom": "123" },
					body: JSON.stringify({ key: "value" }),
				}),
			);
		});
	});

	describe("useApi composable", () => {
		it("initializes with isLoading false and error null", () => {
			const { isLoading, error } = useApi();
			expect(isLoading.value).toBe(false);
			expect(error.value).toBeNull();
		});

		it("handles successful API requests and manages loading state", async () => {
			const { request, isLoading, error } = useApi();
			const payload = { success: true, data: [1, 2, 3] };

			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify(payload), { status: 200 }),
			);

			const reqPromise = request("https://example.com/api/items");
			expect(isLoading.value).toBe(true);

			const result = await reqPromise;
			expect(isLoading.value).toBe(false);
			expect(error.value).toBeNull();
			expect(result).toEqual(payload);
		});

		it("includes Authorization header when auth token exists", async () => {
			vi.spyOn(authUtils, "getToken").mockReturnValue("test-jwt-token");
			const { request } = useApi();

			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ success: true }), { status: 200 }),
			);

			await request("https://example.com/api/secure", { auth: true });

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://example.com/api/secure",
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: "Bearer test-jwt-token",
					}),
				}),
			);
		});

		it("omits Authorization header when auth is false", async () => {
			vi.spyOn(authUtils, "getToken").mockReturnValue("test-jwt-token");
			const { request } = useApi();

			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ success: true }), { status: 200 }),
			);

			await request("https://example.com/api/public", { auth: false });

			const calledHeaders = globalThis.fetch.mock.calls[0][1].headers;
			expect(calledHeaders.Authorization).toBeUndefined();
		});

		it("handles business error responses (success: false)", async () => {
			const { request, error } = useApi();
			const payload = { success: false, message: "Invalid credentials" };

			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify(payload), { status: 200 }),
			);

			const result = await request("https://example.com/api/login");
			expect(result.success).toBe(false);
			expect(error.value).toBe("Invalid credentials");
		});

		it("handles timeout errors gracefully and provides a clear error message", async () => {
			vi.useFakeTimers();
			const { request, error, isLoading } = useApi();

			globalThis.fetch = vi.fn().mockImplementation((url, options) => {
				return new Promise((resolve, reject) => {
					options.signal?.addEventListener("abort", () => {
						const err = new Error("The operation was aborted");
						err.name = "AbortError";
						reject(err);
					});
				});
			});

			const promise = request("https://example.com/api/slow-endpoint", {
				timeout: 2000,
			});

			vi.advanceTimersByTime(2001);

			const result = await promise;
			expect(isLoading.value).toBe(false);
			expect(result.success).toBe(false);
			expect(result.error).toMatch(/Request timed out/i);
			expect(error.value).toMatch(/Request timed out/i);
		});

		it("handles general network errors gracefully", async () => {
			const { request, error, isLoading } = useApi();

			globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

			const result = await request("https://example.com/api/unreachable");
			expect(isLoading.value).toBe(false);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to fetch");
			expect(error.value).toBe("Failed to fetch");
		});
	});
});
