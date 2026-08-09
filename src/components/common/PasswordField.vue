<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-semibold text-ink">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autoComplete"
        :required="required"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 pr-11"
      />
      <button
        type="button"
        @click="visible = !visible"
        :aria-label="visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`"
        :aria-pressed="visible"
        class="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink"
      >
        <EyeOff v-if="visible" class="h-4 w-4" aria-hidden="true" />
        <Eye v-else class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, useId } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

const id = useId ? useId() : `pf-${Math.random().toString(36).substr(2, 9)}`
const visible = ref(false)

defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  autoComplete: { type: String, default: 'current-password' },
  required: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>
