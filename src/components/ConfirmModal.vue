<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
        @click.self="close"
      >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="show"
          role="dialog"
          :aria-labelledby="`modal-title-${uid}`"
          :aria-describedby="`modal-desc-${uid}`"
          aria-modal="true"
          class="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-white shadow-dialog"
        >
          <!-- Icon header band -->
          <div :class="['flex items-center justify-center px-6 pt-8 pb-5']">
            <span :class="['inline-flex h-14 w-14 items-center justify-center rounded-2xl', iconBg]">
              <component :is="iconComponent" :class="['h-7 w-7', iconFg]" aria-hidden="true" />
            </span>
          </div>

          <!-- Text -->
          <div class="px-6 pb-2 text-center">
            <h2 :id="`modal-title-${uid}`" class="text-lg font-bold text-ink">{{ title }}</h2>
            <p :id="`modal-desc-${uid}`" class="mt-2 text-sm leading-relaxed text-ink-soft">{{ message }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 px-6 py-6">
            <button
              type="button"
              @click="close"
              class="flex-1 rounded-xl border border-line bg-white py-2.5 text-sm font-bold text-ink-soft transition-colors hover:bg-slate-50 hover:text-ink"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              @click="confirm"
              :class="[
                'flex-1 rounded-xl py-2.5 text-sm font-bold text-white shadow-soft transition-colors',
                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
              ]"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { LogOut, Trash2, AlertTriangle, Info, CheckCircle2, Archive } from '@lucide/vue'

const uid = Math.random().toString(36).slice(2, 8)

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  // New: icon name matching Lucide ('logout' | 'delete' | 'warning' | 'info' | 'success')
  icon: { type: String, default: 'warning' },
  // New: set true to make confirm button red
  danger: { type: Boolean, default: false },
  // Legacy compat — ignored, kept so existing callers don't warn
  confirmBtnClass: { type: String, default: '' },
  iconColor: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const show = ref(props.visible)

watch(() => props.visible, (val) => {
  show.value = val
  document.body.style.overflow = val ? 'hidden' : ''
})

onUnmounted(() => {
  const backdrops = document.querySelectorAll('.modal-backdrop')
  if (backdrops.length === 0) document.body.style.overflow = ''
})

const iconMap = {
  logout: LogOut,
  delete: Trash2,
  archive: Archive,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
}

const iconBgMap = {
  logout: 'bg-red-50',
  delete: 'bg-red-50',
  archive: 'bg-rose-50',
  warning: 'bg-amber-50',
  info: 'bg-indigo-50',
  success: 'bg-emerald-50',
}

const iconFgMap = {
  logout: 'text-red-600',
  delete: 'text-red-600',
  archive: 'text-rose-600',
  warning: 'text-amber-600',
  info: 'text-indigo-600',
  success: 'text-emerald-600',
}

const iconComponent = computed(() => iconMap[props.icon] || AlertTriangle)
const iconBg = computed(() => iconBgMap[props.icon] || 'bg-amber-50')
const iconFg = computed(() => iconFgMap[props.icon] || 'text-amber-600')

function close() {
  show.value = false
  emit('update:visible', false)
  emit('cancel')
}

function confirm() {
  show.value = false
  emit('update:visible', false)
  emit('confirm')
}
</script>
