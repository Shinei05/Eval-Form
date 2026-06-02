import { Router } from "express";
import multer from "multer";
import {
	csvImport,
	getSubjects,
	getSchedule,
	setSchedule,
	aiSummary,
	exportCSV,
	exportTeacherReport,
	exportAllTeachersReport,
	getTeacherReportData,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/csv-import", authenticate, upload.single("file"), csvImport);
router.post("/subjects", authenticate, getSubjects);
router.post("/schedule", authenticate, getSchedule);
router.post("/set-schedule", authenticate, setSchedule);
router.post("/ai-summary", authenticate, aiSummary);
router.post("/export", authenticate, exportCSV);
router.post("/export-teacher", authenticate, exportTeacherReport);
router.post("/export-all-teachers", authenticate, exportAllTeachersReport);
router.post("/teacher-report-data", authenticate, getTeacherReportData);

export default router;
