<template>
  <article class="flex flex-col rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-soft transition-shadow duration-200 hover:shadow-lift w-full max-w-full overflow-hidden">
    <div class="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2.5">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <span
          class="inline-flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-xl bg-slate-100 text-ink-soft"
          aria-hidden="true"
        >
          <UserRound class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-base font-bold text-ink" :title="teacherFullName">{{ teacherFullName }}</h3>
          <p class="truncate text-xs sm:text-sm text-ink-soft" :title="teacher.subject || teacher.department || 'Faculty'">{{ teacher.subject || teacher.department || 'Faculty' }}</p>
        </div>
      </div>

      <span
        :class="[
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]',
          isCompleted
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        ]"
      >
        <CheckCircle2 v-if="isCompleted" class="h-3.5 w-3.5" aria-hidden="true" />
        {{ isCompleted ? 'Completed' : 'Pending' }}
      </span>
    </div>

    <dl class="mt-3.5 flex flex-wrap items-center gap-2 max-w-full">
      <div class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-slate-50 px-2.5 py-1 text-xs font-medium text-ink-soft max-w-full">
        <dt class="sr-only">Evaluation period</dt>
        <CalendarDays class="h-3.5 w-3.5 flex-none text-ink-muted" aria-hidden="true" />
        <dd class="truncate">{{ teacherPeriod }}</dd>
      </div>
      <div v-if="teacher.email" class="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-line bg-slate-50 px-2.5 py-1 text-xs font-medium text-ink-soft">
        <dt class="sr-only">Email</dt>
        <Mail class="h-3.5 w-3.5 flex-none text-ink-muted" aria-hidden="true" />
        <dd class="truncate">{{ teacher.email }}</dd>
      </div>
    </dl>

    <button
      type="button"
      @click="$emit('evaluate', teacher)"
      :disabled="isCompleted"
      :class="[
        'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
        isCompleted
          ? 'cursor-not-allowed border border-line bg-slate-50 text-ink-muted'
          : 'border border-indigo-600 bg-indigo-600 text-white shadow-soft hover:bg-indigo-700'
      ]"
    >
      <CheckCircle2 v-if="isCompleted" class="h-4 w-4" aria-hidden="true" />
      <SquarePen v-else class="h-4 w-4" aria-hidden="true" />
      {{ isCompleted ? 'Evaluated' : 'Evaluate' }}
      <span class="sr-only"> {{ teacherFullName }}</span>
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { CalendarDays, CheckCircle2, Mail, SquarePen, UserRound } from '@lucide/vue'

const props = defineProps({
  teacher: { type: Object, required: true }
})

defineEmits(['evaluate'])

const teacherFullName = computed(() => {
  const t = props.teacher
  if (t.firstname || t.lastname) {
    return `${t.firstname || ''} ${t.lastname || ''}`.trim()
  }
  return t.name || t.teacher_name || 'Unknown Teacher'
})

const isCompleted = computed(() => {
  const t = props.teacher
  return t.evaluated === 'evaluated' || t.status === 'completed' || t.is_evaluated === true
})

const teacherPeriod = computed(() => {
  const t = props.teacher
  if (t.period) return t.period
  if (t.quarter && t.year) {
    const qStr = String(t.quarter)
    const formattedQ = qStr.startsWith('Q') ? qStr : `Q${qStr}`
    return `${formattedQ} ${t.year}`
  }
  if (t.quarter) {
    const qStr = String(t.quarter)
    return qStr.startsWith('Q') ? qStr : `Q${qStr}`
  }
  if (t.year) return String(t.year)
  return '—'
})
</script>
