import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import pool from "../config/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Route to serve the beautiful health dashboard UI
router.get("/health", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/health-dashboard.html"));
});

// Route to return detailed health telemetry
router.get("/api/health/details", async (req, res) => {
	let dbStatus = "unknown";
	let dbError = null;
	const dbStart = Date.now();
	let dbLatency = 0;

	try {
		// Test database connectivity
		await pool.query("SELECT 1");
		dbStatus = "connected";
		dbLatency = Date.now() - dbStart;
	} catch (err) {
		dbStatus = "error";
		dbError = err.message;
	}

	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		cpu: {
			platform: os.platform(),
			arch: os.arch(),
			loadavg: os.loadavg(),
			cpus: os.cpus().length,
			freeMem: os.freemem(),
			totalMem: os.totalmem(),
		},
		database: {
			status: dbStatus,
			latencyMs: dbLatency,
			error: dbError,
		},
		env: {
			hasDatabaseUrl: !!process.env.DATABASE_URL,
			hasCorsOrigin: !!process.env.CORS_ORIGIN,
			nodeEnv: process.env.NODE_ENV || "development",
		},
	});
});

export default router;
