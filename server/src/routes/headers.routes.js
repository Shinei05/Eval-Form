import { Router } from "express";
import {
	addStudentHeader,
	addTeacherHeader,
	updateStudentHeader,
	updateTeacherHeader,
	deleteStudentHeader,
	deleteTeacherHeader,
} from "../controllers/headers.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/add", authenticate, addStudentHeader);
router.post("/add-teacher", authenticate, addTeacherHeader);
router.post("/update", authenticate, updateStudentHeader);
router.post("/update-teacher", authenticate, updateTeacherHeader);
router.post("/delete", authenticate, deleteStudentHeader);
router.post("/delete-teacher", authenticate, deleteTeacherHeader);

export default router;
