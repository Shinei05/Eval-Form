<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-semibold text-ink">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autoComplete"
      :required="required"
      :data-autofocus="autoFocus ? true : undefined"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
    />
  </div>
</template>

<script setup>
import { useId } from 'vue'

const id = useId ? useId() : `tf-${Math.random().toString(36).substr(2, 9)}`

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  autoFocus: { type: Boolean, default: false },
  autoComplete: { type: String, default: '' },
  required: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>
