import { Router } from "express";
import {
	loginStudent,
	loginTeacher,
	loginAdmin,
	register,
	resetPassword,
	verifyResetCode,
	changePassword,
	emailVerifyCode,
	emailVerifySend,
	verificationCheck,
	updatePassword,
	getProfile,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/login", loginStudent);
router.post("/login-teacher", loginTeacher);
router.post("/login-admin", loginAdmin);
router.post("/register", register);
router.post("/reset", resetPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/change-password", changePassword);
router.post("/email-verify-code", emailVerifyCode);
router.post("/email-verify-send", emailVerifySend);
router.post("/verification-check", verificationCheck);
router.post("/update-password", updatePassword);
router.get("/profile", authenticate, getProfile);

export default router;
