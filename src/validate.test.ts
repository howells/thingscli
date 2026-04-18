import { describe, expect, it, vi } from "vitest";

// Mock @howells/cli to capture errors instead of process.exit
vi.mock("@howells/cli", () => ({
	error: (message: string, command?: string) => {
		throw new Error(`[${command}] ${message}`);
	},
	hardenId: (value: string, command: string, options?: { label?: string }) => {
		const label = options?.label ?? "ID";
		if (/[\x00-\x1f]/.test(value)) {
			throw new Error(`[${command}] Invalid ${label}: contains control characters.`);
		}
		if (value.includes("..") || value.includes("/") || value.includes("\\")) {
			throw new Error(`[${command}] Invalid ${label}: contains path traversal characters.`);
		}
	},
}));

import { validateDate, validateUuid, validateWhen } from "./validate.ts";

describe("validateUuid", () => {
	it("accepts valid Things UUIDs", () => {
		expect(() => validateUuid("GmSSPaKoFD33XdVjDabimw", "test")).not.toThrow();
		expect(() => validateUuid("abc123def456ghi789jkl0", "test")).not.toThrow();
	});

	it("rejects short strings", () => {
		expect(() => validateUuid("short", "test")).toThrow("Invalid UUID");
	});

	it("rejects path traversal attempts", () => {
		expect(() => validateUuid("../../etc/passwd/aaaa", "test")).toThrow(
			"Invalid",
		);
	});

	it("rejects control characters", () => {
		expect(() =>
			validateUuid("abc123def456ghi789\x00kl", "test"),
		).toThrow("Invalid");
	});

	it("rejects slashes", () => {
		expect(() =>
			validateUuid("abc123def456ghi789/kl0", "test"),
		).toThrow("Invalid");
	});
});

describe("validateWhen", () => {
	it("accepts named values", () => {
		for (const v of ["today", "tomorrow", "evening", "anytime", "someday"]) {
			expect(() => validateWhen(v, "test")).not.toThrow();
		}
	});

	it("accepts valid date strings", () => {
		expect(() => validateWhen("2026-04-18", "test")).not.toThrow();
		expect(() => validateWhen("2026-12-31", "test")).not.toThrow();
	});

	it("rejects natural language dates", () => {
		expect(() => validateWhen("next tuesday", "test")).toThrow("Invalid when");
		expect(() => validateWhen("in 3 days", "test")).toThrow("Invalid when");
	});

	it("rejects out-of-range dates", () => {
		expect(() => validateWhen("1999-01-01", "test")).toThrow("year");
		expect(() => validateWhen("2026-13-01", "test")).toThrow("month");
		expect(() => validateWhen("2026-04-32", "test")).toThrow("day");
	});
});

describe("validateDate", () => {
	it("accepts valid dates", () => {
		expect(() => validateDate("2026-04-18", "deadline", "test")).not.toThrow();
	});

	it("rejects malformed dates", () => {
		expect(() => validateDate("April 18", "deadline", "test")).toThrow(
			"YYYY-MM-DD",
		);
		expect(() => validateDate("18/04/2026", "deadline", "test")).toThrow(
			"YYYY-MM-DD",
		);
	});
});
