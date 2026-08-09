<template>
  <div class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 font-sans">
    <!-- Local campus background image overlay -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
      :style="{ backgroundImage: `url(${branding.campusImage})` }"
      aria-hidden="true"
    />
    <div class="absolute inset-0 bg-slate-950/75 pointer-events-none" aria-hidden="true" />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.85)_80%)] pointer-events-none"
      aria-hidden="true"
    />

    <!-- Hero Container -->
    <div class="relative z-10 w-full max-w-xl animate-fade-up">
      <!-- School & Department Seals Header -->
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <div
          v-for="seal in branding.seals"
          :key="seal.alt"
          class="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-md ring-2 ring-white/40 transition-transform duration-200 hover:scale-105"
        >
          <img
            :src="seal.src"
            :alt="seal.alt"
            class="h-full w-full object-contain"
          />
        </div>
      </div>

      <!-- System Title & Tagline -->
      <div class="mt-5 text-center">
        <h1 class="text-2xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
          {{ branding.name }}
        </h1>
        <p class="mt-2 text-sm text-slate-200 drop-shadow sm:text-base">{{ branding.tagline }}</p>
      </div>

      <!-- Role Selection Cards -->
      <h2 class="sr-only">Choose how you want to sign in</h2>
      <div class="mt-8 space-y-3">
        <RoleCard
          v-for="roleItem in roles"
          :key="roleItem.id"
          :role="roleItem"
          @select="activeRole = roleItem"
        />
      </div>

      <!-- Policy Footer -->
      <footer class="mt-9 flex items-center justify-center gap-3 text-sm">
        <button
          type="button"
          @click="activePolicy = 'terms'"
          class="rounded-md font-medium text-slate-200 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Terms and Conditions
        </button>
        <span class="text-slate-500" aria-hidden="true">•</span>
        <button
          type="button"
          @click="activePolicy = 'privacy'"
          class="rounded-md font-medium text-slate-200 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Privacy Policy
        </button>
      </footer>
    </div>

    <!-- Sign In Modal -->
    <SignInModal
      :role="activeRole"
      :loading="isLoading"
      :error="loginError"
      @close="activeRole = null"
      @submit="handleSignInSubmit"
    />

    <!-- Policy Modal -->
    <PolicyModal
      :kind="activePolicy"
      @close="activePolicy = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { branding } from '../../data/branding'
import { roles } from '../../data/roles'
import RoleCard from '../../components/auth/RoleCard.vue'
import SignInModal from '../../components/auth/SignInModal.vue'
import PolicyModal from '../../components/auth/PolicyModal.vue'
import { useApi } from '../../composables/useApi'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import API from '../../utils/api'

const router = useRouter()
const { request, isLoading } = useApi()
const { login } = useAuth()
const { showToast } = useToast()

const activeRole = ref(null)
const activePolicy = ref(null)
const loginError = ref('')

async function handleSignInSubmit({ role, identifier, password }) {
  loginError.value = ''
  let url
  if (role.id === 'student') {
    url = API.login
  } else if (role.id === 'teacher') {
    url = API.loginTeacher
  } else {
    url = API.loginAdmin
  }

  const result = await request(url, {
    body: { action: 'login', id: identifier, ps: password },
    auth: false
  })

  if (result.success) {
    if (result.scheduleClosed) {
      activeRole.value = null
      router.push('/closed')
      return
    }

    login(result.token, result.userData)
    activeRole.value = null
    // Fire global toast BEFORE navigating so it survives the route change
    showToast('Login Successful! Welcome back.', 'success')

    const redirectMap = {
      student: '/student',
      teacher: '/teacher',
      admin: '/principal?tab=evaluate',
    }
    router.replace(redirectMap[role.id] || '/student')
  } else {
    loginError.value = result.error || 'Invalid Credentials. Please check your username and password.'
  }
}
</script>
