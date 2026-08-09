<template>
  <DialogModal
    :open="Boolean(role)"
    @close="$emit('close')"
    title-id="signin-title"
    description-id="signin-subtitle"
  >
    <div v-if="role" class="px-6 pb-6 pt-9 sm:px-8 sm:pb-8">
      <div class="flex flex-col items-center text-center">
        <span
          :class="[
            'inline-flex h-12 w-12 items-center justify-center rounded-xl',
            role.theme.iconBg,
            role.theme.iconFg
          ]"
        >
          <component :is="iconComponent" class="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="signin-title" class="mt-4 text-xl font-bold tracking-tight text-ink">
          {{ role.signInTitle }}
        </h2>
        <p id="signin-subtitle" class="mt-1 text-sm text-ink-soft">
          {{ role.signInSubtitle }}
        </p>
      </div>

      <form class="mt-7 space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-center text-red-700 font-medium">
          {{ error }}
        </div>

        <TextField
          :label="role.identifierLabel"
          :type="role.identifierType"
          :placeholder="role.identifierPlaceholder"
          v-model="identifier"
          :auto-complete="role.identifierType === 'email' ? 'email' : 'username'"
          auto-focus
          required
        />
        <PasswordField
          label="Password"
          placeholder="Enter your password"
          v-model="password"
          auto-complete="current-password"
          required
        />

        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('forgot-password', role)"
            :class="['rounded-md text-sm font-semibold underline-offset-4 hover:underline', role.theme.link]"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          :disabled="loading"
          :class="[
            'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-80',
            role.theme.button
          ]"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
          <span v-if="loading">Signing in…</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>
  </DialogModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2 } from '@lucide/vue'
import DialogModal from '../common/DialogModal.vue'
import TextField from '../common/TextField.vue'
import PasswordField from '../common/PasswordField.vue'
import { roleIcons } from '../../data/roles'

const props = defineProps({
  role: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['close', 'submit', 'forgot-password'])

const identifier = ref('')
const password = ref('')

const iconComponent = computed(() => (props.role ? roleIcons[props.role.id] : null))

watch(
  () => props.role,
  (newRole) => {
    if (newRole) {
      identifier.value = ''
      password.value = ''
    }
  }
)

function handleSubmit() {
  emit('submit', {
    role: props.role,
    identifier: identifier.value,
    password: password.value
  })
}
</script>
