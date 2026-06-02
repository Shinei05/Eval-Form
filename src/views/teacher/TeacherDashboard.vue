<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import TeacherCard from "../../components/TeacherCard.vue";
import Pagination from "../../components/Pagination.vue";
import API from "../../utils/api";

const router = useRouter();
const { request, isLoading } = useApi();
const pageLoading = ref(true);
const { requireAuth } = useAuth();

// User
const user = ref({ firstname: "", lastname: "", fullname: "", id: null, email: "", subject: null });
const verified = ref("0");
const verifyStep = ref("idle"); // idle | code | input
const verifyCode = ref("");

// Teachers / Filters
const teachers = ref([]);
const subjects = ref([]);
const count = ref(0);
const evaluatedCount = ref(0);
const pendingCount = ref(0);
const currentPeriod = ref(0);
const schoolYear = ref("");
const searchQuery = ref("");
const sortBy = ref("name");
const subjectFilter = ref("");
const hideEvaluated = ref(false);

// Toast
const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const currentPage = ref(1);
const perPage = 12;
const totalCount = ref(0);

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)));

function goToPage(page) {
	currentPage.value = Math.max(1, Math.min(page, totalPages.value));
}

watch([searchQuery, subjectFilter, hideEvaluated, sortBy], () => {
	currentPage.value = 1;
	fetchTeachers();
});

watch(currentPage, () => {
	fetchTeachers();
});

async function fetchTeachers() {
	const result = await request(API.teachersListFaculty, {
		body: {
			action: "getTeachers",
			id: user.value.id,
			page: currentPage.value,
			perPage,
			search: searchQuery.value,
			subject: subjectFilter.value,
			sortBy: sortBy.value,
			hideEvaluated: hideEvaluated.value,
		},
	});
	if (result.success) {
		teachers.value = result.teachers || [];
		subjects.value = result.subjects || [];
		count.value = result.total || 0;
		totalCount.value = result.total || 0;
		evaluatedCount.value = result.evaluatedCount || 0;
		pendingCount.value = result.pendingCount || 0;
	}
	pageLoading.value = false;
}

async function checkVerification() {
	const result = await request(API.verificationCheck, {
		body: { email: user.value.email },
	});
	if (result.success) {
		verified.value = result.verified ? "1" : "0";
		if (verified.value !== "1") {
			verifyStep.value = "code";
		}
	}
}

async function sendVerifyCode() {
	const result = await request(API.emailVerifySend, {
		body: { email: user.value.email },
	});
	if (result.success) {
		verifyStep.value = "input";
		notify("Verification code sent to your email", "success");
	} else {
		notify(result.message || "Failed to send code", "error");
	}
}

async function submitVerifyCode() {
	if (!verifyCode.value.trim()) {
		notify("Please enter the verification code", "error");
		return;
	}
	const result = await request(API.emailVerifyCode, {
		body: { email: user.value.email, code: verifyCode.value.trim() },
	});
	if (result.success) {
		verified.value = "1";
		verifyStep.value = "idle";
		notify("Account verified successfully!", "success");
	} else {
		notify(result.message || "Invalid verification code", "error");
	}
}

function toggleHideEvaluated() {
	hideEvaluated.value = !hideEvaluated.value;
	notify(
		hideEvaluated.value ? "Evaluated colleagues hidden" : "All colleagues shown",
		"info"
	);
}

function startEval(teacherId) {
	router.push({ name: "teacher-eval", params: { id: teacherId } });
}

function formatPeriodLabel(periodNumber) {
	const labels = ["1st", "2nd", "3rd", "4th"];
	return labels[periodNumber - 1] || "—";
}

async function fetchSchedule() {
	const result = await request(API.schedule, { body: { action: "getTime" } });
	if (result.success) {
		currentPeriod.value = Number(result.currentPeriod || 0);
		schoolYear.value = result.times?.school_year || "";
	}
}

onMounted(() => {
	if (!requireAuth()) return;
	loadProfile().then(() => {
		// Default subject filter to the logged-in teacher's subject
		if (user.value.subject) {
			subjectFilter.value = String(user.value.subject);
		}
		fetchSchedule();
		checkVerification();
		fetchTeachers();
	});
});

const teacherFullName = computed(() => {
	const explicit = (user.value.fullname || "").trim();
	if (explicit) return explicit;
	const first = (user.value.firstname || "").trim();
	const last = (user.value.lastname || "").trim();
	const full = `${first} ${last}`.trim();
	return full || "Teacher";
});

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		user.value = {
			firstname: profile.firstname || "",
			lastname: profile.lastname || "",
			fullname: profile.fullname || "",
			id: profile.userId || null,
			email: profile.email || "",
			subject: profile.subject || null,
		};
	}
}
</script>

<template>
	<LoadingOverlay v-if="pageLoading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div>
		<div class="welcome-header" style="margin-bottom: var(--space-6);">
			<h2>Welcome {{ teacherFullName }}!</h2>
			<p>
				Evaluation System
				<span class="period-tag">
					{{ schoolYear || "School Year" }}
					|
					{{ currentPeriod ? formatPeriodLabel(currentPeriod) + " Period" : "Evaluations Closed" }}
				</span>
			</p>
		</div>
			<!-- Verification Banner -->
			<div v-if="verified !== '1'" class="verify-banner card">
				<div class="verify-left">
					<span class="material-icons verify-icon"
						>verified_user</span
					>
					<div>
						<h3>Account Verification</h3>
						<p v-if="verifyStep === 'code'">
							Verify your email to access all features
						</p>
						<p v-if="verifyStep === 'input'">
							Enter the code sent to your email
						</p>
					</div>
				</div>
				<div class="verify-right">
					<template v-if="verifyStep === 'code'">
						<button
							class="btn btn-primary btn-sm"
							@click="sendVerifyCode"
						>
							Send Code
						</button>
					</template>
					<template v-if="verifyStep === 'input'">
						<form
							@submit.prevent="submitVerifyCode"
							class="verify-form"
						>
							<input
								v-model="verifyCode"
								type="text"
								placeholder="Enter code"
								class="verify-input"
							/>
							<button
								type="submit"
								class="btn btn-primary btn-sm"
							>
								Verify
							</button>
						</form>
					</template>
				</div>
			</div>

			<!-- Stats -->
			<div class="stats-grid">
				<div class="stat-card card-total">
					<div class="stat-body">
						<div class="stat-icon-wrap icon-total">
							<span class="material-icons-outlined">group</span>
						</div>
						<div class="stat-info">
							<span class="stat-value">{{ count }}</span>
							<span class="stat-label">Colleagues</span>
						</div>
					</div>
					<div class="stat-footer">
						<span class="stat-desc">Faculty members to evaluate</span>
					</div>
				</div>
				<div class="stat-card card-evaluated">
					<div class="stat-body">
						<div class="stat-icon-wrap icon-evaluated">
							<span class="material-icons-outlined">how_to_reg</span>
						</div>
						<div class="stat-info">
							<span class="stat-value">{{ evaluatedCount }}</span>
							<span class="stat-label">Evaluated</span>
						</div>
					</div>
					<div class="stat-footer">
						<span class="stat-desc">Peer evaluations completed</span>
					</div>
				</div>
				<div class="stat-card card-remaining">
					<div class="stat-body">
						<div class="stat-icon-wrap icon-remaining">
							<span class="material-icons-outlined">pending_actions</span>
						</div>
						<div class="stat-info">
							<span class="stat-value">{{ pendingCount }}</span>
							<span class="stat-label">Remaining</span>
						</div>
					</div>
					<div class="stat-footer">
						<span class="stat-desc">Waiting for your evaluation</span>
					</div>
				</div>
			</div>

			<div class="controls-bar">
				<div class="search-wrap">
					<span class="material-icons-outlined search-icon">search</span>
					<input v-model="searchQuery" type="text" placeholder="Search colleagues..." class="search-input" />
				</div>
				<div class="controls-actions">
					<select v-model="subjectFilter" class="ctrl-select">
						<option value="">All Subjects</option>
						<option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
					</select>
					<select v-model="sortBy" class="ctrl-select">
						<option value="name">Sort by Name</option>
						<option value="subject">Sort by Subject</option>
						<option value="quarter">Sort by Quarter</option>
					</select>
					<button class="ctrl-btn" :class="{ active: hideEvaluated }" @click="toggleHideEvaluated">
						<span class="material-icons-outlined">visibility_off</span> Hide Evaluated
					</button>
				</div>
			</div>

			<!-- Teacher Cards -->
			<h2 class="section-title">
				Colleagues ({{ totalCount }})
			</h2>
			<div class="teacher-grid">
				<TeacherCard
					v-for="teacher in teachers"
					:key="teacher.id"
					:teacher="teacher"
					actionText="Start Evaluation"
					@action="startEval"
				/>

				<div v-if="teachers.length === 0" class="empty-state">
					<span class="material-icons">group</span>
					<p>No colleagues found</p>
				</div>
			</div>

			<Pagination
				:current-page="currentPage"
				:total-pages="totalPages"
				:total-items="totalCount"
				:per-page="perPage"
				@page-change="goToPage($event)"
			/>
	</div>
</template>

<style scoped>

.welcome-header {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.period-tag {
	display: inline-flex;
	align-items: center;
	margin-left: var(--space-2);
	padding: 2px 8px;
	border-radius: 9999px;
	background: #eef2ff;
	color: #4f46e5;
	font-size: 0.75rem;
	font-weight: 600;
}

/* Verification Banner */
.verify-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4) var(--space-5);
	margin-bottom: var(--space-6);
	gap: var(--space-4);
	flex-wrap: wrap;
}

.verify-banner.verify-success {
	background: var(--color-success-50);
	border-color: var(--color-success-200);
	color: var(--color-success-700);
	font-weight: 500;
	gap: var(--space-2);
}

.verify-left {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.verify-icon {
	font-size: 1.75rem;
	color: var(--color-primary);
}

.verify-success .verify-icon {
	color: var(--color-success-700);
}

.verify-left h3 {
	margin: 0 0 var(--space-1) 0;
	font-size: 1rem;
}

.verify-left p {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--color-text-muted);
}

.verify-form {
	display: flex;
	gap: var(--space-2);
}

.verify-input {
	width: 160px;
	padding: var(--space-2) var(--space-3);
	font-size: 0.875rem;
}

/* Stats */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	gap: var(--space-6);
	margin-bottom: var(--space-6);
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
.card-evaluated { background: #f0fdf4; border-color: #bbf7d0; }
.card-remaining { background: #fff7ed; border-color: #fed7aa; }

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
.icon-evaluated {
	background: #bbf7d0;
	color: #16a34a;
}
.icon-remaining {
	background: #fed7aa;
	color: #ea580c;
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

/* Controls Bar */
.controls-bar {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	padding: var(--space-4) var(--space-5);
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: var(--radius-lg);
	margin-bottom: var(--space-6);
}

.search-wrap {
	position: relative;
	flex: 1;
	max-width: 340px;
}

.search-icon {
	position: absolute;
	left: 0.875rem;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
	font-size: 1.25rem;
}

.search-input {
	width: 100%;
	padding: 0.5625rem 1rem 0.5625rem 2.625rem;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md);
	background: #fff;
	font-size: 0.875rem;
	color: #0f172a;
	outline: none;
	transition: border-color 0.2s;
}
.search-input:focus {
	border-color: #6366f1;
}

.controls-actions {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	margin-left: auto;
}

.ctrl-btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	padding: 0.5rem 0.875rem;
	font-size: 0.8125rem;
	font-weight: 600;
	color: #475569;
	background: #fff;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.15s;
	white-space: nowrap;
}
.ctrl-btn:hover {
	background: #f1f5f9;
	border-color: #94a3b8;
}
.ctrl-btn.active {
	background: #eef2ff;
	border-color: #a5b4fc;
	color: #4f46e5;
}
.ctrl-btn .material-icons-outlined {
	font-size: 1.125rem;
}

.ctrl-select {
	padding: 0.5rem 2.25rem 0.5rem 0.875rem;
	font-size: 0.8125rem;
	font-weight: 500;
	color: #475569;
	background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.625rem center;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md);
	outline: none;
	cursor: pointer;
	appearance: none;
	transition: border-color 0.2s;
	min-width: 140px;
}
.ctrl-select:focus {
	border-color: #6366f1;
}

.section-title {
	font-size: 1.125rem;
	margin-bottom: var(--space-4);
}

/* Teacher Grid */
.teacher-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: var(--space-4);
}

/* Empty state */
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

/* Pagination */
.pagination {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-4);
	padding-top: var(--space-2);
	margin-bottom: var(--space-6);
}

@media (max-width: 768px) {
	.controls-bar {
		flex-direction: column;
		align-items: stretch;
	}
	.search-wrap {
		max-width: none;
	}
	.controls-actions {
		flex-direction: column;
		align-items: stretch;
		margin-left: 0;
	}
	.ctrl-select {
		min-width: 0;
	}
	.teacher-grid {
		grid-template-columns: 1fr;
	}
	.verify-banner {
		flex-direction: column;
		text-align: center;
	}
	.verify-left {
		flex-direction: column;
	}
}
</style>
