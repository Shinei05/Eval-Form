<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop — clicking outside only closes if lockClose is false -->
        <div
          class="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
          @click="lockClose ? undefined : onClose()"
          aria-hidden="true"
        />

        <!-- Panel -->
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          tabindex="-1"
          @keydown="handleKeyDown"
          :class="[
            'relative w-full overflow-hidden rounded-2xl border border-line bg-white shadow-dialog outline-none transition-all duration-200',
            size === 'md' ? 'max-w-lg' : 'max-w-md',
            'max-h-[90vh]'
          ]"
        >
        <!-- X close button — hidden when lockClose is true -->
          <button
            v-if="!lockClose"
            type="button"
            @click="onClose"
            aria-label="Close dialog"
            class="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:bg-slate-50 hover:text-ink"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  titleId: { type: String, required: true },
  descriptionId: { type: String, default: '' },
  size: { type: String, default: 'sm' },
  // When true: no X button, no backdrop close, no Escape close
  lockClose: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const panelRef = ref(null)

function onClose() {
  emit('close')
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    // Only close on Escape if not locked
    if (!props.lockClose) onClose()
    return
  }
  if (event.key !== 'Tab') return
  const panel = panelRef.value
  if (!panel) return
  const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  )
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      setTimeout(() => {
        const panel = panelRef.value
        if (!panel) return
        const target = panel.querySelector('[data-autofocus]') || panel
        target.focus()
      }, 30)
    } else {
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
