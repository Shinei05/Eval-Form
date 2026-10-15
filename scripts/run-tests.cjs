const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Vitest writes transform files to os.tmpdir(). Keep those writes in the project
// on Windows installations where the default sandbox temp directory is restricted.
const tempDir = path.join(process.cwd(), "node_modules", ".cache", "eval-vitest");
fs.mkdirSync(tempDir, { recursive: true });
const args = process.argv.slice(2);
const mode = args[0] === "watch" ? args.shift() : "run";

const result = spawnSync(
	process.execPath,
	[path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs"), mode, ...args],
	{
		stdio: "inherit",
		env: { ...process.env, TEMP: tempDir, TMP: tempDir, TMPDIR: tempDir },
	},
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
