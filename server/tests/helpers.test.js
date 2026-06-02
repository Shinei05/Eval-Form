import { describe, it, expect } from "vitest";
import { getRandomString, getSentiment } from "../src/utils/helpers.js";

describe("helpers", () => {
	describe("getRandomString", () => {
		it("returns a string of default length 10", () => {
			const result = getRandomString();
			expect(result).toHaveLength(10);
		});

		it("returns a string of specified length", () => {
			expect(getRandomString(5)).toHaveLength(5);
			expect(getRandomString(20)).toHaveLength(20);
			expect(getRandomString(1)).toHaveLength(1);
		});

		it("only contains alphanumeric characters (0-9, A-Z)", () => {
			const result = getRandomString(100);
			expect(result).toMatch(/^[0-9A-Z]+$/);
		});

		it("produces different strings on each call", () => {
			const a = getRandomString();
			const b = getRandomString();
			// Extremely unlikely to be equal with 36^10 possibilities
			expect(a).not.toBe(b);
		});
	});

	describe("getSentiment", () => {
		it('returns "Very Poor" for score < 1.5', () => {
			expect(getSentiment(0)).toBe("Very Poor");
			expect(getSentiment(1)).toBe("Very Poor");
			expect(getSentiment(1.4)).toBe("Very Poor");
		});

		it('returns "Poor" for 1.5 <= score < 2.5', () => {
			expect(getSentiment(1.5)).toBe("Poor");
			expect(getSentiment(2)).toBe("Poor");
			expect(getSentiment(2.4)).toBe("Poor");
		});

		it('returns "Average" for 2.5 <= score < 3.5', () => {
			expect(getSentiment(2.5)).toBe("Average");
			expect(getSentiment(3)).toBe("Average");
			expect(getSentiment(3.4)).toBe("Average");
		});

		it('returns "Good" for 3.5 <= score < 4.5', () => {
			expect(getSentiment(3.5)).toBe("Good");
			expect(getSentiment(4)).toBe("Good");
			expect(getSentiment(4.4)).toBe("Good");
		});

		it('returns "Very Good" for 4.5 <= score <= 5', () => {
			expect(getSentiment(4.5)).toBe("Very Good");
			expect(getSentiment(5)).toBe("Very Good");
		});

		it('returns "Out of range" for score > 5', () => {
			expect(getSentiment(5.1)).toBe("Out of range");
			expect(getSentiment(100)).toBe("Out of range");
		});

		it('returns "Very Poor" for negative scores', () => {
			expect(getSentiment(-1)).toBe("Very Poor");
		});
	});
});
