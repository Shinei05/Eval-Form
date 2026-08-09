<template>
  <div class="rounded-2xl border border-line bg-white p-5 shadow-soft">
    <div class="flex items-center gap-3.5">
      <span
        :class="[
          'inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl',
          iconBg,
          iconFg
        ]"
      >
        <component :is="icon" class="h-5 w-5" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="text-2xl font-extrabold leading-none tracking-tight text-ink">{{ value }}</p>
        <p class="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          {{ label }}
        </p>
      </div>
    </div>
    <p class="mt-4 border-t border-line pt-3 text-sm text-ink-soft">{{ helper }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: Object, required: true },
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  helper: { type: String, required: true },
  iconBg: { type: String, default: 'bg-indigo-50' },
  iconFg: { type: String, default: 'text-indigo-700' }
})
</script>
