<template>
  <div class="w-full font-sans">
    <AppToast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="toast.visible = false"
    />

    <!-- Skeleton Loading State (Matches Profile & Security Card Grid Layout) -->
    <div v-if="isLoading" class="animate-pulse space-y-6">
      <div class="h-6 w-36 rounded-lg bg-slate-200"></div>
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Profile Card Skeleton -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div class="h-6 w-44 rounded-lg bg-slate-200"></div>
          <div class="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div class="h-14 w-14 rounded-2xl bg-slate-200 shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-5 w-40 rounded-lg bg-slate-200"></div>
              <div class="h-4 w-52 rounded-lg bg-slate-200"></div>
            </div>
          </div>
          <div class="space-y-3 pt-2">
            <div class="h-4 w-28 rounded bg-slate-200"></div>
            <div class="h-10 w-full rounded-xl bg-slate-200"></div>
            <div class="h-4 w-28 rounded bg-slate-200"></div>
            <div class="h-10 w-full rounded-xl bg-slate-200"></div>
          </div>
        </div>

        <!-- Security Card Skeleton -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div class="h-6 w-44 rounded-lg bg-slate-200"></div>
          <div class="space-y-4 pt-2">
            <div class="space-y-2">
              <div class="h-4 w-32 rounded bg-slate-200"></div>
              <div class="h-11 w-full rounded-xl bg-slate-200"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 w-32 rounded bg-slate-200"></div>
              <div class="h-11 w-full rounded-xl bg-slate-200"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 w-36 rounded bg-slate-200"></div>
              <div class="h-11 w-full rounded-xl bg-slate-200"></div>
            </div>
            <div class="h-11 w-32 rounded-xl bg-slate-200 pt-2"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Back nav -->
      <div class="mb-6 flex items-center">
        <button
          type="button"
          @click="$router.push(backPath)"
          class="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
      <!-- Profile Card -->
      <section class="rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-soft">
        <h3 class="text-lg font-bold text-ink">Profile Information</h3>
        <div class="mt-5 flex items-center gap-4 border-b border-line pb-5">
          <div class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-extrabold text-indigo-700">
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="truncate text-base font-bold text-ink">
                {{ user.firstname }} {{ user.lastname }}
              </h4>
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                {{ user.role || 'User' }}
              </span>
            </div>
            <p class="mt-0.5 truncate text-xs font-medium text-ink-muted">{{ user.email }}</p>
            <!-- Student Pills -->
            <div v-if="user.role === 'Student' && (schoolLevel || gradeSection)" class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                v-if="schoolLevel"
                :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border', schoolLevelBadgeClass]"
              >
                {{ schoolLevel }}
              </span>
              <span
                v-if="gradeSection"
                class="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
              >
                {{ gradeSection }}
              </span>
            </div>

            <!-- Teacher / Admin Pills -->
            <div v-if="(user.role === 'Teacher' || user.role === 'Admin') && (teacherSpecialization || teacherAssignedGrade || teacherActiveTerm)" class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                v-if="teacherSpecialization"
                class="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
              >
                {{ teacherSpecialization }}
              </span>
              <span
                v-if="teacherAssignedGrade"
                class="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
              >
                {{ teacherAssignedGrade }}
              </span>
              <span
                v-if="teacherActiveTerm"
                class="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              >
                Term: {{ teacherActiveTerm }}
              </span>
            </div>
          </div>
        </div>

        <!-- Teacher Evaluation Distribution -->
        <div v-if="user.role === 'Teacher'" class="mt-6 space-y-6">
          <div>
            <h4 class="text-sm font-bold text-ink">Student Evaluation Distribution</h4>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="range in studentScoreRanges"
                :key="'student-' + range.label"
                class="group relative flex items-center gap-2 sm:gap-3 text-xs"
              >
                <span class="w-14 shrink-0 font-semibold text-ink-soft">{{ range.label }}</span>
                <div
                  class="relative h-2.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-100 transition-colors hover:bg-slate-200/80"
                  :title="getStudentRangeTooltip(range)"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :style="{
                      width: getStudentRangePercentage(range) + '%',
                      backgroundColor: range.color
                    }"
                  />
                </div>

                <!-- Floating Hover Tooltip -->
                <div class="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:visible pointer-events-none z-20">
                  <div class="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-xl flex items-center gap-1.5">
                    <span class="font-bold text-amber-300">{{ range.meaning }}:</span>
                    <span class="font-medium text-slate-100">
                      {{ getStudentRangeCount(range) }} {{ getStudentRangeCount(range) === 1 ? 'rating' : 'ratings' }} ({{ getStudentRangePercentage(range) }}%)
                    </span>
                  </div>
                  <div class="mx-auto -mt-1 h-2 w-2 rotate-45 bg-slate-900"></div>
                </div>

                <span class="w-6 shrink-0 text-right font-bold text-ink">
                  {{ getStudentRangeCount(range) }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-ink">Peer Evaluation Distribution</h4>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="range in peerScoreRanges"
                :key="'peer-' + range.label"
                class="group relative flex items-center gap-2 sm:gap-3 text-xs"
              >
                <span class="w-14 shrink-0 font-semibold text-ink-soft">{{ range.label }}</span>
                <div
                  class="relative h-2.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-100 transition-colors hover:bg-slate-200/80"
                  :title="getPeerRangeTooltip(range)"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :style="{
                      width: getPeerRangePercentage(range) + '%',
                      backgroundColor: range.color
                    }"
                  />
                </div>

                <!-- Floating Hover Tooltip -->
                <div class="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:visible pointer-events-none z-20">
                  <div class="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-xl flex items-center gap-1.5">
                    <span class="font-bold text-sky-300">{{ range.meaning }}:</span>
                    <span class="font-medium text-slate-100">
                      {{ getPeerRangeCount(range) }} {{ getPeerRangeCount(range) === 1 ? 'rating' : 'ratings' }} ({{ getPeerRangePercentage(range) }}%)
                    </span>
                  </div>
                  <div class="mx-auto -mt-1 h-2 w-2 rotate-45 bg-slate-900"></div>
                </div>

                <span class="w-6 shrink-0 text-right font-bold text-ink">
                  {{ getPeerRangeCount(range) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Security Card -->
      <section class="rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-soft">
        <h3 class="text-lg font-bold text-ink">Security Settings</h3>
        <p class="mt-1 text-sm text-ink-soft">
          Update your account password to ensure your evaluations remain secure.
        </p>

        <form @submit.prevent="updatePassword" class="mt-6 space-y-4">
          <PasswordField
            label="Current Password"
            placeholder="Enter current password"
            v-model="passwordForm.currentPassword"
            required
          />
          <PasswordField
            label="New Password"
            placeholder="Enter new password (min 8 chars, num & symbol)"
            v-model="passwordForm.newPassword"
            auto-complete="new-password"
            required
          />
          <PasswordField
            label="Confirm Password"
            placeholder="Confirm new password"
            v-model="passwordForm.confirmPassword"
            auto-complete="new-password"
            required
          />

          <button
            type="submit"
            :disabled="isLoading"
            class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors hover:bg-indigo-700 disabled:opacity-75"
          >
            <KeyRound class="h-4 w-4" />
            Update Password
          </button>
        </form>
      </section>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft, KeyRound } from '@lucide/vue'
import PasswordField from '../components/common/PasswordField.vue'
import AppToast from '../components/AppToast.vue'
import { useApi } from '../composables/useApi'
import API from '../utils/api'
import {
  getSchoolLevelCategory,
  formatGradeSection,
  formatTeacherAssignedGrade,
  formatActiveTerm,
} from '../utils/academic'

const { request, isLoading } = useApi()
const user = ref({})
const toast = reactive({ visible: false, message: '', type: 'success' })

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const evaluatorsList = ref([])
const studentEvaluations = ref([])
const peerEvaluations = ref([])

const studentScoreRanges = [
  { label: '4.1-5.0', min: 4.1, max: 5.01, color: '#16a34a', meaning: 'Outstanding' },
  { label: '2.5-4.0', min: 2.5, max: 4.1, color: '#2563eb', meaning: 'Satisfactory' },
  { label: '1.0-2.4', min: 1.0, max: 2.5, color: '#dc2626', meaning: 'Needs Improvement' },
]

const peerScoreRanges = [
  { label: '4.5-5.0', min: 4.5, max: 5.01, color: '#16a34a', meaning: 'Outstanding' },
  { label: '3.5-4.4', min: 3.5, max: 4.5, color: '#2563eb', meaning: 'Very Satisfactory' },
  { label: '2.5-3.4', min: 2.5, max: 3.5, color: '#d97706', meaning: 'Satisfactory' },
  { label: '1.0-2.4', min: 1.0, max: 2.5, color: '#dc2626', meaning: 'Needs Improvement' },
]

function getStudentRangeCount(range) {
  if (!studentEvaluations.value.length) return 0
  return studentEvaluations.value.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length
}

function getStudentRangePercentage(range) {
  if (!studentEvaluations.value.length) return 0
  const count = getStudentRangeCount(range)
  return Math.round((count / studentEvaluations.value.length) * 100)
}

function getStudentRangeTooltip(range) {
  const count = getStudentRangeCount(range)
  const pct = getStudentRangePercentage(range)
  return `${range.label} (${range.meaning}): ${count} student rating${count === 1 ? '' : 's'} (${pct}%)`
}

function getPeerRangeCount(range) {
  if (!peerEvaluations.value.length) return 0
  return peerEvaluations.value.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length
}

function getPeerRangePercentage(range) {
  if (!peerEvaluations.value.length) return 0
  const count = getPeerRangeCount(range)
  return Math.round((count / peerEvaluations.value.length) * 100)
}

function getPeerRangeTooltip(range) {
  const count = getPeerRangeCount(range)
  const pct = getPeerRangePercentage(range)
  return `${range.label} (${range.meaning}): ${count} peer rating${count === 1 ? '' : 's'} (${pct}%)`
}

// Back path derived from role
const backPath = computed(() => {
  const role = (user.value.role || '').toLowerCase()
  if (role === 'admin') return '/principal'
  if (role === 'teacher') return '/teacher'
  return '/student'
})

// Avatar initials derived from profile
const userInitials = computed(() => {
  const f = (user.value.firstname || '').charAt(0)
  const l = (user.value.lastname || '').charAt(0)
  return (f + l).toUpperCase() || 'U'
})

const schoolLevel = computed(() => getSchoolLevelCategory(user.value.grade))
const gradeSection = computed(() => formatGradeSection(user.value.grade, user.value.section))
const schoolLevelBadgeClass = computed(() => {
  if (schoolLevel.value === 'Elementary') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (schoolLevel.value === 'Junior High School') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  if (schoolLevel.value === 'Senior High School') return 'bg-purple-50 text-purple-700 border-purple-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
})

const teacherSpecialization = computed(() => user.value.subjectName ? `Dept/Spec: ${user.value.subjectName}` : null)
const teacherAssignedGrade = computed(() => formatTeacherAssignedGrade(user.value.isElementary, user.value.isJhs))
const teacherActiveTerm = computed(() => formatActiveTerm(user.value.quarter, user.value.year))

async function loadProfile() {
  const result = await request(API.profile, { method: 'GET' })
  if (result.success) {
    const profile = result.profile || {}
    user.value = {
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
      email: profile.email || '',
      role: profile.role || '',
      grade: profile.grade || null,
      section: profile.section || null,
      studId: profile.studId || null,
      subjectName: profile.subjectName || profile.subject || null,
      quarter: profile.quarter || null,
      year: profile.year || null,
      identifier: profile.identifier || null,
      isElementary: Boolean(profile.isElementary),
      isJhs: Boolean(profile.isJhs),
    }
    if (user.value.role === 'Teacher') {
      fetchEvaluations()
    }
  }
}

async function fetchEvaluations() {
  const result = await request(API.evalMyEvaluations, { body: {} })
  if (result.success) {
    const all = result.evaluators || []
    evaluatorsList.value = all
    studentEvaluations.value = all.filter((e) => e.type === 'student')
    peerEvaluations.value = all.filter((e) => e.type === 'peer')
  }
}

async function updatePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.message = 'Passwords do not match.'
    toast.type = 'error'
    toast.visible = true
    return
  }

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-+=<>?]).{8,}$/
  if (!passwordRegex.test(passwordForm.newPassword)) {
    toast.message = 'Password must be at least 8 characters long and include numbers and symbols.'
    toast.type = 'error'
    toast.visible = true
    return
  }

  const result = await request(API.updatePassword, {
    body: {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
      email: user.value.email,
    },
    auth: false,
  })

  if (result.success) {
    toast.message = 'Password updated successfully!'
    toast.type = 'success'
    toast.visible = true
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    toast.message = result.error || 'Failed to update password.'
    toast.type = 'error'
    toast.visible = true
  }
}

onMounted(() => {
  loadProfile()
})
</script>
