<template>
  <div class="w-full font-sans">
    <!-- Loading overlay -->
    <LoadingOverlay v-if="pageLoading" />

    <template v-else>
      <div class="animate-fade-up">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
            <LayoutDashboard class="h-6 w-6" />
          </div>
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Welcome {{ teacherFullName }}!
            </h2>
            <div class="mt-2 flex flex-wrap items-center gap-2.5">
              <p class="text-sm text-ink-soft">Evaluation System</p>
              <span class="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">
                {{ schoolYear || '2025-2026' }} | {{ currentPeriod ? formatPeriodLabel(currentPeriod) + ' Period' : '1st Period' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Default Password Warning Alert -->
      <section
        v-if="verified !== '1'"
        aria-labelledby="password-alert-title"
        class="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div class="flex gap-3.5">
          <span
            class="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-amber-100 text-amber-800"
            aria-hidden="true"
          >
            <TriangleAlert class="h-5 w-5" />
          </span>
          <div>
            <h3 id="password-alert-title" class="text-sm font-bold text-amber-900">
              Change Your Password
            </h3>
            <p class="mt-1 text-sm leading-relaxed text-amber-900/85">
              You are currently logged in with a default password. Please update your password in
              Settings for better account security.
            </p>
          </div>
        </div>
        <router-link
          to="/teacher/settings"
          class="inline-flex flex-none items-center justify-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-amber-800"
        >
          Go to Settings
        </router-link>
      </section>

      <!-- Summary Stats Grid -->
      <section aria-label="Evaluation summary" class="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          :icon="UsersRound"
          :value="count"
          label="Colleagues to evaluate"
          helper="Faculty members ready for feedback"
          icon-bg="bg-indigo-50"
          icon-fg="text-indigo-700"
        />
        <StatCard
          :icon="CheckCircle2"
          :value="evaluatedCount"
          label="Evaluations completed"
          helper="Peer evaluations submitted"
          icon-bg="bg-emerald-50"
          icon-fg="text-emerald-700"
        />
        <StatCard
          :icon="ClipboardList"
          :value="pendingCount"
          label="Pending evaluations"
          helper="Waiting for your evaluation"
          icon-bg="bg-amber-50"
          icon-fg="text-amber-800"
        />
      </section>

      <!-- Teachers Section -->
      <section aria-label="Your colleagues" class="mt-6">
        <!-- Filter Controls Bar -->
        <div class="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div class="relative w-full sm:max-w-sm">
            <Search
              class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <label htmlFor="teacher-search" class="sr-only">
              Search colleagues
            </label>
            <input
              id="teacher-search"
              type="search"
              v-model="searchQuery"
              placeholder="Search colleagues..."
              class="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              @click="hideEvaluated = !hideEvaluated"
              :aria-pressed="hideEvaluated"
              :class="[
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors',
                hideEvaluated
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : 'border-line bg-white text-ink-soft hover:bg-slate-50'
              ]"
            >
              <EyeOff class="h-4 w-4" aria-hidden="true" />
              Hide Evaluated
            </button>

            <!-- Subject Filter -->
            <div class="relative">
              <label htmlFor="subject-filter" class="sr-only">Filter by Subject</label>
              <select
                id="subject-filter"
                v-model="subjectFilter"
                class="appearance-none rounded-xl border border-line bg-white py-2.5 px-3.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">All Subjects</option>
                <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="relative">
              <ArrowUpDown
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <label htmlFor="teacher-sort" class="sr-only">
                Sort colleagues
              </label>
              <select
                id="teacher-sort"
                v-model="sortBy"
                class="appearance-none rounded-xl border border-line bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="name">Sort by Name</option>
                <option value="subject">Sort by Subject</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Teachers Grid -->
        <div v-if="teachers.length > 0" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TeacherCard
            v-for="teacher in teachers"
            :key="teacher.id || teacher.teacher_id"
            :teacher="teacher"
            @evaluate="startEval(teacher.id || teacher.teacher_id)"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <span
            class="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-ink-muted"
            aria-hidden="true"
          >
            <Search class="h-5 w-5" />
          </span>
          <p class="mt-3 text-sm font-bold text-ink">No colleagues match your filters</p>
          <p class="mt-1 text-xs text-ink-muted">Try resetting your search query or toggling filters</p>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="goToPage"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowUpDown,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  Search,
  TriangleAlert,
  UsersRound,
  LayoutDashboard,
} from '@lucide/vue'
import StatCard from '../../components/dashboard/StatCard.vue'
import TeacherCard from '../../components/dashboard/TeacherCard.vue'
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import Pagination from "../../components/Pagination.vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import API from "../../utils/api";

const router = useRouter();
const { request } = useApi();
const pageLoading = ref(true);
const { requireAuth } = useAuth();

// User
const user = ref({ firstname: "", lastname: "", fullname: "", id: null, email: "", subject: null });
const verified = ref("0");

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
	}
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
