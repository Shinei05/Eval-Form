import { Router } from "express";
import {
	getStudentQuestions,
	getStudentQuestionsAll,
	getTeacherQuestions,
	getTeacherQuestionsAll,
	updateStudentQuestion,
	updateTeacherQuestion,
	deleteStudentQuestion,
	deleteTeacherQuestion,
	addStudentQuestion,
	addTeacherQuestion,
} from "../controllers/questions.controller.js";

const router = Router();

router.post("/student", getStudentQuestions);
router.post("/student-all", getStudentQuestionsAll);
router.post("/teacher", getTeacherQuestions);
router.post("/teacher-all", getTeacherQuestionsAll);
router.post("/update", updateStudentQuestion);
router.post("/update-teacher", updateTeacherQuestion);
router.post("/delete", deleteStudentQuestion);
router.post("/delete-teacher", deleteTeacherQuestion);
router.post("/add", addStudentQuestion);
router.post("/add-teacher", addTeacherQuestion);

export default router;
