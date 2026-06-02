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

const router = Router();

router.post("/submit-student", authenticate, submitStudent);
router.post("/submit-teacher", authenticate, submitTeacher);
router.post("/answers-student", authenticate, getStudentAnswers);
router.post("/answers-teacher", authenticate, getTeacherAnswers);
router.post("/merge-student", authenticate, mergeStudentAnswers);
router.post("/merge-teacher", authenticate, mergeTeacherAnswers);
router.post("/view-student", authenticate, viewStudentEvaluations);
router.post("/view-teacher", authenticate, viewTeacherEvaluations);
router.post("/chart-student", authenticate, getChartDataStudent);
router.post("/chart-teacher", authenticate, getChartDataTeacher);
router.post("/list-student-evaluators", authenticate, listStudentEvaluators);
router.post("/list-teacher-evaluators", authenticate, listTeacherEvaluators);
router.post("/my-evaluations", authenticate, getMyEvaluations);
router.post("/check-status", authenticate, checkEvalStatus);

export default router;
