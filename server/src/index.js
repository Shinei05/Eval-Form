import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import headersRoutes from "./routes/headers.routes.js";
import evaluationsRoutes from "./routes/evaluations.routes.js";
import teachersRoutes from "./routes/teachers.routes.js";
import studentsRoutes from "./routes/students.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global middleware ───────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
	? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
	: ["http://localhost:5173"];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ──────────────────────────────────────────
app.use(
	morgan(":method :url :status :response-time ms - :res[content-length]"),
);

// ─── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/headers", headersRoutes);
app.use("/api/evaluations", evaluationsRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/admin", adminRoutes);

// ─── Error handler (must be last) ───────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
