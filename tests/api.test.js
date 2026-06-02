import { describe, it, expect } from "vitest";
import API from "../src/utils/api.js";

const BASE = "http://localhost:3000/api";

describe("API endpoint configuration", () => {
	it("exports an object with endpoint URLs", () => {
		expect(API).toBeDefined();
		expect(typeof API).toBe("object");
	});

	// ────────────────── Auth endpoints ─────────────────────

	describe("auth endpoints", () => {
		it("has correct login URL", () => {
			expect(API.login).toBe(`${BASE}/auth/login`);
		});

		it("has correct register URL", () => {
			expect(API.register).toBe(`${BASE}/auth/register`);
		});

		it("has correct loginTeacher URL", () => {
			expect(API.loginTeacher).toBe(`${BASE}/auth/login-teacher`);
		});

		it("has correct loginAdmin URL", () => {
			expect(API.loginAdmin).toBe(`${BASE}/auth/login-admin`);
		});

		it("has correct resetPassword URL", () => {
			expect(API.resetPassword).toBe(`${BASE}/auth/reset`);
		});

		it("has correct changePassword URL", () => {
			expect(API.changePassword).toBe(`${BASE}/auth/change-password`);
		});
	});

	// ────────────────── Teacher endpoints ──────────────────

	describe("teacher endpoints", () => {
		it("has correct teachersList URL", () => {
			expect(API.teachersList).toBe(`${BASE}/teachers/list`);
		});

		it("has correct teachersListFaculty URL", () => {
			expect(API.teachersListFaculty).toBe(
				`${BASE}/teachers/list-faculty`,
			);
		});

		it("has correct teacherEdit URL", () => {
			expect(API.teacherEdit).toBe(`${BASE}/teachers/edit`);
		});
	});

	// ────────────────── Student endpoints ──────────────────

	describe("student endpoints", () => {
		it("has correct studentGetById URL", () => {
			expect(API.studentGetById).toBe(`${BASE}/students/get-by-id`);
		});

		it("has correct studentGetEvaluator URL", () => {
			expect(API.studentGetEvaluator).toBe(`${BASE}/students/get-evaluator-id`);
		});
	});

	// ────────────────── Question endpoints ─────────────────

	describe("question endpoints", () => {
		it("has student question URLs", () => {
			expect(API.questionsStudent).toBe(`${BASE}/questions/student`);
			expect(API.questionsStudentAll).toBe(
				`${BASE}/questions/student-all`,
			);
			expect(API.questionAdd).toBe(`${BASE}/questions/add`);
		});

		it("has teacher question URLs", () => {
			expect(API.questionsTeacher).toBe(`${BASE}/questions/teacher`);
			expect(API.questionsTeacherAll).toBe(
				`${BASE}/questions/teacher-all`,
			);
			expect(API.questionAddTeacher).toBe(
				`${BASE}/questions/add-teacher`,
			);
		});
	});

	// ────────────────── Evaluation endpoints ───────────────

	describe("evaluation endpoints", () => {
		it("has submit endpoints", () => {
			expect(API.evalSubmitStudent).toBe(
				`${BASE}/evaluations/submit-student`,
			);
			expect(API.evalSubmitTeacher).toBe(
				`${BASE}/evaluations/submit-teacher`,
			);
		});

		it("has merge endpoints", () => {
			expect(API.evalMergeStudent).toBe(
				`${BASE}/evaluations/merge-student`,
			);
			expect(API.evalMergeTeacher).toBe(
				`${BASE}/evaluations/merge-teacher`,
			);
		});

		it("has chart endpoints", () => {
			expect(API.evalChartStudent).toBe(
				`${BASE}/evaluations/chart-student`,
			);
			expect(API.evalChartTeacher).toBe(
				`${BASE}/evaluations/chart-teacher`,
			);
		});

		it("has evaluator listing endpoints", () => {
			expect(API.evalListStudentEvaluators).toBe(
				`${BASE}/evaluations/list-student-evaluators`,
			);
			expect(API.evalListTeacherEvaluators).toBe(
				`${BASE}/evaluations/list-teacher-evaluators`,
			);
		});
	});

	// ────────────────── Admin endpoints ────────────────────

	describe("admin endpoints", () => {
		it("has correct admin URLs", () => {
			expect(API.csvImport).toBe(`${BASE}/admin/csv-import`);
			expect(API.subjects).toBe(`${BASE}/admin/subjects`);
			expect(API.schedule).toBe(`${BASE}/admin/schedule`);
			expect(API.aiSummary).toBe(`${BASE}/admin/ai-summary`);
			expect(API.exportCSV).toBe(`${BASE}/admin/export`);
		});
	});

	// ────────────────── Header endpoints ───────────────────

	describe("header endpoints", () => {
		it("has student header URLs", () => {
			expect(API.headerAdd).toBe(`${BASE}/headers/add`);
			expect(API.headerUpdate).toBe(`${BASE}/headers/update`);
			expect(API.headerDelete).toBe(`${BASE}/headers/delete`);
		});

		it("has teacher header URLs", () => {
			expect(API.headerAddTeacher).toBe(`${BASE}/headers/add-teacher`);
			expect(API.headerUpdateTeacher).toBe(
				`${BASE}/headers/update-teacher`,
			);
			expect(API.headerDeleteTeacher).toBe(
				`${BASE}/headers/delete-teacher`,
			);
		});
	});

	// ────────────────── Completeness check ─────────────────

	it("has all expected endpoint keys", () => {
		const expectedKeys = [
			"login",
			"register",
			"loginTeacher",
			"loginAdmin",
			"resetPassword",
			"changePassword",
			"verifyResetCode",
			"emailVerifyCode",
			"emailVerifySend",
			"verificationCheck",
			"teachersList",
			"teachersListFaculty",
			"teacherGetById",
			"teacherCreate",
			"teacherEdit",
			"teacherDelete",
			"studentGetById",
			"studentGetEvaluator",
			"questionsStudent",
			"questionsStudentAll",
			"questionUpdate",
			"questionDelete",
			"questionAdd",
			"questionsTeacher",
			"questionsTeacherAll",
			"questionUpdateTeacher",
			"questionDeleteTeacher",
			"questionAddTeacher",
			"headerAdd",
			"headerAddTeacher",
			"headerUpdate",
			"headerUpdateTeacher",
			"headerDelete",
			"headerDeleteTeacher",
			"evalSubmitStudent",
			"evalSubmitTeacher",
			"evalAnswersStudent",
			"evalAnswersTeacher",
			"evalMergeStudent",
			"evalMergeTeacher",
			"evalViewStudent",
			"evalViewTeacher",
			"evalChartStudent",
			"evalChartTeacher",
			"evalListStudentEvaluators",
			"evalListTeacherEvaluators",
			"csvImport",
			"subjects",
			"schedule",
			"setSchedule",
			"aiSummary",
			"exportCSV",
		];
		for (const key of expectedKeys) {
			expect(API).toHaveProperty(key);
			expect(typeof API[key]).toBe("string");
			expect(API[key]).toMatch(/^http/);
		}
	});
});
