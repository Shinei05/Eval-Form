<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { UsersRound, CheckCircle2, ClipboardList, Search, EyeOff, BookOpen, Clock, Calendar, BarChart, BookType, X, MoreHorizontal, User, FileText, ChevronDown, ChevronUp, Download, Eye, RefreshCw, LayoutDashboard, Archive } from '@lucide/vue';
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import ManageAccounts from "../../components/ManageAccounts.vue";
import ArchivedAccounts from "../../components/ArchivedAccounts.vue";
import Pagination from "../../components/Pagination.vue";
import StatCard from "../../components/dashboard/StatCard.vue";
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
const activeTab = computed(() => route.query.tab || "evaluate");

// Data
const teachers = ref([]);
const studentEvals = ref([]);
const teacherEvals = ref([]);
const teacherCount = ref(0);
const pendingCount = ref(0);
const evaluatedCount = ref(0);
const evalCount = ref(0);
const studentTotal = ref(0);
const teacherTotal = ref(0);
const studentSystemCount = ref(0);
const adminProfile = ref({ firstname: "", lastname: "", fullname: "", teacherId: null, id: null });

const adminFullName = computed(() => {
	const explicit = (adminProfile.value.fullname || "").trim();
	if (explicit) return explicit;
	const first = (adminProfile.value.firstname || "").trim();
	const last = (adminProfile.value.lastname || "").trim();
	const full = `${first} ${last}`.trim();
	return full || "Admin";
});

const studentCoverageRate = computed(() => {
	if (!teacherCount.value) return "0%";
	const pct = Math.round((studentEvals.value.length / teacherCount.value) * 100);
	return `${pct}%`;
});

const teacherComplianceRate = computed(() => {
	if (!teacherCount.value) return "0%";
	const pct = Math.round((teacherEvals.value.length / teacherCount.value) * 100);
	return `${pct}%`;
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
			id: profile.id || null,
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
			id: adminProfile.value.id,
			page: teacherListPage.value,
			perPage,
		},
	});
	if (result.success) {
		teachers.value = result.teachers || [];
		teacherCount.value = result.total || 0;
		pendingCount.value = result.pendingCount || 0;
		evaluatedCount.value = result.evaluatedCount || 0;
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
  <div class="w-full font-sans">
    <LoadingOverlay v-if="isLoading" />
    <AppToast v-bind="toast" @update:visible="toast.visible = $event" />

    <!-- Detail Modal -->
    <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showDetailModal && selectedEval" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeDetail"></div>
        <div class="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700 shadow-inner">
                {{ (selectedEval.firstname?.charAt(0) || '').toUpperCase() + (selectedEval.lastname?.charAt(0) || '').toUpperCase() }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">{{ selectedEval.firstname }} {{ selectedEval.lastname }}</h3>
                <span class="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {{ detailType === 'student' ? 'Student Evaluation' : 'Teacher Evaluation' }}
                </span>
              </div>
            </div>
            <button @click="closeDetail" class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-center gap-2 text-slate-500">
                  <BookOpen class="h-4 w-4" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Subject</span>
                </div>
                <span class="font-semibold text-slate-900 line-clamp-1">{{ selectedEval.subject }}</span>
              </div>
              <div class="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-center gap-2 text-slate-500">
                  <Clock class="h-4 w-4" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Quarter</span>
                </div>
                <span class="font-semibold text-slate-900">Q{{ selectedEval.quarter }}</span>
              </div>
              <div class="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-center gap-2 text-slate-500">
                  <Calendar class="h-4 w-4" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Year</span>
                </div>
                <span class="font-semibold text-slate-900">{{ selectedEval.year }}</span>
              </div>
              <div class="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-center gap-2 text-slate-500">
                  <BarChart class="h-4 w-4" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Sentiment</span>
                </div>
                <span
                  class="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="{
                    'bg-emerald-100 text-emerald-700': selectedEval.sentiment === 'Positive' || selectedEval.sentiment === 'Very Good' || selectedEval.sentiment === 'Good',
                    'bg-amber-100 text-amber-700': selectedEval.sentiment === 'Neutral' || selectedEval.sentiment === 'Average',
                    'bg-rose-100 text-rose-700': selectedEval.sentiment === 'Negative' || selectedEval.sentiment === 'Poor' || selectedEval.sentiment === 'Very Poor',
                  }"
                >
                  {{ selectedEval.sentiment || "N/A" }}
                </span>
              </div>
            </div>

            <!-- Evaluators Summary -->
            <div v-if="evaluatorsLoading" class="mt-6 flex items-center justify-center py-8 text-sm text-slate-500">
              <RefreshCw class="mr-2 h-5 w-5 animate-spin" />
              Loading summary...
            </div>
            <div v-else-if="showEvaluators" class="mt-6 border-t border-slate-100 pt-6">
              <h4 class="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <BarChart class="h-4 w-4 text-indigo-500" />
                Evaluation Summary
              </h4>
              <div v-if="evaluatorsList.length === 0" class="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">
                No evaluations found.
              </div>
              <div v-else class="space-y-4">
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span class="text-2xl font-black text-slate-900">{{ evaluatorsList.length }}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evaluators</span>
                  </div>
                  <div class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span class="text-2xl font-black text-indigo-600">{{ (evaluatorsList.reduce((s, e) => s + Number(e.avg), 0) / evaluatorsList.length).toFixed(2) }}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Score</span>
                  </div>
                  <div class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span class="text-2xl font-black text-slate-900">{{ Math.max(...evaluatorsList.map(e => Number(e.avg))).toFixed(1) }}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Highest</span>
                  </div>
                  <div class="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span class="text-2xl font-black text-slate-900">{{ Math.min(...evaluatorsList.map(e => Number(e.avg))).toFixed(1) }}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lowest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex flex-col-reverse gap-3 bg-slate-50/80 p-6 sm:flex-row sm:justify-end">
            <button
              @click="viewIndividual"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
            >
              <component :is="showEvaluators ? ChevronUp : ChevronDown" class="h-4 w-4" />
              {{ showEvaluators ? 'Hide Summary' : 'View Summary' }}
            </button>
            <button
              @click="exportTeacherReport"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 sm:w-auto"
            >
              <Download class="h-4 w-4" />
              Export PDF
            </button>
            <button
              @click="viewPerformance"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              <BarChart class="h-4 w-4" />
              Performance
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>

    <div class="animate-fade-up space-y-8">
      <!-- Welcome Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
            <LayoutDashboard v-if="activeTab === 'student' || activeTab === 'teacher'" class="h-6 w-6" />
            <ClipboardList v-else-if="activeTab === 'evaluate'" class="h-6 w-6" />
            <UsersRound v-else-if="activeTab === 'manage'" class="h-6 w-6" />
            <Archive v-else-if="activeTab === 'archived'" class="h-6 w-6" />
          </div>
          <div>
            <template v-if="activeTab === 'student' || activeTab === 'teacher'">
              <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Welcome {{ adminFullName }}!</h2>
              <p class="mt-1 text-sm text-slate-500">Evaluation System</p>
            </template>
            <template v-else-if="activeTab === 'evaluate'">
              <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Evaluate Teachers</h2>
              <p class="mt-1 text-sm text-slate-500">Select a teacher to begin their performance evaluation</p>
            </template>
            <template v-else-if="activeTab === 'manage'">
              <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Account Management</h2>
              <p class="mt-1 text-sm text-slate-500">Create, edit, and archive faculty accounts</p>
            </template>
            <template v-else-if="activeTab === 'archived'">
              <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Archived Teachers</h2>
              <p class="mt-1 text-sm text-slate-500">View and restore archived faculty accounts</p>
            </template>
          </div>
        </div>
      </div>

      <!-- Stats Grid for Evaluate Tab -->
      <section v-if="activeTab === 'evaluate'" class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          :icon="User"
          :value="teacherCount"
          label="Teachers"
          helper="Faculty members in the system"
          icon-bg="bg-indigo-50/50 border border-indigo-100"
          icon-fg="text-indigo-600"
        />
        <StatCard
          :icon="Clock"
          :value="pendingCount"
          label="Pending"
          helper="Pending evaluations"
          icon-bg="bg-amber-50/50 border border-amber-100"
          icon-fg="text-amber-600"
        />
        <StatCard
          :icon="CheckCircle2"
          :value="evaluatedCount"
          label="Completed"
          helper="Completed evaluations"
          icon-bg="bg-emerald-50/50 border border-emerald-100"
          icon-fg="text-emerald-600"
        />
      </section>

      <!-- Stats Grid for Student Evaluations Tab -->
      <section v-if="activeTab === 'student'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          :icon="FileText"
          :value="studentTotal"
          label="Total Submissions"
          helper="Student feedback responses"
          icon-bg="bg-indigo-50/50 border border-indigo-100"
          icon-fg="text-indigo-600"
        />
        <StatCard
          :icon="User"
          :value="studentEvals.length"
          label="Faculty Evaluated"
          helper="Teachers with student feedback"
          icon-bg="bg-emerald-50/50 border border-emerald-100"
          icon-fg="text-emerald-600"
        />
        <StatCard
          :icon="CheckCircle2"
          :value="studentCoverageRate"
          label="Faculty Coverage"
          helper="Teachers receiving evaluations"
          icon-bg="bg-blue-50/50 border border-blue-100"
          icon-fg="text-blue-600"
        />
        <StatCard
          :icon="UsersRound"
          :value="studentSystemCount"
          label="Total Students"
          helper="Enrolled students in system"
          icon-bg="bg-amber-50/50 border border-amber-100"
          icon-fg="text-amber-600"
        />
      </section>

      <!-- Stats Grid for Teacher Evaluations Tab -->
      <section v-if="activeTab === 'teacher'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          :icon="FileText"
          :value="teacherTotal"
          label="Peer Submissions"
          helper="Total peer reviews submitted"
          icon-bg="bg-indigo-50/50 border border-indigo-100"
          icon-fg="text-indigo-600"
        />
        <StatCard
          :icon="User"
          :value="teacherEvals.length"
          label="Faculty Reviewed"
          helper="Teachers with peer reviews"
          icon-bg="bg-emerald-50/50 border border-emerald-100"
          icon-fg="text-emerald-600"
        />
        <StatCard
          :icon="CheckCircle2"
          :value="teacherComplianceRate"
          label="Peer Compliance"
          helper="Faculty review completion rate"
          icon-bg="bg-blue-50/50 border border-blue-100"
          icon-fg="text-blue-600"
        />
        <StatCard
          :icon="UsersRound"
          :value="teacherCount"
          label="Faculty Members"
          helper="Total faculty in system"
          icon-bg="bg-amber-50/50 border border-amber-100"
          icon-fg="text-amber-600"
        />
      </section>

      <!-- Student Evaluations -->
      <div v-if="activeTab === 'student'" class="space-y-6">
        <h2 class="text-lg font-bold text-slate-900">Student Evaluations</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="ev in studentEvals"
            :key="ev.teacher_id"
            @click="openDetail(ev, 'student')"
            class="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <User class="h-6 w-6" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="truncate text-base font-bold text-slate-900">{{ ev.firstname }} {{ ev.lastname }}</h3>
                <p class="truncate text-sm font-medium text-slate-500">{{ ev.subject }}</p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Q{{ ev.quarter }} {{ ev.year }}</span>
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{{ ev.eval_count }} {{ ev.eval_count === 1 ? 'eval' : 'evals' }}</span>
                  <span
                    class="inline-flex rounded-md px-2 py-1 text-xs font-bold"
                    :class="{
                      'bg-emerald-100 text-emerald-700': ev.sentiment === 'Positive' || ev.sentiment === 'Very Good' || ev.sentiment === 'Good',
                      'bg-amber-100 text-amber-700': ev.sentiment === 'Neutral' || ev.sentiment === 'Average',
                      'bg-rose-100 text-rose-700': ev.sentiment === 'Negative' || ev.sentiment === 'Poor' || ev.sentiment === 'Very Poor',
                    }"
                  >
                    {{ ev.sentiment || "N/A" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="studentEvals.length === 0" class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-slate-500">
            <BookType class="mb-3 h-8 w-8 text-slate-400" />
            <p class="text-sm font-medium">No student evaluations yet</p>
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

      <!-- Teacher Evaluations -->
      <div v-if="activeTab === 'teacher'" class="space-y-6">
        <h2 class="text-lg font-bold text-slate-900">Teacher Evaluations</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="ev in teacherEvals"
            :key="ev.teacher_id"
            @click="openDetail(ev, 'teacher')"
            class="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <User class="h-6 w-6" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="truncate text-base font-bold text-slate-900">{{ ev.firstname }} {{ ev.lastname }}</h3>
                <p class="truncate text-sm font-medium text-slate-500">{{ ev.subject }}</p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Q{{ ev.quarter }} {{ ev.year }}</span>
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{{ ev.eval_count }} {{ ev.eval_count === 1 ? 'eval' : 'evals' }}</span>
                  <span
                    class="inline-flex rounded-md px-2 py-1 text-xs font-bold"
                    :class="{
                      'bg-emerald-100 text-emerald-700': ev.sentiment === 'Positive' || ev.sentiment === 'Very Good' || ev.sentiment === 'Good',
                      'bg-amber-100 text-amber-700': ev.sentiment === 'Neutral' || ev.sentiment === 'Average',
                      'bg-rose-100 text-rose-700': ev.sentiment === 'Negative' || ev.sentiment === 'Poor' || ev.sentiment === 'Very Poor',
                    }"
                  >
                    {{ ev.sentiment || "N/A" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="teacherEvals.length === 0" class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-slate-500">
            <BookType class="mb-3 h-8 w-8 text-slate-400" />
            <p class="text-sm font-medium">No teacher evaluations yet</p>
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

      <!-- Evaluate Teachers -->
      <div v-if="activeTab === 'evaluate'" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="teacher in sortedTeachers"
            :key="teacher.id"
            class="flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all"
            :class="(teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1') ? 'border-emerald-200' : 'border-slate-200'"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 flex-none items-center justify-center rounded-full"
                  :class="(teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'"
                >
                  <User class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-[15px] font-bold text-slate-900">{{ teacher.firstname }} {{ teacher.lastname }}</h3>
                  <p v-if="teacher.subject" class="text-xs font-medium text-slate-500">{{ teacher.subject }}</p>
                </div>
              </div>
              <span
                v-if="teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1'"
                class="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
              >
                Evaluated
              </span>
              <span v-else class="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Pending
              </span>
            </div>
            
            <div class="mt-4 flex-1">
              <span v-if="teacher.quarter" class="inline-flex rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                Q{{ teacher.quarter }} {{ teacher.year }}
              </span>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-100">
              <button
                v-if="teacher.evaluated === 'evaluated' || teacher.evaluated === true || teacher.evaluated === 1 || teacher.evaluated === '1'"
                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
                disabled
              >
                <Eye class="h-4 w-4" /> View Results
              </button>
              <button
                v-else
                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                @click="$router.push({ name: 'teacher-eval', params: { id: teacher.id } })"
              >
                <BookOpen class="h-4 w-4" /> Start Evaluation
              </button>
            </div>
          </div>
          <div v-if="sortedTeachers.length === 0" class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-slate-500">
            <User class="mb-3 h-8 w-8 text-slate-400" />
            <p class="text-sm font-medium">No teachers available</p>
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

      <!-- Manage Accounts -->
      <div v-if="activeTab === 'manage'">
        <ManageAccounts :currentTeacherId="adminProfile.teacherId" @notify="notify" />
      </div>

      <!-- Archived Accounts -->
      <div v-if="activeTab === 'archived'">
        <ArchivedAccounts @notify="notify" />
      </div>
    </div>
  </div>
</template>
