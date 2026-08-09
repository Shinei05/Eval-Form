import express from "express";
import {
	getAnnouncements,
	getAnnouncementsFeed,
	createAnnouncement,
	deleteAnnouncement,
	updateAnnouncement,
	markAsRead,
	markAllAsRead
} from "../controllers/announcements.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all announcements (teachers, students, admins can read)
router.get("/", authenticate, getAnnouncements);

// Create an announcement (admins only)
router.post("/", authenticate, createAnnouncement);

// Delete an announcement (admins only)
router.delete("/:id", authenticate, deleteAnnouncement);

// Update an announcement (admins only)
router.put("/:id", authenticate, updateAnnouncement);

// Get feed for current user
router.get("/feed", authenticate, getAnnouncementsFeed);

// Mark specific announcement as read
router.post("/:id/read", authenticate, markAsRead);

// Mark all announcements as read
router.post("/read-all", authenticate, markAllAsRead);

export default router;
