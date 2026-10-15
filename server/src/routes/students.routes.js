import { Router } from "express";
import {
	getStudentById,
	getEvaluatorById,
	getStudentCount,
} from "../controllers/students.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = Router();

router.post("/get-by-id", authenticate, requireRole("admin"), getStudentById);
router.post("/get-evaluator-id", authenticate, requireRole("admin"), getEvaluatorById);
router.get("/count", authenticate, requireRole("admin"), getStudentCount);

export default router;
