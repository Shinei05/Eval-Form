<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import ManageAccounts from "../../components/ManageAccounts.vue";
import ArchivedAccounts from "../../components/ArchivedAccounts.vue";
import Pagination from "../../components/Pagination.vue";
import API from "../../utils/api";
import { getToken } from "../../utils/auth";

const router = useRouter();
const route = useRoute();
const { request, isLoading } = useApi();
const { requireAuth } = useAuth();

// Toast
const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

// Active tab from query
const activeTab = computed(() => route.query.tab || "student");

// Data
const teachers = ref([]);
const studentEvals = ref([]);
const teacherEvals = ref([]);
const teacherCount = ref(0);
const evalCount = ref(0);
const studentTotal = ref(0);
const teacherTotal = ref(0);
const studentSystemCount = ref(0);
const adminProfile = ref({ firstname: "", lastname: "", fullname: "", teacherId: null });

const adminFullName = computed(() => {
	const explicit = (adminProfile.value.fullname || "").trim();
	if (explicit) return explicit;
	const first = (adminProfile.value.firstname || "").trim();
	const last = (adminProfile.value.lastname || "").trim();
	const full = `${first} ${last}`.trim();
	return full || "Admin";
});

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		adminProfile.value = {
			firstname: profile.firstname || "",
			lastname: profile.lastname || "",
			fullname: profile.fullname || "",
			teacherId: profile.teacherId || null,
		};
	}
}

// Detail modals
const showDetailModal = ref(false);
const detailType = ref("student"); // 'student' | 'teacher'
const selectedEval = ref(null);
const evaluatorsList = ref([]);
const showEvaluators = ref(false);
const evaluatorsLoading = ref(false);

// ---- Fetch Functions ----
async function fetchTeachers() {
	const result = await request(API.teachersListFaculty, {
		body: {
			action: "getTeachers",
			page: teacherListPage.value,
			perPage,
		},
	});
	if (result.success) {
		teachers.value = result.teachers || [];
		teacherCount.value = result.total || 0;
	}
}

async function fetchStudentEvals() {
	const result = await request(API.evalViewStudent, {
		body: {
			action: "getEvaluations",
			page: studentPage.value,
			perPage,
		},
	});
	if (result.success) {
		studentEvals.value = (result.evaluations || []).map((e) => ({
			teacher_id: e.teacher_id,
			eval_count: e.eval_count,
			firstname: e.teacher?.firstname,
			lastname: e.teacher?.lastname,
			subject: e.teacher?.subject,
			quarter: e.teacher?.quarter,
			year: e.teacher?.year,
			sentiment: e.teacher?.sentiment,
		}));
		studentTotal.value = result.total || 0;
		evalCount.value = result.total || 0;
	}
}

async function fetchTeacherEvals() {
	const result = await request(API.evalViewTeacher, {
		body: {
			action: "getEvaluation",
			page: teacherEvalPage.value,
			perPage,
		},
	});
	if (result.success) {
		teacherEvals.value = (result.evaluations || []).map((e) => ({
			teacher_id: e.teacher_id,
			eval_count: e.eval_count,
			firstname: e.teacher?.firstname,
			lastname: e.teacher?.lastname,
			subject: e.teacher?.subject,
			quarter: e.teacher?.quarter,
			year: e.teacher?.year,
			sentiment: e.teacher?.sentiment,
		}));
		teacherTotal.value = result.total || 0;
	}
}

async function fetchStudentSystemCount() {
	const result = await request(API.studentCount, { method: "GET" });
	if (result.success) {
		studentSystemCount.value = result.count || 0;
	}
}

// ---- Detail Modal ----
function openDetail(evalItem, type) {
	selectedEval.value = evalItem;
	detailType.value = type;
	showDetailModal.value = true;
	document.body.style.overflow = 'hidden';
}

function closeDetail() {
	showDetailModal.value = false;
	selectedEval.value = null;
	evaluatorsList.value = [];
	showEvaluators.value = false;
	document.body.style.overflow = '';
}

async function viewIndividual() {
	if (showEvaluators.value) {
		showEvaluators.value = false;
		return;
	}
	const e = selectedEval.value;
	evaluatorsLoading.value = true;
	const url =
		detailType.value === "student"
			? API.evalListStudentEvaluators
			: API.evalListTeacherEvaluators;
	const result = await request(url, {
		body: { tcr_id: e.teacher_id },
	});
	if (result.success) {
		evaluatorsList.value = result.evaluators || [];
		showEvaluators.value = true;
	} else {
		notify("Failed to load evaluators", "error");
	}
	evaluatorsLoading.value = false;
}

function goToEvaluator(ev) {
	const e = selectedEval.value;
	if (detailType.value === "student") {
		router.push({
			name: "printable-form",
			params: { id: ev.eval_id, tcrid: e.teacher_id, evtid: ev.evaluator_id },
		});
	} else {
		router.push({
			name: "printable-form1",
			params: { id: ev.eval_id, tcrid: e.teacher_id, evtid: ev.evaluator_id },
		});
	}
}

function viewPerformance() {
	const e = selectedEval.value;
	const name =
		detailType.value === "student"
			? "perf-graph-student"
			: "perf-graph-teacher";
	router.push({ name, params: { id: e.teacher_id } });
}

async function downloadCSV(url, filename, body = {}) {
	try {
		const token = getToken();
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const text = await response.text();
			let errObj = {};
			try { errObj = JSON.parse(text); } catch(e) {}
			throw new Error(errObj.error || errObj.message || "Failed to download file");
		}

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);
		notify("File downloaded successfully", "success");
	} catch (err) {
		notify(err.message || "Failed to download report", "error");
	}
}

async function exportTeacherReport() {
	if (!selectedEval.value) return;
	const teacher = selectedEval.value;
	const routeData = router.resolve({
		name: "export-report",
		params: { tcrid: teacher.teacher_id }
	});
	window.open(routeData.href, "_blank");
}

async function exportAllRatings() {
	const filename = "all_teachers_report.csv";
	await downloadCSV(API.exportAllTeachersReport, filename);
}

// ---- Pagination & Sorting ----
const studentPage = ref(1);
const teacherEvalPage = ref(1);
const teacherListPage = ref(1);
const perPage = 12;

function fetchForTab() {
	if (activeTab.value === "student") fetchStudentEvals();
	if (activeTab.value === "teacher") fetchTeacherEvals();
	if (activeTab.value === "evaluate") fetchTeachers();
}

// Student Evals
const totalStudentPages = computed(() => Math.max(1, Math.ceil(studentTotal.value / perPage)));

// Teacher Evals
const totalTeacherPages = computed(() => Math.max(1, Math.ceil(teacherTotal.value / perPage)));

// Evaluate & Manage Teachers
const sortedTeachers = computed(() => {
	let list = [...teachers.value];
	list.sort((a, b) => {
		const aEval = a.evaluated === "evaluated" ? 1 : 0;
		const bEval = b.evaluated === "evaluated" ? 1 : 0;
		if (aEval !== bEval) return aEval - bEval;
		return 0;
	});
	return list;
});
const totalTeachersPages = computed(() => Math.max(1, Math.ceil(teacherCount.value / perPage)));

// ---- Tab watcher ----
watch(
	activeTab,
	() => {
		if (!requireAuth()) return;
		studentPage.value = 1;
		teacherEvalPage.value = 1;
		teacherListPage.value = 1;
		fetchForTab();
	},
	{ immediate: true },
);

onMounted(() => {
	if (!requireAuth()) return;
	loadProfile();
	fetchStudentSystemCount();
});

onUnmounted(() => {
	document.body.style.overflow = '';
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<!-- Detail Modal -->
	<Transition name="fade">
		<div
			v-if="showDetailModal && selectedEval"
			class="modal-backdrop"
			@click.self="closeDetail"
		>
			<div class="modal-panel card">
				<div class="modal-header">
					<div class="teacher-profile-header">
						<div class="teacher-avatar">
							{{ (selectedEval.firstname?.charAt(0) || '').toUpperCase() + (selectedEval.lastname?.charAt(0) || '').toUpperCase() }}
						</div>
						<div class="teacher-meta-header">
							<h3>{{ selectedEval.firstname }} {{ selectedEval.lastname }}</h3>
							<span class="teacher-title-badge">
								{{ detailType === 'student' ? 'Student Evaluation' : 'Teacher Evaluation' }}
							</span>
						</div>
					</div>
					<button class="modal-close-btn" @click="closeDetail" title="Close">
						<span class="material-icons">close</span>
					</button>
				</div>
				<div class="modal-body">
					<div class="detail-grid">
						<div class="detail-card">
							<div class="detail-card-icon">
								<span class="material-icons">menu_book</span>
							</div>
							<div class="detail-card-content">
								<span class="detail-card-label">Subject</span>
								<span class="detail-card-value">{{ selectedEval.subject }}</span>
							</div>
						</div>
						<div class="detail-card">
							<div class="detail-card-icon">
								<span class="material-icons">timelapse</span>
							</div>
							<div class="detail-card-content">
								<span class="detail-card-label">Quarter</span>
								<span class="detail-card-value">Q{{ selectedEval.quarter }}</span>
							</div>
						</div>
						<div class="detail-card">
							<div class="detail-card-icon">
								<span class="material-icons">calendar_today</span>
							</div>
							<div class="detail-card-content">
								<span class="detail-card-label">Year</span>
								<span class="detail-card-value">{{ selectedEval.year }}</span>
							</div>
						</div>
						<div class="detail-card">
							<div class="detail-card-icon">
								<span class="material-icons">insights</span>
							</div>
							<div class="detail-card-content">
								<span class="detail-card-label">Sentiment</span>
								<span
									class="detail-card-value badge"
									:class="{
										'badge-success': selectedEval.sentiment === 'Positive' || selectedEval.sentiment === 'Very Good' || selectedEval.sentiment === 'Good',
										'badge-warning': selectedEval.sentiment === 'Neutral' || selectedEval.sentiment === 'Average',
										'badge-error': selectedEval.sentiment === 'Negative' || selectedEval.sentiment === 'Poor' || selectedEval.sentiment === 'Very Poor',
									}
								">{{ selectedEval.sentiment || "N/A" }}</span>
							</div>
						</div>
					</div>

					<!-- Evaluators Summary -->
					<div v-if="evaluatorsLoading" class="evaluators-loading">
						<span class="material-icons spin">sync</span>
						Loading summary...
					</div>
					<div v-else-if="showEvaluators" class="evaluators-section">
						<h4 class="evaluators-title">
							<span class="material-icons">analytics</span>
							Evaluation Summary
						</h4>
						<div v-if="evaluatorsList.length === 0" class="empty-evaluators">
							<p>No evaluations found.</p>
						</div>
						<div v-else class="eval-summary">
							<div class="eval-summary-stats">
								<div class="eval-summary-stat">
									<span class="eval-summary-value">{{ evaluatorsList.length }}</span>
									<span class="eval-summary-label">Evaluators</span>
								</div>
								<div class="eval-summary-stat">
									<span class="eval-summary-value primary">{{ (evaluatorsList.reduce((s, e) => s + Number(e.avg), 0) / evaluatorsList.length).toFixed(2) }}</span>
									<span class="eval-summary-label">Avg Score</span>
								</div>
								<div class="eval-summary-stat">
									<span class="eval-summary-value">{{ Math.max(...evaluatorsList.map(e => Number(e.avg))).toFixed(1) }}</span>
									<span class="eval-summary-label">Highest</span>
								</div>
								<div class="eval-summary-stat">
									<span class="eval-summary-value">{{ Math.min(...evaluatorsList.map(e => Number(e.avg))).toFixed(1) }}</span>
									<span class="eval-summary-label">Lowest</span>
								</div>
							</div>
							<div class="eval-score-dist">
								<span class="eval-dist-label">Score Distribution</span>
								<div class="eval-dist-bars">
									<div v-for="range in [{ label: '4.5-5.0', min: 4.5, max: 5.01, color: '#16a34a' },{ label: '3.5-4.4', min: 3.5, max: 4.5, color: '#2563eb' },{ label: '2.5-3.4', min: 2.5, max: 3.5, color: '#d97706' },{ label: '1.0-2.4', min: 1.0, max: 2.5, color: '#dc2626' }]" :key="range.label" class="eval-dist-row">
										<span class="eval-dist-range">{{ range.label }}</span>
										<div class="eval-dist-bar-wrap">
											<div class="eval-dist-bar-fill" :style="{ width: evaluatorsList.length ? (evaluatorsList.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length / evaluatorsList.length * 100) + '%' : '0%', background: range.color }"></div>
										</div>
										<span class="eval-dist-count">{{ evaluatorsList.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length }}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="modal-actions">
					<button class="btn btn-secondary" @click="viewIndividual">
						<span class="material-icons">{{ showEvaluators ? 'expand_less' : 'bar_chart' }}</span>
						{{ showEvaluators ? 'Hide Summary' : 'View Summary' }}
					</button>
					<button class="btn btn-secondary" @click="exportTeacherReport" style="border-color: var(--color-success); color: var(--color-success);">
						<span class="material-icons">picture_as_pdf</span>
						Export PDF
					</button>
					<button class="btn btn-primary" @click="viewPerformance">
						<span class="material-icons">bar_chart</span>
						Performance
					</button>
				</div>
			</div>
		</div>
	</Transition>

	<div class="admin-page">
		<div class="welcome-header" style="margin-bottom: var(--space-6); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);">
			<div>
				<template v-if="activeTab === 'student' || activeTab === 'teacher'">
				<h2>Welcome {{ adminFullName }}!</h2>
				<p>Evaluation System</p>
				</template>
				<template v-else-if="activeTab === 'evaluate'">
					<h2>Evaluate Teachers</h2>
					<p>Select a teacher to begin their performance evaluation</p>
				</template>
				<template v-else-if="activeTab === 'manage'">
					<h2>Account Management</h2>
					<p>Create, edit, and archive faculty accounts</p>
				</template>
				<template v-else-if="activeTab === 'archived'">
					<h2>Archived Teachers</h2>
					<p>View and restore archived faculty accounts</p>
				</template>
			</div>

		</div>
		<!-- Stats -->
		<div v-if="activeTab === 'evaluate'" class="stats-grid">
			<div class="stat-card card-total">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-total">
						<span class="material-icons-outlined">school</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ teacherCount }}</span>
						<span class="stat-label">Teachers</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">Faculty members in the system</span>
				</div>
			</div>
			<div class="stat-card card-students">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-students">
						<span class="material-icons-outlined">group</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ studentSystemCount }}</span>
						<span class="stat-label">Students</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">Students in the system</span>
				</div>
			</div>
			<div class="stat-card card-evaluated">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-stats-evaluated">
						<span class="material-icons-outlined">assignment</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ evalCount }}</span>
						<span class="stat-label">Evaluations</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">Total evaluations submitted</span>
				</div>
			</div>
		</div>

		<!-- ========== Student Evaluations ========== -->
		<div v-if="activeTab === 'student'">
			<h2 class="section-title">Student Evaluations</h2>
			<div class="card-grid">
				<div
					v-for="ev in studentEvals"
					:key="ev.teacher_id"
					class="admin-teacher-card card-clickable"
					@click="openDetail(ev, 'student')"
				>
					<div class="card-inner">
						<div class="card-header">
							<div class="profile-section">
								<div class="person-icon icon-pending">
									<span class="material-icons-outlined">person</span>
								</div>
								<div class="teacher-info">
									<h3>{{ ev.firstname }} {{ ev.lastname }}</h3>
									<p class="subject">{{ ev.subject }}</p>
								</div>
							</div>
						</div>
						<div class="card-meta">
							<span class="meta-tag">Q{{ ev.quarter }} {{ ev.year }}</span>
							<span class="meta-tag">{{ ev.eval_count }} {{ ev.eval_count === 1 ? 'evaluation' : 'evaluations' }}</span>
							<span
								class="meta-tag"
								:class="{
									'sentiment-pos': ev.sentiment === 'Positive' || ev.sentiment === 'Very Good' || ev.sentiment === 'Good',
									'sentiment-neu': ev.sentiment === 'Neutral' || ev.sentiment === 'Average',
									'sentiment-neg': ev.sentiment === 'Negative' || ev.sentiment === 'Poor' || ev.sentiment === 'Very Poor',
								}"
							>{{ ev.sentiment || "N/A" }}</span>
						</div>
					</div>
				</div>
				<div v-if="studentEvals.length === 0" class="empty-state">
					<span class="material-icons">inbox</span>
					<p>No student evaluations yet</p>
				</div>
			</div>
			<Pagination
				:current-page="studentPage"
				:total-pages="totalStudentPages"
				:total-items="studentTotal"
				:per-page="perPage"
				@page-change="studentPage = $event; fetchStudentEvals()"
			/>
		</div>

		<!-- ========== Teacher Evaluations ========== -->
		<div v-if="activeTab === 'teacher'">
			<h2 class="section-title">Teacher Evaluations</h2>
			<div class="card-grid">
				<div
					v-for="ev in teacherEvals"
					:key="ev.teacher_id"
					class="admin-teacher-card card-clickable"
					@click="openDetail(ev, 'teacher')"
				>
					<div class="card-inner">
						<div class="card-header">
							<div class="profile-section">
								<div class="person-icon icon-pending">
									<span class="material-icons-outlined">person</span>
								</div>
								<div class="teacher-info">
									<h3>{{ ev.firstname }} {{ ev.lastname }}</h3>
									<p class="subject">{{ ev.subject }}</p>
								</div>
							</div>
						</div>
						<div class="card-meta">
							<span class="meta-tag">Q{{ ev.quarter }} {{ ev.year }}</span>
							<span class="meta-tag">{{ ev.eval_count }} {{ ev.eval_count === 1 ? 'evaluation' : 'evaluations' }}</span>
							<span
								class="meta-tag"
								:class="{
									'sentiment-pos': ev.sentiment === 'Positive' || ev.sentiment === 'Very Good' || ev.sentiment === 'Good',
									'sentiment-neu': ev.sentiment === 'Neutral' || ev.sentiment === 'Average',
									'sentiment-neg': ev.sentiment === 'Negative' || ev.sentiment === 'Poor' || ev.sentiment === 'Very Poor',
								}"
							>{{ ev.sentiment || "N/A" }}</span>
						</div>
					</div>
				</div>
				<div v-if="teacherEvals.length === 0" class="empty-state">
					<span class="material-icons">inbox</span>
					<p>No teacher evaluations yet</p>
				</div>
			</div>
			<Pagination
				:current-page="teacherEvalPage"
				:total-pages="totalTeacherPages"
				:total-items="teacherTotal"
				:per-page="perPage"
				@page-change="teacherEvalPage = $event; fetchTeacherEvals()"
			/>
		</div>

		<!-- ========== Evaluate Teachers ========== -->
		<div v-if="activeTab === 'evaluate'">

			<div class="card-grid">
				<div
					v-for="teacher in sortedTeachers"
					:key="teacher.id"
					class="admin-teacher-card"
					:class="{ 'card-evaluated': teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1' }"
				>
					<div class="card-inner">
						<div class="card-header">
							<div class="profile-section">
								<div
									class="person-icon"
									:class="(teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1') ? 'icon-evaluated' : 'icon-pending'"
								>
									<span class="material-icons-outlined">person</span>
								</div>
								<div class="teacher-info">
									<h3>{{ teacher.firstname }} {{ teacher.lastname }}</h3>
									<p v-if="teacher.subject" class="subject">{{ teacher.subject }}</p>
								</div>
							</div>
							<div class="status-section">
								<span
									v-if="teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1'"
									class="status-pill pill-evaluated"
								>Evaluated</span>
								<span v-else class="status-pill pill-pending">Pending</span>
							</div>
						</div>
						<div class="card-meta">
							<span v-if="teacher.quarter" class="meta-tag">Q{{ teacher.quarter }} {{ teacher.year }}</span>
						</div>
						<div class="card-footer">
							<button
								v-if="teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1'"
								class="btn-card-action action-disabled"
								disabled
							>
								<span class="material-icons-outlined btn-icon">visibility</span> View Results
							</button>
							<button
								v-else
								class="btn-card-action"
								@click="$router.push({ name: 'teacher-eval', params: { id: teacher.id } })"
							>
								<span class="material-icons-outlined btn-icon">rate_review</span> Start Evaluation
							</button>
						</div>
					</div>
				</div>
				<div v-if="sortedTeachers.length === 0" class="empty-state">
					<span class="material-icons">person_search</span>
					<p>No teachers available</p>
				</div>
			</div>
			<Pagination
				:current-page="teacherListPage"
				:total-pages="totalTeachersPages"
				:total-items="teacherCount"
				:per-page="perPage"
				@page-change="teacherListPage = $event; fetchTeachers()"
			/>
		</div>

		<!-- ========== Account Management ========== -->
		<div v-if="activeTab === 'manage'">
			<h2 class="section-title">Manage Accounts</h2>
			<ManageAccounts :currentTeacherId="adminProfile.teacherId" @notify="notify" />
		</div>

		<!-- ========== Archived Accounts ========== -->
		<div v-if="activeTab === 'archived'">
			<ArchivedAccounts @notify="notify" />
		</div>
	</div>
</template>

<style scoped>
.admin-page {
	animation: fadeIn 0.3s ease;
}

/* Stats */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	gap: var(--space-6);
	margin-bottom: var(--space-8);
}
@media (min-width: 768px) {
	.stats-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

.stat-card {
	border-radius: var(--radius-lg);
	display: flex;
	flex-direction: column;
	border: 1px solid;
}

.card-total { background: #eef2ff; border-color: #c7d2fe; }
.card-students { background: #fffbeb; border-color: #fde68a; }
.card-evaluated { background: #f0fdf4; border-color: #bbf7d0; }

.stat-body {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	padding: var(--space-5) var(--space-6) var(--space-3);
}

.stat-icon-wrap {
	width: 50px;
	height: 50px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.stat-icon-wrap .material-icons-outlined {
	font-size: 1.5rem;
}
.icon-total {
	background: #e0e7ff;
	color: #4f46e5;
}
.icon-students {
	background: #fef3c7;
	color: #d97706;
}
.icon-stats-evaluated {
	background: #bbf7d0;
	color: #16a34a;
}

.stat-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.stat-value {
	font-size: 2rem;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.1;
	letter-spacing: -0.02em;
}

.stat-label {
	font-size: 0.8rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.stat-footer {
	padding: var(--space-2) var(--space-6) var(--space-4);
}

.stat-desc {
	font-size: 0.75rem;
	color: #94a3b8;
}

/* Section */
.section-title {
	font-size: 1.25rem;
	margin-bottom: var(--space-5);
}

/* Card Grid */
.card-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-4);
}

.admin-teacher-card {
	background: #ffffff;
	border-radius: var(--radius-lg);
	display: flex;
	flex-direction: column;
	border-left: 4px solid #f59e0b;
	transition: all var(--transition-base);
}
.admin-teacher-card.card-evaluated { border-left-color: #16a34a; }
.admin-teacher-card.card-clickable { cursor: pointer; }

.admin-teacher-card .card-inner {
	padding: var(--space-5);
	display: flex;
	flex-direction: column;
	flex: 1;
}

.admin-teacher-card .card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: var(--space-3);
}

.admin-teacher-card .profile-section {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	min-width: 0;
}

.admin-teacher-card .person-icon {
	width: 48px;
	height: 48px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.admin-teacher-card .person-icon .material-icons-outlined {
	font-size: 1.5rem;
}
.admin-teacher-card .icon-evaluated {
	background: linear-gradient(135deg, #dcfce7, #bbf7d0);
	color: #16a34a;
}
.admin-teacher-card .icon-pending {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	color: #d97706;
}

.admin-teacher-card .teacher-info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.admin-teacher-card .teacher-info h3 {
	font-size: 1.0625rem;
	font-weight: 700;
	color: #0f172a;
	margin: 0 0 2px 0;
	line-height: 1.2;
	white-space: normal;
	word-break: break-word;
}

.admin-teacher-card .teacher-info .subject {
	font-size: 0.8125rem;
	color: #64748b;
	margin: 0;
	white-space: normal;
	word-break: break-word;
}

.admin-teacher-card .status-section {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	flex-shrink: 0;
}

.admin-teacher-card .status-pill {
	font-size: 0.7rem;
	font-weight: 600;
	padding: 3px 10px;
	border-radius: 999px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.admin-teacher-card .pill-evaluated {
	background: #dcfce7;
	color: #15803d;
}
.admin-teacher-card .pill-pending {
	background: #fef3c7;
	color: #b45309;
}

.admin-teacher-card .card-meta {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin-top: var(--space-4);
	flex: 1;
	align-content: flex-start;
}

.admin-teacher-card .meta-tag {
	font-size: 0.7rem;
	font-weight: 500;
	color: #64748b;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 2px 8px;
	border-radius: 6px;
	white-space: nowrap;
}

.sentiment-pos {
	background: #dcfce7 !important;
	border-color: #bbf7d0 !important;
	color: #15803d !important;
}
.sentiment-neu {
	background: #fef3c7 !important;
	border-color: #fde68a !important;
	color: #b45309 !important;
}
.sentiment-neg {
	background: #fee2e2 !important;
	border-color: #fecaca !important;
	color: #991b1b !important;
}

.admin-teacher-card .card-footer {
	margin-top: var(--space-4);
	display: flex;
}

.admin-teacher-card .btn-card-action {
	width: 100%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: 0.625rem 1rem;
	font-weight: 600;
	font-size: 0.8125rem;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;
	background: #ffffff;
	border: 1px solid #94a3b8;
	color: #0f172a;
}
.admin-teacher-card .btn-card-action:hover:not(:disabled) {
	background: #f8fafc;
	border-color: #64748b;
}

.admin-teacher-card .btn-card-danger {
	background: #fef2f2;
	border-color: #fca5a5;
	color: #dc2626;
}
.admin-teacher-card .btn-card-danger:hover:not(:disabled) {
	background: #fee2e2;
	border-color: #ef4444;
}

.admin-teacher-card .btn-icon {
	font-size: 1.125rem;
}

.admin-teacher-card .action-disabled {
	background: #f1f5f9;
	border-color: #e2e8f0;
	color: #94a3b8;
	cursor: default;
}

/* Sub-tabs */
.sub-tabs {
	display: flex;
	gap: var(--space-2);
	margin-bottom: var(--space-6);
	border-bottom: 1px solid var(--color-border);
	padding-bottom: var(--space-2);
}

.sub-tab {
	padding: var(--space-2) var(--space-4);
	border: none;
	background: none;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text-muted);
	cursor: pointer;
	border-bottom: 2px solid transparent;
	transition: all var(--transition-base);
	border-radius: 0;
}

.sub-tab.active {
	color: var(--color-primary);
	border-bottom-color: var(--color-primary);
}

.sub-tab:hover {
	color: var(--color-text);
}

/* Modal */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 200;
	backdrop-filter: blur(8px);
	padding: var(--space-4);
	animation: fadeIn 0.25s ease;
}

.modal-panel {
	width: 100%;
	max-width: 540px;
	padding: 0 !important;
	overflow: hidden;
	background: #ffffff;
	border: 1px solid rgba(226, 232, 240, 0.8);
	border-radius: var(--radius-xl);
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-5) var(--space-6);
	border-bottom: 1px solid var(--color-border);
	background: linear-gradient(to right, var(--color-bg-page), #ffffff);
}

.teacher-profile-header {
	display: flex;
	align-items: center;
	gap: var(--space-4);
}

.teacher-avatar {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%);
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.15rem;
	font-weight: 700;
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.teacher-meta-header {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.teacher-meta-header h3 {
	margin: 0;
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--color-text);
}

.teacher-title-badge {
	font-size: 0.65rem;
	font-weight: 700;
	color: var(--color-primary);
	background: var(--color-primary-light);
	padding: 2px 8px;
	border-radius: var(--radius-full);
	width: fit-content;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.modal-close-btn {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--color-bg-subtle);
	border: 1px solid var(--color-border);
	color: var(--color-text-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
}

.modal-close-btn:hover {
	background: var(--color-danger-light);
	color: var(--color-danger);
	border-color: var(--color-danger-border);
	transform: rotate(90deg);
}

.modal-body {
	padding: var(--space-5) var(--space-6);
}

.detail-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.detail-card {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3) var(--space-4);
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	transition: all var(--transition-fast);
}

.detail-card:hover {
	background: #ffffff;
	border-color: var(--color-primary-100);
	box-shadow: var(--shadow-sm);
}

.detail-card-icon {
	width: 34px;
	height: 34px;
	border-radius: 8px;
	background: #ffffff;
	border: 1px solid var(--color-border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-primary);
	box-shadow: var(--shadow-xs);
	flex-shrink: 0;
}

.detail-card-icon .material-icons {
	font-size: 1.1rem;
}

.detail-card-content {
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex-grow: 1;
}

.detail-card-label {
	font-size: 0.65rem;
	color: var(--color-text-muted);
	text-transform: uppercase;
	font-weight: 700;
	letter-spacing: 0.05em;
	margin-bottom: 1px;
}

.detail-card-value {
	font-size: 0.875rem;
	font-weight: 700;
	color: var(--color-text);
	white-space: normal;
	word-break: break-word;
}

.detail-card-value.badge {
	padding: 0.15rem 0.6rem;
	font-size: 0.7rem;
	width: fit-content;
}

.modal-actions {
	display: flex;
	gap: var(--space-2);
	padding: var(--space-4) var(--space-4);
	border-top: 1px solid var(--color-border);
	background: var(--color-bg-subtle);
	flex-wrap: wrap;
}

.modal-actions .btn {
	flex: 1;
	min-width: 130px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: 0.625rem 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	height: 42px;
	border-radius: var(--radius-lg);
}

.modal-actions .material-icons {
	font-size: 1.15rem;
}

/* Evaluators List */
.evaluators-section {
	margin-top: var(--space-4);
	border-top: 1px solid var(--color-border);
	padding-top: var(--space-4);
}

.evaluators-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: var(--space-3);
	color: var(--color-text);
}

.evaluators-title .material-icons {
	font-size: 1.125rem;
	color: var(--color-primary);
}

.evaluators-loading {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	justify-content: center;
	padding: var(--space-4);
	color: var(--color-text-muted);
	font-size: 0.875rem;
	margin-top: var(--space-4);
}

.empty-evaluators {
	text-align: center;
	padding: var(--space-4);
	color: var(--color-text-muted);
	font-size: 0.875rem;
}

/* Eval Summary Panel */
.eval-summary {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.eval-summary-stats {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: var(--space-3);
}

.eval-summary-stat {
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-3) var(--space-4);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	text-align: center;
}

.eval-summary-value {
	font-size: 1.375rem;
	font-weight: 800;
	color: var(--color-text);
	line-height: 1.1;
}

.eval-summary-value.primary {
	color: var(--color-primary);
}

.eval-summary-label {
	font-size: 0.65rem;
	font-weight: 600;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.eval-score-dist {
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-4);
}

.eval-dist-label {
	display: block;
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-text-muted);
	margin-bottom: var(--space-3);
}

.eval-dist-bars {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.eval-dist-row {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.eval-dist-range {
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--color-text-secondary);
	min-width: 52px;
	flex-shrink: 0;
}

.eval-dist-bar-wrap {
	flex: 1;
	height: 8px;
	background: var(--color-border);
	border-radius: var(--radius-full);
	overflow: hidden;
}

.eval-dist-bar-fill {
	height: 100%;
	border-radius: var(--radius-full);
	transition: width 0.4s ease;
	min-width: 2px;
}

.eval-dist-count {
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--color-text-muted);
	min-width: 20px;
	text-align: right;
	flex-shrink: 0;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.spin {
	animation: spin 1s linear infinite;
}

/* Empty */
.empty-state {
	grid-column: 1 / -1;
	text-align: center;
	padding: var(--space-12);
	color: var(--color-text-muted);
}

.empty-state .material-icons {
	font-size: 3rem;
	margin-bottom: var(--space-3);
	color: var(--color-bg-muted);
}

.badge-warning {
	background: #fef3c7;
	color: #92400e;
}

.badge-error {
	background: #fee2e2;
	color: #991b1b;
}

@media (max-width: 768px) {
	.card-grid {
		grid-template-columns: 1fr;
	}
	.form-row {
		grid-template-columns: 1fr;
	}
	.detail-grid {
		grid-template-columns: 1fr;
	}
	.modal-actions {
		flex-direction: column;
	}
	.sub-tabs {
		overflow-x: auto;
	}
}
</style>
