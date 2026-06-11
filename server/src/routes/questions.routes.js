import { Router } from "express";
import multer from "multer";
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
	getQuestionVersions,
	setActiveQuestionVersion,
	uploadQuestionsDocx,
} from "../controllers/questions.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// New version management routes
router.post("/versions", authenticate, getQuestionVersions);
router.post("/set-active", authenticate, setActiveQuestionVersion);
router.post("/upload", authenticate, upload.single("file"), uploadQuestionsDocx);

export default router;
