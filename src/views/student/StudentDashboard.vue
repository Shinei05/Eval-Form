<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import TeacherCard from "../../components/TeacherCard.vue";
import Pagination from "../../components/Pagination.vue";
import API from "../../utils/api";

const router = useRouter();
const { request, isLoading } = useApi();
const pageLoading = ref(true);
const { requireAuth } = useAuth();

const userProfile = ref({
	userId: null,
	studentId: null,
	email: "",
	firstname: "",
	lastname: "",
	fullname: "",
});

const verified = ref("1");

// Data
const teachers = ref([]);
const subjects = ref([]);
const searchQuery = ref("");
const sortBy = ref("name");
const subjectFilter = ref("");
const showEvaluated = ref(true);
const currentPage = ref(1);
const perPage = 12;
const totalCount = ref(0);
const evaluatedCount = ref(0);
const pendingCount = ref(0);
const currentPeriod = ref(0);
const schoolYear = ref("");

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)));
const studentFullName = computed(() => {
	const explicit = (userProfile.value.fullname || "").trim();
	if (explicit) return explicit;
	const first = (userProfile.value.firstname || "").trim();
	const last = (userProfile.value.lastname || "").trim();
	const full = `${first} ${last}`.trim();
	return full || "Student";
});

function goToPage(page) {
	currentPage.value = Math.max(1, Math.min(page, totalPages.value));
}

watch([searchQuery, subjectFilter, showEvaluated, sortBy], () => {
	currentPage.value = 1;
	fetchTeachers();
});

watch(currentPage, () => {
	fetchTeachers();
});

async function fetchTeachers() {
	if (!userProfile.value.studentId) {
		pageLoading.value = false;
		return;
	}
	const result = await request(API.teachersList, {
		body: {
			action: "getTeachers",
			id: userProfile.value.studentId,
			page: currentPage.value,
			perPage,
			search: searchQuery.value,
			subject: subjectFilter.value,
			sortBy: sortBy.value,
			showEvaluated: showEvaluated.value,
		},
	});
	if (result.success) {
		teachers.value = result.teachers || [];
		subjects.value = result.subjects || [];
		totalCount.value = result.total || 0;
		evaluatedCount.value = result.evaluatedCount || 0;
		pendingCount.value = result.pendingCount || 0;
	}
	pageLoading.value = false;
}

function startEval(teacherId) {
	router.push(`/student-eval/${teacherId}`);
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

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		userProfile.value = {
			userId: profile.userId || null,
			studentId: profile.studentId || null,
			email: profile.email || "",
			firstname: profile.firstname || "",
			lastname: profile.lastname || "",
			fullname: profile.fullname || "",
		};
	}
}

async function checkVerification() {
	const result = await request(API.verificationCheck, {
		body: { email: userProfile.value.email },
	});
	if (result.success) {
		verified.value = result.verified ? "1" : "0";
	}
}

onMounted(() => {
	if (!requireAuth()) return;
	loadProfile().then(() => {
		fetchSchedule();
		checkVerification();
		fetchTeachers();
	});
});
</script>

<template>
	<LoadingOverlay v-if="pageLoading" />

	<div class="dashboard-content">
		<div class="welcome-header">
			<h2>Welcome {{ studentFullName }}!</h2>
			<p>
				Evaluation System
				<span class="period-tag">
					{{ schoolYear || "School Year" }}
					|
					{{ currentPeriod ? formatPeriodLabel(currentPeriod) + " Period" : "Evaluations Closed" }}
				</span>
			</p>
		</div>

		<!-- Change Password Banner -->
		<div v-if="verified !== '1'" class="verify-banner card" style="border-left: 4px solid #f59e0b; background: #fffbeb; border-color: #fde68a;">
			<div class="verify-left">
				<span class="material-icons verify-icon" style="color: #d97706;">warning</span>
				<div>
					<h3 style="color: #78350f; font-weight: 600; margin: 0 0 var(--space-1) 0; font-size: 1rem;">Change Your Password</h3>
					<p style="color: #b45309; margin: 0; font-size: 0.8125rem;">
						You are currently logged in with a default password. Please update your password in Settings for better account security.
					</p>
				</div>
			</div>
			<div class="verify-right">
				<router-link
					to="/student/settings"
					class="btn btn-warning btn-sm"
					style="background-color: #d97706; border-color: #d97706; color: white; font-weight: 600; text-decoration: none; padding: 6px 12px; border-radius: 4px; display: inline-block;"
				>
					Go to Settings
				</router-link>
			</div>
		</div>
		<div class="stats-grid">
			<div class="stat-card card-available">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-available">
						<span class="material-icons-outlined">people</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ totalCount }}</span>
						<span class="stat-label">Available Evaluations</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">Teachers ready for your feedback</span>
				</div>
			</div>

			<div class="stat-card card-completed">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-completed">
						<span class="material-icons-outlined">check_circle</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ evaluatedCount }}</span>
						<span class="stat-label">Evaluations Completed</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">You've submitted these so far</span>
				</div>
			</div>

			<div class="stat-card card-pending">
				<div class="stat-body">
					<div class="stat-icon-wrap icon-pending">
						<span class="material-icons-outlined">pending_actions</span>
					</div>
					<div class="stat-info">
						<span class="stat-value">{{ pendingCount }}</span>
						<span class="stat-label">Pending Evaluations</span>
					</div>
				</div>
				<div class="stat-footer">
					<span class="stat-desc">Waiting for your response</span>
				</div>
			</div>
		</div>

		<div class="controls-bar">
			<div class="search-wrap">
				<span class="material-icons-outlined search-icon">search</span>
				<input v-model="searchQuery" type="text" placeholder="Search teachers..." class="search-input" />
			</div>
			<div class="controls-actions">
				<button class="ctrl-btn" :class="{ active: !showEvaluated }" @click="showEvaluated = !showEvaluated">
					<span class="material-icons-outlined">filter_alt</span> Hide Evaluated
				</button>
				<select v-model="sortBy" class="ctrl-select">
					<option value="name">Sort by Name</option>
					<option value="subject">Sort by Subject</option>
				</select>
			</div>
		</div>

		<!-- Teacher Grid -->
		<div class="teacher-grid">
			<TeacherCard
				v-for="teacher in teachers"
				:key="teacher.id"
				:teacher="teacher"
				@action="startEval"
			/>

			<div v-if="teachers.length === 0" class="empty-state">
				<span class="material-icons">person_search</span>
				<p>No teachers found</p>
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
.dashboard-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

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

.stats-grid {
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	gap: var(--space-6);
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

.card-available { background: #faf5ff; border-color: #e9d5ff; }
.card-completed { background: #f0fdf4; border-color: #bbf7d0; }
.card-pending { background: #fff7ed; border-color: #fed7aa; }

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
.icon-available {
	background: #ede9fe;
	color: #7c3aed;
}
.icon-completed {
	background: #bbf7d0;
	color: #16a34a;
}
.icon-pending {
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
}
.ctrl-select:focus {
	border-color: #6366f1;
}

.btn-outline:hover {
	background: #f8fafc;
}

.select-input {
	background: #fff;
	border: 1px solid #94a3b8;
	color: #475569;
	padding: 0.5rem 2.5rem 0.5rem 1rem;
	border-radius: var(--radius-md);
	font-size: 0.875rem;
	cursor: pointer;
	font-weight: 500;
	outline: none;
}

/* Teacher Grid */
.teacher-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: var(--space-4);
}

/* Empty State */
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

.empty-state p {
	font-size: 1rem;
}

@media (max-width: 768px) {
	.controls-row {
		flex-direction: column;
		align-items: stretch;
	}
	.filters-wrap {
		flex-direction: column;
		align-items: stretch;
	}
	.search-wrap {
		max-width: 100%;
	}
	.teacher-grid {
		grid-template-columns: 1fr;
	}
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
	border: 1px solid;
	border-radius: var(--radius-lg);
}

.verify-left {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.verify-icon {
	font-size: 1.75rem;
}

@media (max-width: 768px) {
	.verify-banner {
		flex-direction: column;
		text-align: center;
	}
	.verify-left {
		flex-direction: column;
	}
}
</style>
