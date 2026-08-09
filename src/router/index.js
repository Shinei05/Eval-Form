import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "../utils/auth";

// ─── Layouts ─────────────────────────────────────────────
const AdminLayout = () => import("../layouts/AdminLayout.vue");
const StudentLayout = () => import("../layouts/StudentLayout.vue");
const TeacherLayout = () => import("../layouts/TeacherLayout.vue");
const AuthLayout = () => import("../layouts/AuthLayout.vue");

// ─── Auth views ──────────────────────────────────────────
const LoginPage = () => import("../views/auth/LoginPage.vue");
const RegisterPage = () => import("../views/auth/RegisterPage.vue");

// ─── Role dashboards ────────────────────────────────────
const StudentDashboard = () => import("../views/student/StudentDashboard.vue");
const TeacherDashboard = () => import("../views/teacher/TeacherDashboard.vue");
const AdminDashboard = () => import("../views/admin/AdminDashboard.vue");

// ─── Admin sub-pages ────────────────────────────────────
const SchedulerPage = () => import("../views/admin/SchedulerPage.vue");
const FileUploadPage = () => import("../views/admin/FileUploadPage.vue");
const QuestionsPage = () => import("../views/admin/QuestionsPage.vue");
const AnnouncementsPage = () => import("../views/admin/AnnouncementsPage.vue");
const AnnouncementBoard = () => import("../views/AnnouncementBoard.vue");

const SettingsPage = () => import("../views/SettingsPage.vue");

// ─── Evaluation views ───────────────────────────────────
const EvalForm = () => import("../views/evaluations/EvalForm.vue");
const EvalResult = () => import("../views/evaluations/EvalResult.vue");
const PerformanceGraph = () =>
	import("../views/evaluations/PerformanceGraph.vue");

// ─── Misc ───────────────────────────────────────────────
const NotFound = () => import("../views/NotFound.vue");
const ScheduleClosed = () => import("../views/ScheduleClosed.vue");

// ═════════════════════════════════════════════════════════
//  Routes
// ═════════════════════════════════════════════════════════
const routes = [
	// ── Public ──────────────────────────────────────────
	{
		path: "/",
		component: AuthLayout,
		children: [
			{
				path: "",
				name: "Dashboard",
				component: LoginPage,
				meta: { title: "EduRate — Login", requiresAuth: false },
			},
			{
				path: "login",
				name: "Login",
				component: LoginPage,
				meta: { title: "EduRate — Login", requiresAuth: false },
			},
		],
	},

	// ── Student ─────────────────────────────────────────
	{
		path: "/student",
		component: StudentLayout,
		meta: { requiresAuth: true },
		children: [
			{
				path: "",
				name: "Student",
				component: StudentDashboard,
				meta: { title: "Student Dashboard", requiresAuth: true },
			},
			{
				path: "settings",
				name: "StudentSettings",
				component: SettingsPage,
				meta: { title: "Student Settings", requiresAuth: true },
			},
			{
				path: "announcements",
				name: "StudentAnnouncements",
				component: AnnouncementBoard,
				meta: { title: "Announcement Board", requiresAuth: true },
			},
		],
	},
	{
		path: "/student-eval/:id",
		name: "student-eval",
		component: EvalForm,
		props: { type: "student" },
		meta: { title: "Student Evaluation", requiresAuth: true },
	},

	// ── Teacher ─────────────────────────────────────────
	{
		path: "/teacher",
		component: TeacherLayout,
		meta: { requiresAuth: true },
		children: [
			{
				path: "",
				name: "Teacher",
				component: TeacherDashboard,
				meta: { title: "Teacher Dashboard", requiresAuth: true },
			},
			{
				path: "settings",
				name: "TeacherSettings",
				component: SettingsPage,
				meta: { title: "Teacher Settings", requiresAuth: true },
			},
			{
				path: "announcements",
				name: "TeacherAnnouncements",
				component: AnnouncementBoard,
				meta: { title: "Announcement Board", requiresAuth: true },
			},
		],
	},
	{
		path: "/teacher-eval/:id",
		name: "teacher-eval",
		component: EvalForm,
		props: { type: "teacher" },
		meta: { title: "Teacher Evaluation", requiresAuth: true },
	},

	// ── Admin (nested under AdminLayout) ────────────────
	{
		path: "/principal",
		component: AdminLayout,
		meta: { requiresAuth: true },
		children: [
			{
				path: "",
				name: "Principal",
				component: AdminDashboard,
				meta: { title: "Admin Dashboard", requiresAuth: true },
			},
			{
				path: "scheduler",
				name: "admin-scheduler",
				component: SchedulerPage,
				meta: { title: "Scheduler" },
			},
			{
				path: "file-upload",
				name: "admin-file-upload",
				component: FileUploadPage,
				meta: { title: "Upload CSV" },
			},
			{
				path: "announcements",
				name: "admin-announcements",
				component: AnnouncementsPage,
				meta: { title: "Announcements" },
			},
			{
				path: "questions-student",
				name: "admin-questions-student",
				component: QuestionsPage,
				props: { type: "student" },
				meta: { title: "Student Questions" },
			},
			{
				path: "questions-teacher",
				name: "admin-questions-teacher",
				component: QuestionsPage,
				props: { type: "teacher" },
				meta: { title: "Teacher Questions" },
			},
			{
				path: "settings",
				name: "admin-settings",
				component: SettingsPage,
				meta: { title: "Admin Settings" },
			},
		],
	},

	// ── Eval results (printable) ────────────────────────
	{
		path: "/eval-result-student/:id/:tcrid/:evtid",
		name: "printable-form",
		component: EvalResult,
		props: (route) => ({
			type: "student",
			mode: "individual",
			...route.params,
		}),
		meta: { title: "Student Eval Result", requiresAuth: true },
	},
	{
		path: "/eval-result-teacher/:id/:tcrid/:evtid",
		name: "printable-form1",
		component: EvalResult,
		props: (route) => ({
			type: "teacher",
			mode: "individual",
			...route.params,
		}),
		meta: { title: "Teacher Eval Result", requiresAuth: true },
	},
	{
		path: "/eval-merge-student/:tcrid/:evtid",
		name: "printable-form2",
		component: EvalResult,
		props: (route) => ({ type: "student", mode: "merge", ...route.params }),
		meta: { title: "Student Eval Average", requiresAuth: true },
	},
	{
		path: "/eval-merge-teacher/:tcrid/:evtid",
		name: "printable-form3",
		component: EvalResult,
		props: (route) => ({ type: "teacher", mode: "merge", ...route.params }),
		meta: { title: "Teacher Eval Average", requiresAuth: true },
	},
	{
		path: "/admin/export-report/:tcrid",
		name: "export-report",
		component: () => import("../views/admin/ExportReport.vue"),
		meta: { title: "Teacher Summary Report", requiresAuth: true },
	},

	// ── Performance graphs ──────────────────────────────
	{
		path: "/perf-graph-student/:id",
		name: "perf-graph-student",
		component: PerformanceGraph,
		props: { type: "student" },
		meta: { title: "Student Performance", requiresAuth: true },
	},
	{
		path: "/perf-graph-teacher/:id",
		name: "perf-graph-teacher",
		component: PerformanceGraph,
		props: { type: "teacher" },
		meta: { title: "Teacher Performance", requiresAuth: true },
	},

	// ── 404 catch-all ───────────────────────────────────
	{
		path: "/closed",
		name: "ScheduleClosed",
		component: ScheduleClosed,
		meta: { title: "Evaluations Closed", requiresAuth: false },
	},
	{
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: NotFound,
		meta: { title: "Page Not Found" },
	},
];

// ═════════════════════════════════════════════════════════
//  Router instance
// ═════════════════════════════════════════════════════════
const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior: () => ({ top: 0 }),
});

// ── Auth guard ───────────────────────────────────────────
router.beforeEach((to, from, next) => {
	if (to.meta?.title) document.title = to.meta.title;

	if (to.matched.some((r) => r.meta.requiresAuth)) {
		if (!isAuthenticated()) {
			return next({ path: "/login", query: { redirect: to.fullPath } });
		}
	}
	next();
});

export default router;
