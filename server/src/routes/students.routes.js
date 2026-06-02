import { Router } from "express";
import {
	getStudentById,
	getEvaluatorById,
	getStudentCount,
} from "../controllers/students.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/get-by-id", authenticate, getStudentById);
router.post("/get-evaluator-id", authenticate, getEvaluatorById);
router.get("/count", authenticate, getStudentCount);

export default router;
