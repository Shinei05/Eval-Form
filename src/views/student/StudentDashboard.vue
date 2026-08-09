<template>
  <div class="w-full font-sans">
    <!-- Skeleton Loading State (Matches Dashboard Layout) -->
    <div v-if="pageLoading" class="animate-pulse space-y-6">
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 rounded-2xl bg-slate-200"></div>
        <div class="space-y-2">
          <div class="h-7 w-48 rounded-lg bg-slate-200"></div>
          <div class="h-4 w-32 rounded-lg bg-slate-200"></div>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="h-28 rounded-2xl bg-slate-200"></div>
        <div class="h-28 rounded-2xl bg-slate-200"></div>
        <div class="h-28 rounded-2xl bg-slate-200"></div>
      </div>
      <div class="h-16 rounded-2xl bg-slate-200"></div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="h-44 rounded-2xl bg-slate-200"></div>
        <div class="h-44 rounded-2xl bg-slate-200"></div>
        <div class="h-44 rounded-2xl bg-slate-200"></div>
        <div class="h-44 rounded-2xl bg-slate-200"></div>
        <div class="h-44 rounded-2xl bg-slate-200"></div>
        <div class="h-44 rounded-2xl bg-slate-200"></div>
      </div>
    </div>

    <template v-else>
      <div class="animate-fade-up">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
            <LayoutDashboard class="h-6 w-6" />
          </div>
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Welcome {{ studentFullName }}!
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
          to="/student/settings"
          class="inline-flex flex-none items-center justify-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-amber-800"
        >
          Go to Settings
        </router-link>
      </section>

      <!-- Summary Stats Grid -->
      <section aria-label="Evaluation summary" class="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          :icon="UsersRound"
          :value="pendingCount"
          label="Available evaluations"
          helper="Teachers ready for your feedback"
          icon-bg="bg-indigo-50"
          icon-fg="text-indigo-700"
        />
        <StatCard
          :icon="CheckCircle2"
          :value="evaluatedCount"
          label="Evaluations completed"
          helper="You've submitted these so far"
          icon-bg="bg-emerald-50"
          icon-fg="text-emerald-700"
        />
        <StatCard
          :icon="ClipboardList"
          :value="pendingCount"
          label="Pending evaluations"
          helper="Waiting for your response"
          icon-bg="bg-amber-50"
          icon-fg="text-amber-800"
        />
      </section>

      <!-- Teachers Section -->
      <section aria-label="Your teachers" class="mt-6">
        <!-- Filter Controls Bar -->
        <div class="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div class="relative w-full sm:max-w-sm">
            <Search
              class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <label htmlFor="teacher-search" class="sr-only">
              Search teachers
            </label>
            <input
              id="teacher-search"
              type="search"
              v-model="searchQuery"
              placeholder="Search teachers..."
              class="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2 max-w-full">
            <button
              type="button"
              @click="hideEvaluated = !hideEvaluated"
              :aria-pressed="hideEvaluated"
              :class="[
                'inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors',
                hideEvaluated
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : 'border-line bg-white text-ink-soft hover:bg-slate-50'
              ]"
            >
              <EyeOff class="h-4 w-4" aria-hidden="true" />
              Hide Evaluated
            </button>

            <div class="relative flex-1 sm:flex-none">
              <ArrowUpDown
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <label htmlFor="teacher-sort" class="sr-only">
                Sort teachers
              </label>
              <select
                id="teacher-sort"
                v-model="sortBy"
                class="w-full appearance-none rounded-xl border border-line bg-white py-2.5 pl-9 pr-8 text-xs sm:text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="name">Sort by Name</option>
                <option value="subject">Sort by Subject</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Teachers Grid -->
        <div v-if="filteredTeachers.length > 0" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TeacherCard
            v-for="teacher in filteredTeachers"
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
          <p class="mt-3 text-sm font-bold text-ink">No teachers match your filters</p>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import Pagination from '../../components/Pagination.vue'
import { useApi } from '../../composables/useApi'
import { useAuth } from '../../composables/useAuth'
import { getUserData } from '../../utils/auth'
import API from '../../utils/api'
import { getSchoolLevelCategory, formatGradeSection } from '../../utils/academic'

const router = useRouter()
const { request } = useApi()
const { requireAuth } = useAuth()

const pageLoading = ref(true)
const userProfile = ref({
  userId: null,
  studentId: null,
  email: '',
  firstname: '',
  lastname: '',
  fullname: '',
  grade: null,
  section: null,
  isVerified: true,
})

const schoolLevel = computed(() => getSchoolLevelCategory(userProfile.value.grade))
const gradeSection = computed(() => formatGradeSection(userProfile.value.grade, userProfile.value.section))
const schoolLevelBadgeClass = computed(() => {
  if (schoolLevel.value === 'Elementary') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (schoolLevel.value === 'Junior High School') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  if (schoolLevel.value === 'Senior High School') return 'bg-purple-50 text-purple-700 border-purple-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
})

// Fix 5: derive verified state from profile — no extra API call needed
const verified = computed(() => userProfile.value.isVerified ? '1' : '0')
const teachers = ref([])
const searchQuery = ref('')
const sortBy = ref('name')
const hideEvaluated = ref(false)
const currentPage = ref(1)
const perPage = 12
const totalCount = ref(0)
const evaluatedCount = ref(0)
const pendingCount = ref(0)
const currentPeriod = ref(0)
const schoolYear = ref('')

const studentFullName = computed(() => {
  const explicit = (userProfile.value.fullname || '').trim()
  if (explicit) return explicit
  const first = (userProfile.value.firstname || '').trim()
  const last = (userProfile.value.lastname || '').trim()
  const full = `${first} ${last}`.trim()
  return full || 'Student'
})

const filteredTeachers = computed(() => {
  return teachers.value.filter((teacher) => {
    const isCompleted = teacher.status === 'completed' || teacher.is_evaluated || teacher.evaluated
    if (hideEvaluated.value && isCompleted) return false
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)))

function goToPage(page) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

watch([searchQuery, hideEvaluated, sortBy], () => {
  currentPage.value = 1
  fetchTeachers()
})

watch(currentPage, () => {
  fetchTeachers()
})

async function fetchTeachers() {
  const studentData = getUserData() || {}
  const studentIdToUse =
    userProfile.value.studentId ||
    userProfile.value.userId ||
    studentData.student_id ||
    studentData.user_id ||
    studentData.id

  if (!studentIdToUse) return

  const result = await request(API.teachersList, {
    body: {
      action: 'getTeachers',
      id: studentIdToUse,
      page: currentPage.value,
      perPage,
      search: searchQuery.value,
      sortBy: sortBy.value,
      showEvaluated: !hideEvaluated.value,
    },
  })
  if (result.success) {
    teachers.value = result.teachers || []
    totalCount.value = result.total || result.teachers?.length || 0
    evaluatedCount.value = result.evaluatedCount || 0
    pendingCount.value = result.pendingCount || 0
  }
}

function startEval(teacherId) {
  router.push(`/student-eval/${teacherId}`)
}

function formatPeriodLabel(periodNumber) {
  const labels = ['1st', '2nd', '3rd', '4th']
  return labels[periodNumber - 1] || '—'
}

async function fetchSchedule() {
  const result = await request(API.schedule, { body: { action: 'getTime' } })
  if (result.success) {
    currentPeriod.value = Number(result.currentPeriod || 0)
    schoolYear.value = result.times?.school_year || ''
  }
}

async function loadProfile() {
  const result = await request(API.profile, { method: 'GET' })
  if (result.success) {
    const profile = result.profile || {}
    userProfile.value = {
      userId: profile.userId || profile.id || null,
      studentId: profile.studentId || profile.student_id || null,
      email: profile.email || '',
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
      fullname: profile.fullname || '',
      grade: profile.grade || null,
      section: profile.section || null,
      // Fix 5: read isVerified directly from profile — avoids the extra verificationCheck call
      isVerified: profile.isVerified !== undefined ? profile.isVerified : true,
    }
  }
}

onMounted(async () => {
  if (!requireAuth()) return
  try {
    await loadProfile()
    // Fix 5: checkVerification removed — isVerified now read from profile
    await Promise.all([fetchSchedule(), fetchTeachers()])
  } catch (err) {
    console.error('Error initializing dashboard:', err)
  } finally {
    pageLoading.value = false
  }
})
</script>
