import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("JWT configuration", () => {
	it("refuses to start without a JWT secret", () => {
		const env = { ...process.env };
		delete env.JWT_SECRET;
		const result = spawnSync(
			process.execPath,
			["--input-type=module", "-e", "import('./src/config/jwt.js')"],
			{ cwd: process.cwd(), env, encoding: "utf8" },
		);
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("JWT_SECRET must be configured");
	});
});
