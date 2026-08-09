<template>
  <button
    type="button"
    @click="$emit('select', role)"
    class="group flex w-full items-center gap-4 rounded-2xl border border-white/60 bg-white p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-lift sm:p-5"
  >
    <span
      :class="[
        'inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl',
        role.theme.iconBg,
        role.theme.iconFg
      ]"
    >
      <component :is="iconComponent" class="h-[22px] w-[22px]" aria-hidden="true" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-base font-bold text-ink">{{ role.label }}</span>
      <span class="mt-0.5 block text-sm leading-snug text-ink-soft">{{ role.description }}</span>
    </span>
    <ArrowRight
      :class="[
        'h-5 w-5 flex-none transition-transform duration-200 group-hover:translate-x-1',
        role.theme.iconFg
      ]"
      aria-hidden="true"
    />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight } from '@lucide/vue'
import { roleIcons } from '../../data/roles'

const props = defineProps({
  role: { type: Object, required: true }
})

defineEmits(['select'])

const iconComponent = computed(() => roleIcons[props.role.id])
</script>
