import { Router } from "express";
import {
	submitStudent,
	submitTeacher,
	getStudentAnswers,
	getTeacherAnswers,
	mergeStudentAnswers,
	mergeTeacherAnswers,
	viewStudentEvaluations,
	viewTeacherEvaluations,
	getChartDataStudent,
	getChartDataTeacher,
	listStudentEvaluators,
	listTeacherEvaluators,
	getMyEvaluations,
	checkEvalStatus,
} from "../controllers/evaluations.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { requireStudentOwner, requireSelfUserId, requireEvaluationOwner } from "../middleware/ownership.js";

const router = Router();
const adminOnly = requireRole("admin");

router.post("/submit-student", authenticate, requireRole("student"), requireStudentOwner("stid"), submitStudent);
router.post("/submit-teacher", authenticate, requireRole("teacher"), requireSelfUserId("stid"), submitTeacher);
router.post("/answers-student", authenticate, adminOnly, getStudentAnswers);
router.post("/answers-teacher", authenticate, adminOnly, getTeacherAnswers);
router.post("/merge-student", authenticate, adminOnly, mergeStudentAnswers);
router.post("/merge-teacher", authenticate, adminOnly, mergeTeacherAnswers);
router.post("/view-student", authenticate, adminOnly, viewStudentEvaluations);
router.post("/view-teacher", authenticate, adminOnly, viewTeacherEvaluations);
router.post("/chart-student", authenticate, adminOnly, getChartDataStudent);
router.post("/chart-teacher", authenticate, adminOnly, getChartDataTeacher);
router.post("/list-student-evaluators", authenticate, adminOnly, listStudentEvaluators);
router.post("/list-teacher-evaluators", authenticate, adminOnly, listTeacherEvaluators);
router.post("/my-evaluations", authenticate, requireRole("teacher"), getMyEvaluations);
router.post("/check-status", authenticate, requireRole("student", "teacher"), requireEvaluationOwner, checkEvalStatus);

export default router;
