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
import { requireRole } from "../middleware/authorize.js";
import { requireStudentOwner, requireSelfUserId } from "../middleware/ownership.js";

const router = Router();
const adminOnly = requireRole("admin");

router.post("/list", authenticate, requireRole("student"), requireStudentOwner("id"), listTeachers);
router.post("/list-faculty", authenticate, requireRole("teacher", "admin"), requireSelfUserId("id", { allowAdmin: true }), listTeachersFaculty);
router.post("/get-by-id", authenticate, getTeacherById);
router.post("/create", authenticate, adminOnly, createTeacher);
router.post("/edit", authenticate, adminOnly, editTeacher);
router.post("/delete", authenticate, adminOnly, deleteTeacher);
router.post("/archived", authenticate, adminOnly, listArchivedTeachers);
router.post("/restore", authenticate, adminOnly, restoreTeacher);

export default router;
