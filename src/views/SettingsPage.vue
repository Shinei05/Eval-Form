<template>
  <div class="w-full font-sans">
    <LoadingOverlay v-if="isLoading" />
    <AppToast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="toast.visible = false"
    />

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
            <h4 class="truncate text-base font-bold text-ink">
              {{ user.firstname }} {{ user.lastname }}
            </h4>
            <span class="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
              {{ user.role || 'User' }}
            </span>
            <p class="mt-1 truncate text-xs text-ink-muted">{{ user.email }}</p>
          </div>
        </div>

        <!-- Teacher Evaluation Distribution -->
        <div v-if="user.role === 'Teacher'" class="mt-6 space-y-6">
          <div>
            <h4 class="text-sm font-bold text-ink">Student Evaluation Distribution</h4>
            <div class="mt-3 space-y-2">
              <div
                v-for="range in studentScoreRanges"
                :key="'student-' + range.label"
                class="flex items-center gap-2 sm:gap-3 text-xs"
              >
                <span class="w-14 shrink-0 font-semibold text-ink-soft">{{ range.label }}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :style="{
                      width: studentEvaluations.length
                        ? (studentEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length / studentEvaluations.length * 100) + '%'
                        : '0%',
                      backgroundColor: range.color
                    }"
                  />
                </div>
                <span class="w-6 shrink-0 text-right font-bold text-ink">
                  {{ studentEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-ink">Peer Evaluation Distribution</h4>
            <div class="mt-3 space-y-2">
              <div
                v-for="range in peerScoreRanges"
                :key="'peer-' + range.label"
                class="flex items-center gap-2 sm:gap-3 text-xs"
              >
                <span class="w-14 shrink-0 font-semibold text-ink-soft">{{ range.label }}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :style="{
                      width: peerEvaluations.length
                        ? (peerEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length / peerEvaluations.length * 100) + '%'
                        : '0%',
                      backgroundColor: range.color
                    }"
                  />
                </div>
                <span class="w-6 shrink-0 text-right font-bold text-ink">
                  {{ peerEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length }}
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft, KeyRound } from '@lucide/vue'
import PasswordField from '../components/common/PasswordField.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import AppToast from '../components/AppToast.vue'
import { useApi } from '../composables/useApi'
import API from '../utils/api'

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
  { label: '4.1-5.0', min: 4.1, max: 5.01, color: '#16a34a' },
  { label: '2.5-4.0', min: 2.5, max: 4.1, color: '#2563eb' },
  { label: '1.0-2.4', min: 1.0, max: 2.5, color: '#dc2626' },
]

const peerScoreRanges = [
  { label: '4.5-5.0', min: 4.5, max: 5.01, color: '#16a34a' },
  { label: '3.5-4.4', min: 3.5, max: 4.5, color: '#2563eb' },
  { label: '2.5-3.4', min: 2.5, max: 3.5, color: '#d97706' },
  { label: '1.0-2.4', min: 1.0, max: 2.5, color: '#dc2626' },
]

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

async function loadProfile() {
  const result = await request(API.profile, { method: 'GET' })
  if (result.success) {
    const profile = result.profile || {}
    user.value = {
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
      email: profile.email || '',
      role: profile.role || '',
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
