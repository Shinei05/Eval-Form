<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="show"
      role="alert"
      :class="[
        'fixed right-5 top-5 z-[10000] flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl p-4 shadow-dialog',
        styles.bg, styles.border
      ]"
    >
      <!-- Icon -->
      <span :class="['mt-0.5 flex-none', styles.iconFg]">
        <component :is="iconComponent" class="h-5 w-5" aria-hidden="true" />
      </span>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p :class="['text-xs font-extrabold uppercase tracking-wide', styles.titleFg]">
          {{ titles[type] }}
        </p>
        <p :class="['mt-0.5 text-sm font-medium leading-snug', styles.msgFg]">
          {{ message }}
        </p>
      </div>

      <!-- Close -->
      <button
        type="button"
        @click="dismiss"
        :class="['flex-none rounded-lg p-1 transition-colors', styles.closeFg]"
        aria-label="Dismiss"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>

      <!-- Progress bar -->
      <div
        :class="['absolute bottom-0 left-0 h-[3px] rounded-full', styles.progressBg]"
        :style="{ animation: `shrink ${duration}ms linear forwards` }"
      />
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from '@lucide/vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: {
    type: String,
    default: 'success',
    validator: (v) => ['success', 'error', 'info', 'warning'].includes(v),
  },
  duration: { type: Number, default: 4000 },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const show = ref(false)
let timer = null

function dismiss() {
  show.value = false
  emit('close')
}

function startTimer() {
  if (timer) clearTimeout(timer)
  if (props.duration > 0) {
    timer = setTimeout(dismiss, props.duration)
  }
}

// immediate: true ensures the first mount with visible=true is handled correctly
watch(
  () => props.visible,
  (val) => {
    if (val) {
      show.value = true
      startTimer()
    } else {
      if (timer) clearTimeout(timer)
      show.value = false
    }
  },
  { immediate: true }
)

const titles = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styleMap = {
  success: {
    bg: 'bg-emerald-50 border border-emerald-200',
    border: '',
    iconFg: 'text-emerald-600',
    titleFg: 'text-emerald-800',
    msgFg: 'text-emerald-900/80',
    closeFg: 'text-emerald-600 hover:bg-emerald-100',
    progressBg: 'bg-emerald-400',
  },
  error: {
    bg: 'bg-red-50 border border-red-200',
    border: '',
    iconFg: 'text-red-600',
    titleFg: 'text-red-800',
    msgFg: 'text-red-900/80',
    closeFg: 'text-red-600 hover:bg-red-100',
    progressBg: 'bg-red-400',
  },
  warning: {
    bg: 'bg-amber-50 border border-amber-200',
    border: '',
    iconFg: 'text-amber-600',
    titleFg: 'text-amber-800',
    msgFg: 'text-amber-900/80',
    closeFg: 'text-amber-600 hover:bg-amber-100',
    progressBg: 'bg-amber-400',
  },
  info: {
    bg: 'bg-indigo-50 border border-indigo-200',
    border: '',
    iconFg: 'text-indigo-600',
    titleFg: 'text-indigo-800',
    msgFg: 'text-indigo-900/80',
    closeFg: 'text-indigo-600 hover:bg-indigo-100',
    progressBg: 'bg-indigo-400',
  },
}

const iconComponent = computed(() => iconMap[props.type] || CheckCircle2)
const styles = computed(() => styleMap[props.type] || styleMap.success)
</script>

<style scoped>
@keyframes shrink {
  from { width: 100%; }
  to   { width: 0%; }
}
</style>
