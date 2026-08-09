<template>
  <DialogModal
    :open="Boolean(kind)"
    lock-close
    title-id="policy-title"
    description-id="policy-subtitle"
    size="md"
  >
    <div v-if="config" class="flex max-h-[90vh] flex-col">
      <!-- Header -->
      <div class="px-6 pb-5 pt-9 text-center sm:px-8">
        <span
          :class="[
            'inline-flex h-12 w-12 items-center justify-center rounded-xl',
            config.iconBg,
            config.iconFg
          ]"
        >
          <component :is="config.icon" class="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="policy-title" class="mt-4 text-xl font-bold tracking-tight text-ink">
          {{ config.title }}
        </h2>
        <p id="policy-subtitle" class="mt-1 text-sm text-ink-soft">
          {{ config.subtitle }}
        </p>
      </div>

      <!-- Scrollable content area -->
      <div class="min-h-0 flex-1 border-y border-line bg-slate-50/60 relative">
        <div
          ref="scrollEl"
          @scroll="onScroll"
          class="scroll-slim max-h-[38vh] overflow-y-auto px-6 py-5 sm:px-8"
        >
          <div class="space-y-5">
            <section v-for="section in config.sections" :key="section.heading">
              <h3 class="text-[15px] font-bold text-ink">{{ section.heading }}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ section.body }}</p>
            </section>
          </div>
          <!-- Sentinel element — when visible, scroll is at the bottom -->
          <div ref="sentinelEl" class="h-px w-full" aria-hidden="true" />
        </div>

        <!-- Scroll-to-read fade indicator (disappears once scrolled to bottom) -->
        <Transition
          enter-active-class="transition duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-300"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="!hasScrolled"
            class="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2 pt-12"
            :style="{ background: 'linear-gradient(to bottom, transparent, rgb(248 250 252 / 0.96))' }"
            aria-hidden="true"
          >
            <ChevronDown class="h-4 w-4 animate-bounce text-ink-muted" />
            <span class="mt-1 text-[11px] font-semibold text-ink-muted">Scroll to read</span>
          </div>
        </Transition>
      </div>

      <!-- Footer: checkbox + button -->
      <div class="space-y-4 px-6 py-5 sm:px-8">
        <!-- Checkbox — disabled until user has scrolled to the bottom -->
        <div class="flex items-start gap-3">
          <input
            :id="checkboxId"
            type="checkbox"
            v-model="agreed"
            :disabled="!hasScrolled"
            :class="[
              'mt-0.5 h-[18px] w-[18px] flex-none rounded border-slate-300 focus:ring-4 transition-opacity',
              hasScrolled ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40',
              config.checkbox
            ]"
          />
          <label
            :for="checkboxId"
            :class="[
              'text-sm font-semibold transition-opacity select-none',
              hasScrolled ? 'cursor-pointer text-ink' : 'cursor-not-allowed text-ink-muted opacity-60'
            ]"
          >
            {{ config.agreeLabel }}
          </label>
        </div>

        <!-- Hint when not yet scrolled -->
        <p v-if="!hasScrolled" class="flex items-center gap-1.5 text-xs text-ink-muted">
          <Info class="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          Please scroll down to read the full document before agreeing.
        </p>

        <!-- Agree button -->
        <button
          type="button"
          @click="handleAgree"
          :disabled="!agreed"
          :class="[
            'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-bold text-white shadow-soft transition-colors',
            agreed
              ? config.button
              : 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
          ]"
        >
          <Check v-if="agreed" class="h-4 w-4" aria-hidden="true" />
          I Agree &amp; Understand
        </button>
      </div>
    </div>
  </DialogModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Check, ChevronDown, Gavel, Info, Shield } from '@lucide/vue'
import DialogModal from '../common/DialogModal.vue'
import { termsSections, privacySections } from '../../data/policies'

const props = defineProps({
  kind: { type: String, default: null } // 'terms' | 'privacy' | null
})

const emit = defineEmits(['close'])

const agreed = ref(false)
const hasScrolled = ref(false)
const scrollEl = ref(null)
const sentinelEl = ref(null)
const checkboxId = `pol-cb-${Math.random().toString(36).substr(2, 9)}`

let observer = null

function onScroll() {
  if (hasScrolled.value) return
  const el = scrollEl.value
  if (!el) return
  // Trigger when within 8px of the bottom
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 8
  if (atBottom) hasScrolled.value = true
}

function setupObserver() {
  if (observer) observer.disconnect()
  if (!sentinelEl.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) hasScrolled.value = true
    },
    { root: scrollEl.value, threshold: 0.1 }
  )
  observer.observe(sentinelEl.value)
}

function handleAgree() {
  if (!agreed.value) return
  emit('close')
}

watch(
  () => props.kind,
  async (newKind) => {
    agreed.value = false
    hasScrolled.value = false
    if (newKind) {
      // Wait for DOM then setup IntersectionObserver
      await nextTick()
      await nextTick()
      setupObserver()
      // Edge-case: content shorter than the scroll area — mark as scrolled immediately
      if (scrollEl.value) {
        const el = scrollEl.value
        if (el.scrollHeight <= el.clientHeight + 8) {
          hasScrolled.value = true
        }
      }
    } else {
      if (observer) observer.disconnect()
    }
  }
)

const configs = {
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Please scroll down and read our terms of service',
    agreeLabel: 'I Agree to the Terms & Conditions',
    icon: Gavel,
    iconBg: 'bg-indigo-50',
    iconFg: 'text-indigo-700',
    button: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
    checkbox: 'text-indigo-600 focus:ring-indigo-500/30',
    sections: termsSections,
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Please scroll down and read our privacy policy',
    agreeLabel: 'I Agree to the Privacy Policy',
    icon: Shield,
    iconBg: 'bg-emerald-50',
    iconFg: 'text-emerald-700',
    button: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900',
    checkbox: 'text-emerald-700 focus:ring-emerald-600/30',
    sections: privacySections,
  },
}

const config = computed(() => (props.kind ? configs[props.kind] : null))
</script>
