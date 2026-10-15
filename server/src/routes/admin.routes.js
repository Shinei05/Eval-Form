import { Router } from "express";
import multer from "multer";
import {
	csvImport,
	getSubjects,
	getSchedule,
	setSchedule,
	resetSchedule,
	aiSummary,
	exportCSV,
	exportTeacherReport,
	exportAllTeachersReport,
	getTeacherReportData,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const adminOnly = requireRole("admin");

router.post("/csv-import", authenticate, adminOnly, upload.single("file"), csvImport);
router.post("/subjects", authenticate, adminOnly, getSubjects);
router.post("/schedule", authenticate, getSchedule);
router.post("/set-schedule", authenticate, adminOnly, setSchedule);
router.post("/reset-schedule", authenticate, adminOnly, resetSchedule);
router.post("/ai-summary", authenticate, adminOnly, aiSummary);
router.post("/export", authenticate, adminOnly, exportCSV);
router.post("/export-teacher", authenticate, adminOnly, exportTeacherReport);
router.post("/export-all-teachers", authenticate, adminOnly, exportAllTeachersReport);
router.post("/teacher-report-data", authenticate, adminOnly, getTeacherReportData);

export default router;
