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
import { requireRole } from "../middleware/authorize.js";

const router = Router();
const adminOnly = requireRole("admin");

router.post("/add", authenticate, adminOnly, addStudentHeader);
router.post("/add-teacher", authenticate, adminOnly, addTeacherHeader);
router.post("/update", authenticate, adminOnly, updateStudentHeader);
router.post("/update-teacher", authenticate, adminOnly, updateTeacherHeader);
router.post("/delete", authenticate, adminOnly, deleteStudentHeader);
router.post("/delete-teacher", authenticate, adminOnly, deleteTeacherHeader);

export default router;
