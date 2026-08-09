<template>
  <header class="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
    <div class="mx-auto flex h-16 w-full items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <slot name="left"></slot>
        <h1 class="hidden sm:block truncate text-base sm:text-lg font-bold tracking-tight text-ink">{{ title }}</h1>
      </div>

      <div class="flex items-center gap-2 sm:gap-4 flex-none">
        <!-- Notification Bell -->
        <router-link
          v-if="roleId !== 'admin'"
          :to="`/${roleId}/announcements`"
          class="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell class="h-4 w-4 sm:h-5 sm:w-5" />
          <span v-if="unreadCount > 0" class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </router-link>

        <div class="relative" ref="containerRef">
        <!-- Mobile Circular Profile Button -->
        <button
          type="button"
          @click="open = !open"
          aria-haspopup="menu"
          :aria-expanded="open"
          class="relative flex sm:hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white shadow-soft transition-colors hover:bg-slate-50"
          :title="userName"
        >
          <span :class="['absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white', theme.accent]" aria-hidden="true" />
          <span class="text-xs font-extrabold text-ink">
            {{ userInitials }}
          </span>
        </button>

        <!-- Desktop Full Pill Button -->
        <button
          type="button"
          @click="open = !open"
          aria-haspopup="menu"
          :aria-expanded="open"
          class="hidden sm:flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-3 pr-2 shadow-soft transition-colors hover:bg-slate-50"
        >
          <span :class="['h-2 w-2 flex-none rounded-full', theme.accent]" aria-hidden="true" />
          <span class="text-sm font-semibold text-ink-soft">{{ userRoleLabel }}</span>
          <span class="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-ink">
            {{ userInitials }}
          </span>
          <ChevronDown
            :class="['h-4 w-4 flex-none text-ink-muted transition-transform duration-200', open ? 'rotate-180' : '']"
            aria-hidden="true"
          />
        </button>

        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="open"
            role="menu"
            class="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-lift z-50"
          >
            <div class="border-b border-line px-4 py-3">
              <p class="truncate text-sm font-bold text-ink">{{ userName }}</p>
              <p class="truncate text-xs text-ink-muted">{{ userEmail }}</p>
            </div>
            <router-link
              :to="settingsPath"
              role="menuitem"
              @click="open = false"
              class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-slate-50 hover:text-ink"
            >
              <Settings class="h-4 w-4" aria-hidden="true" />
              Profile Settings
            </router-link>
            <button
              type="button"
              role="menuitem"
              @click="requestSignOut"
              class="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <LogOut class="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>
    </div>
  </header>

  <!-- Logout Confirmation Modal -->
  <ConfirmModal
    :visible="showConfirm"
    title="Sign Out"
    message="Are you sure you want to sign out of your account?"
    confirmText="Sign Out"
    cancelText="Cancel"
    icon="logout"
    :danger="true"
    @confirm="handleSignOut"
    @cancel="showConfirm = false"
    @update:visible="showConfirm = $event"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronDown, LogOut, Settings, Bell } from '@lucide/vue'
import { useAuth } from '../../composables/useAuth'
import { getUserData } from '../../utils/auth'
import { getRole } from '../../data/roles'
import { useToast } from '../../composables/useToast'
import ConfirmModal from '../ConfirmModal.vue'
import { useApi } from '../../composables/useApi'
import API from '../../utils/api'

defineProps({
  title: { type: String, required: true }
})

const router = useRouter()
const route = useRoute()
const { userData, logout } = useAuth()
const { request } = useApi()
const { showToast } = useToast()
const open = ref(false)
const containerRef = ref(null)
const showConfirm = ref(false)
const unreadCount = ref(0)

const currentUser = computed(() => userData.value || getUserData() || {})

const roleId = computed(() => {
  const r = (currentUser.value?.role || currentUser.value?.roleId || 'student').toString().toLowerCase()
  if (r.includes('admin') || r.includes('principal')) return 'admin'
  if (r.includes('teacher')) return 'teacher'
  return 'student'
})

const theme = computed(() => getRole(roleId.value).theme)

const userName = computed(() => {
  const u = currentUser.value
  if (u.fullname && u.fullname.trim()) return u.fullname.trim()
  if (u.firstname || u.lastname) return `${u.firstname || ''} ${u.lastname || ''}`.trim()
  return u.name || u.username || 'User'
})

const userEmail = computed(() => {
  const u = currentUser.value
  return u.email || u.user_id || u.student_id || u.teacher_id || 'user@school.edu'
})

const userRoleLabel = computed(() => getRole(roleId.value).label)

const settingsPath = computed(() => {
  if (roleId.value === 'teacher') return '/teacher/settings'
  return '/student/settings'
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

function handlePointerDown(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    open.value = false
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    open.value = false
    showConfirm.value = false
  }
}

// Open confirm modal first instead of logging out immediately
function requestSignOut() {
  open.value = false
  showConfirm.value = true
}

// Actually perform logout after user confirms
function handleSignOut() {
  showConfirm.value = false
  // Fire global toast BEFORE logging out so it persists on the login page
  showToast('Logged out successfully!', 'success')
  logout()
  router.push('/login')
}

async function fetchUnreadCount() {
  if (roleId.value !== 'admin') {
    const result = await request(`${API.announcements}/feed`, { method: "GET" })
    if (result.success) {
      unreadCount.value = result.announcements.filter(a => !a.is_read).length
    }
  }
}

watch(() => route.path, fetchUnreadCount)

onMounted(() => {
  document.addEventListener('mousedown', handlePointerDown)
  document.addEventListener('keydown', handleKeyDown)
  fetchUnreadCount()
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handlePointerDown)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
