const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const API = {
	// ─── Auth ────────────────────────────────────────────
	login: `${API_BASE}/auth/login`,
	register: `${API_BASE}/auth/register`,
	loginTeacher: `${API_BASE}/auth/login-teacher`,
	loginAdmin: `${API_BASE}/auth/login-admin`,
	resetPassword: `${API_BASE}/auth/reset`,
	changePassword: `${API_BASE}/auth/change-password`,
	verifyResetCode: `${API_BASE}/auth/verify-reset-code`,
	emailVerifyCode: `${API_BASE}/auth/email-verify-code`,
	emailVerifySend: `${API_BASE}/auth/email-verify-send`,
	verificationCheck: `${API_BASE}/auth/verification-check`,
	updatePassword: `${API_BASE}/auth/update-password`,
	profile: `${API_BASE}/auth/profile`,

	// ─── Teachers ────────────────────────────────────────
	teachersList: `${API_BASE}/teachers/list`,
	teachersListFaculty: `${API_BASE}/teachers/list-faculty`,
	teacherGetById: `${API_BASE}/teachers/get-by-id`,
	teacherCreate: `${API_BASE}/teachers/create`,
	teacherEdit: `${API_BASE}/teachers/edit`,
	teacherDelete: `${API_BASE}/teachers/delete`,
	teacherArchivedList: `${API_BASE}/teachers/archived`,
	teacherRestore: `${API_BASE}/teachers/restore`,

	// ─── Students ────────────────────────────────────────
	studentGetById: `${API_BASE}/students/get-by-id`,
	studentGetEvaluator: `${API_BASE}/students/get-evaluator-id`,
	studentCount: `${API_BASE}/students/count`,

	// ─── Questions (student eval) ────────────────────────
	questionsStudent: `${API_BASE}/questions/student`,
	questionsStudentAll: `${API_BASE}/questions/student-all`,
	questionUpdate: `${API_BASE}/questions/update`,
	questionDelete: `${API_BASE}/questions/delete`,
	questionAdd: `${API_BASE}/questions/add`,

	// ─── Questions (teacher eval) ────────────────────────
	questionsTeacher: `${API_BASE}/questions/teacher`,
	questionsTeacherAll: `${API_BASE}/questions/teacher-all`,
	questionUpdateTeacher: `${API_BASE}/questions/update-teacher`,
	questionDeleteTeacher: `${API_BASE}/questions/delete-teacher`,
	questionAddTeacher: `${API_BASE}/questions/add-teacher`,

	// ─── Questionnaire Version Management ──────────────────
	questionsVersions: `${API_BASE}/questions/versions`,
	questionsSetActive: `${API_BASE}/questions/set-active`,
	questionsUpload: `${API_BASE}/questions/upload`,

	// ─── Headers ─────────────────────────────────────────
	headerAdd: `${API_BASE}/headers/add`,
	headerAddTeacher: `${API_BASE}/headers/add-teacher`,
	headerUpdate: `${API_BASE}/headers/update`,
	headerUpdateTeacher: `${API_BASE}/headers/update-teacher`,
	headerDelete: `${API_BASE}/headers/delete`,
	headerDeleteTeacher: `${API_BASE}/headers/delete-teacher`,

	// ─── Evaluations ─────────────────────────────────────
	evalSubmitStudent: `${API_BASE}/evaluations/submit-student`,
	evalSubmitTeacher: `${API_BASE}/evaluations/submit-teacher`,
	evalAnswersStudent: `${API_BASE}/evaluations/answers-student`,
	evalAnswersTeacher: `${API_BASE}/evaluations/answers-teacher`,
	evalMergeStudent: `${API_BASE}/evaluations/merge-student`,
	evalMergeTeacher: `${API_BASE}/evaluations/merge-teacher`,
	evalViewStudent: `${API_BASE}/evaluations/view-student`,
	evalViewTeacher: `${API_BASE}/evaluations/view-teacher`,
	evalChartStudent: `${API_BASE}/evaluations/chart-student`,
	evalChartTeacher: `${API_BASE}/evaluations/chart-teacher`,
	evalListStudentEvaluators: `${API_BASE}/evaluations/list-student-evaluators`,
	evalListTeacherEvaluators: `${API_BASE}/evaluations/list-teacher-evaluators`,
	evalMyEvaluations: `${API_BASE}/evaluations/my-evaluations`,
	evalCheckStatus: `${API_BASE}/evaluations/check-status`,

	// ─── Admin ───────────────────────────────────────────
	csvImport: `${API_BASE}/admin/csv-import`,
	subjects: `${API_BASE}/admin/subjects`,
	schedule: `${API_BASE}/admin/schedule`,
	setSchedule: `${API_BASE}/admin/set-schedule`,
	resetSchedule: `${API_BASE}/admin/reset-schedule`,
	aiSummary: `${API_BASE}/admin/ai-summary`,
	exportCSV: `${API_BASE}/admin/export`,
	exportTeacherReport: `${API_BASE}/admin/export-teacher`,
	exportAllTeachersReport: `${API_BASE}/admin/export-all-teachers`,
	teacherReportData: `${API_BASE}/admin/teacher-report-data`,

	// ─── Announcements ───────────────────────────────────
	announcements: `${API_BASE}/announcements`,
};

export default API;
