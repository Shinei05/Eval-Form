<template>
  <DialogModal
    :open="open"
    @close="handleClose"
    title-id="forgot-pw-title"
    description-id="forgot-pw-desc"
  >
    <div class="px-6 pb-6 pt-9 sm:px-8 sm:pb-8">

      <!-- ── Step Indicator ─────────────────────────── -->
      <div class="mb-6 flex items-center justify-center gap-2">
        <div
          v-for="s in 3"
          :key="s"
          :class="[
            'h-1.5 rounded-full transition-all duration-300',
            step === s ? 'w-8 bg-indigo-600' : step > s ? 'w-4 bg-indigo-300' : 'w-4 bg-slate-200'
          ]"
        />
      </div>

      <!-- ─────────────── STEP 1: Email ─────────────── -->
      <template v-if="step === 1">
        <div class="flex flex-col items-center text-center">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Mail class="h-6 w-6" />
          </span>
          <h2 id="forgot-pw-title" class="mt-4 text-xl font-bold tracking-tight text-ink">
            Forgot Password?
          </h2>
          <p id="forgot-pw-desc" class="mt-1 text-sm text-ink-soft">
            Enter your registered email address and we'll send you a 6-digit reset code.
          </p>
        </div>

        <form class="mt-7 space-y-4" @submit.prevent="requestCode">
          <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-center text-red-700 font-medium">
            {{ error }}
          </div>

          <TextField
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            v-model="email"
            auto-complete="email"
            auto-focus
            required
          />

          <button
            type="submit"
            :disabled="loading"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <span>{{ loading ? 'Sending code…' : 'Send Reset Code' }}</span>
          </button>

          <button
            type="button"
            @click="handleClose"
            class="w-full rounded-xl border border-line bg-white py-2.5 text-sm font-bold text-ink-soft transition-colors hover:bg-slate-50 hover:text-ink"
          >
            Back to Sign In
          </button>
        </form>
      </template>

      <!-- ─────────────── STEP 2: OTP Code ─────────── -->
      <template v-else-if="step === 2">
        <div class="flex flex-col items-center text-center">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShieldCheck class="h-6 w-6" />
          </span>
          <h2 id="forgot-pw-title" class="mt-4 text-xl font-bold tracking-tight text-ink">
            Enter Reset Code
          </h2>
          <p id="forgot-pw-desc" class="mt-1 text-sm text-ink-soft">
            We sent a 6-digit code to <span class="font-semibold text-ink">{{ email }}</span>. Check your inbox.
          </p>
        </div>

        <form class="mt-7 space-y-5" @submit.prevent="verifyCode">
          <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-center text-red-700 font-medium">
            {{ error }}
          </div>

          <!-- 6-digit OTP input boxes -->
          <div class="space-y-2">
            <label class="block text-center text-sm font-semibold text-ink">6-Digit OTP</label>
            <div class="flex items-center justify-center gap-2 sm:gap-3" ref="otpContainer">
              <input
                v-for="(_, i) in digits"
                :key="i"
                :ref="el => { if (el) digitRefs[i] = el }"
                v-model="digits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                :data-autofocus="i === 0 ? true : undefined"
                :aria-label="`OTP digit ${i + 1}`"
                @input="onDigitInput(i, $event)"
                @keydown="onDigitKeydown(i, $event)"
                @paste="onPaste($event)"
                @focus="$event.target.select()"
                :class="[
                  'h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 bg-white text-center text-lg font-bold text-ink transition-all duration-150 outline-none font-mono',
                  digits[i]
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                    : 'border-line hover:border-slate-300 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
                ]"
              />
            </div>
            <p class="text-center text-xs text-ink-muted">Enter the 6 digits sent to your email</p>
          </div>

          <button
            type="submit"
            :disabled="loading || otpValue.length < 6"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <span>{{ loading ? 'Verifying…' : 'Verify Code' }}</span>
          </button>

          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              @click="step = 1; error = ''; digits.fill('')"
              class="flex-1 rounded-xl border border-line bg-white py-2.5 text-sm font-bold text-ink-soft transition-colors hover:bg-slate-50 hover:text-ink"
            >
              ← Back
            </button>
            <button
              type="button"
              :disabled="resendCooldown > 0 || loading"
              @click="requestCode"
              class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code' }}
            </button>
          </div>
        </form>
      </template>

      <!-- ─────────────── STEP 3: New Password ─────── -->
      <template v-else-if="step === 3">
        <div class="flex flex-col items-center text-center">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <KeyRound class="h-6 w-6" />
          </span>
          <h2 id="forgot-pw-title" class="mt-4 text-xl font-bold tracking-tight text-ink">
            Set New Password
          </h2>
          <p id="forgot-pw-desc" class="mt-1 text-sm text-ink-soft">
            Create a strong password for your account.
          </p>
        </div>

        <form class="mt-7 space-y-4" @submit.prevent="changePassword">
          <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-center text-red-700 font-medium">
            {{ error }}
          </div>

          <PasswordField
            label="New Password"
            placeholder="At least 8 characters with numbers & symbols"
            v-model="newPassword"
            auto-complete="new-password"
            required
          />
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter your new password"
            v-model="confirmPassword"
            auto-complete="new-password"
            required
          />

          <!-- Password rules hint -->
          <ul class="space-y-1 rounded-xl border border-line bg-slate-50 px-4 py-3 text-xs text-ink-muted">
            <li :class="['flex items-center gap-2', newPassword.length >= 8 ? 'text-emerald-600' : '']">
              <CheckCircle2 v-if="newPassword.length >= 8" class="h-3.5 w-3.5 shrink-0" />
              <Circle v-else class="h-3.5 w-3.5 shrink-0" />
              At least 8 characters
            </li>
            <li :class="['flex items-center gap-2', /[0-9]/.test(newPassword) ? 'text-emerald-600' : '']">
              <CheckCircle2 v-if="/[0-9]/.test(newPassword)" class="h-3.5 w-3.5 shrink-0" />
              <Circle v-else class="h-3.5 w-3.5 shrink-0" />
              Contains a number
            </li>
            <li :class="['flex items-center gap-2', /[!@#$%^&*_\-+=<>?]/.test(newPassword) ? 'text-emerald-600' : '']">
              <CheckCircle2 v-if="/[!@#$%^&*_\-+=<>?]/.test(newPassword)" class="h-3.5 w-3.5 shrink-0" />
              <Circle v-else class="h-3.5 w-3.5 shrink-0" />
              Contains a symbol (!@#$%…)
            </li>
            <li :class="['flex items-center gap-2', confirmPassword && newPassword === confirmPassword ? 'text-emerald-600' : '']">
              <CheckCircle2 v-if="confirmPassword && newPassword === confirmPassword" class="h-3.5 w-3.5 shrink-0" />
              <Circle v-else class="h-3.5 w-3.5 shrink-0" />
              Passwords match
            </li>
          </ul>

          <button
            type="submit"
            :disabled="loading || !canSubmitPassword"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <span>{{ loading ? 'Updating…' : 'Update Password' }}</span>
          </button>
        </form>
      </template>

      <!-- ─────────────── STEP 4: Success ──────────── -->
      <template v-else-if="step === 4">
        <div class="flex flex-col items-center py-4 text-center">
          <span class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 class="h-9 w-9" />
          </span>
          <h2 id="forgot-pw-title" class="mt-5 text-xl font-bold tracking-tight text-ink">
            Password Updated!
          </h2>
          <p id="forgot-pw-desc" class="mt-2 text-sm leading-relaxed text-ink-soft">
            Your password has been successfully changed. You can now sign in with your new credentials.
          </p>
          <button
            type="button"
            @click="handleClose"
            class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors hover:bg-indigo-700"
          >
            Back to Sign In
          </button>
        </div>
      </template>

    </div>
  </DialogModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Mail, ShieldCheck, KeyRound, Loader2, CheckCircle2, Circle } from '@lucide/vue'
import DialogModal from '../common/DialogModal.vue'
import TextField from '../common/TextField.vue'
import PasswordField from '../common/PasswordField.vue'
import { useApi } from '../../composables/useApi'
import API from '../../utils/api'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { request, isLoading: loading } = useApi()

const step = ref(1)
const email = ref('')
const digits = ref(['', '', '', '', '', ''])
const digitRefs = ref([])
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const resendCooldown = ref(0)
let cooldownTimer = null

const otpValue = computed(() => digits.value.join(''))

const canSubmitPassword = computed(() => {
  const pw = newPassword.value
  return (
    pw.length >= 8 &&
    /[0-9]/.test(pw) &&
    /[!@#$%^&*_\-+=<>?]/.test(pw) &&
    pw === confirmPassword.value
  )
})

// Reset state whenever modal opens
watch(() => props.open, (val) => {
  if (val) {
    step.value = 1
    email.value = ''
    digits.value = ['', '', '', '', '', '']
    newPassword.value = ''
    confirmPassword.value = ''
    error.value = ''
    resendCooldown.value = 0
    if (cooldownTimer) clearInterval(cooldownTimer)
  }
})

// OTP input handlers
function onDigitInput(index, event) {
  const val = event.target.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = val
  if (val && index < 5) {
    nextTick(() => digitRefs.value[index + 1]?.focus())
  }
}

function onDigitKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      digits.value[index - 1] = ''
      nextTick(() => digitRefs.value[index - 1]?.focus())
    } else {
      digits.value[index] = ''
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    nextTick(() => digitRefs.value[index - 1]?.focus())
  } else if (event.key === 'ArrowRight' && index < 5) {
    nextTick(() => digitRefs.value[index + 1]?.focus())
  }
}

function onPaste(event) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    digits.value[i] = pasted[i] || ''
  }
  const focusIndex = Math.min(pasted.length, 5)
  nextTick(() => digitRefs.value[focusIndex]?.focus())
}

function startResendCooldown() {
  resendCooldown.value = 60
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

async function requestCode() {
  error.value = ''
  const result = await request(API.resetPassword, {
    body: { email: email.value },
    auth: false
  })
  if (result.success) {
    step.value = 2
    digits.value = ['', '', '', '', '', '']
    startResendCooldown()
    nextTick(() => digitRefs.value[0]?.focus())
  } else {
    error.value = result.message || result.error || 'Email not found. Please check and try again.'
  }
}

async function verifyCode() {
  error.value = ''
  const result = await request(API.verifyResetCode, {
    body: { email: email.value, code: otpValue.value },
    auth: false
  })
  if (result.success) {
    step.value = 3
  } else {
    error.value = 'Invalid or expired code. Please try again.'
    digits.value = ['', '', '', '', '', '']
    nextTick(() => digitRefs.value[0]?.focus())
  }
}

async function changePassword() {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  const result = await request(API.changePassword, {
    body: {
      email: email.value,
      passwordss: newPassword.value,
      conpassword: confirmPassword.value,
    },
    auth: false
  })
  if (result.success) {
    step.value = 4
  } else {
    error.value = result.message || result.error || 'Failed to update password. Please try again.'
  }
}

function handleClose() {
  emit('close')
}
</script>
