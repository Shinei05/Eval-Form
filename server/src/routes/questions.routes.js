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
import { requireRole } from "../middleware/authorize.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const adminOnly = requireRole("admin");

router.post("/student", getStudentQuestions);
router.post("/student-all", getStudentQuestionsAll);
router.post("/teacher", getTeacherQuestions);
router.post("/teacher-all", getTeacherQuestionsAll);
router.post("/update", authenticate, adminOnly, updateStudentQuestion);
router.post("/update-teacher", authenticate, adminOnly, updateTeacherQuestion);
router.post("/delete", authenticate, adminOnly, deleteStudentQuestion);
router.post("/delete-teacher", authenticate, adminOnly, deleteTeacherQuestion);
router.post("/add", authenticate, adminOnly, addStudentQuestion);
router.post("/add-teacher", authenticate, adminOnly, addTeacherQuestion);

// New version management routes
router.post("/versions", authenticate, adminOnly, getQuestionVersions);
router.post("/set-active", authenticate, adminOnly, setActiveQuestionVersion);
router.post("/upload", authenticate, adminOnly, upload.single("file"), uploadQuestionsDocx);

export default router;
