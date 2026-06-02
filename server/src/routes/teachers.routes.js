import { Router } from "express";
import {
	listTeachers,
	listTeachersFaculty,
	getTeacherById,
	createTeacher,
	editTeacher,
	deleteTeacher,
	listArchivedTeachers,
	restoreTeacher,
} from "../controllers/teachers.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/list", authenticate, listTeachers);
router.post("/list-faculty", authenticate, listTeachersFaculty);
router.post("/get-by-id", authenticate, getTeacherById);
router.post("/create", authenticate, createTeacher);
router.post("/edit", authenticate, editTeacher);
router.post("/delete", authenticate, deleteTeacher);
router.post("/archived", authenticate, listArchivedTeachers);
router.post("/restore", authenticate, restoreTeacher);

export default router;
