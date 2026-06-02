<script setup>
import { computed } from "vue";

const props = defineProps({
	teacher: {
		type: Object,
		required: true,
	},
	actionText: {
		type: String,
		default: "Evaluate",
	},
	evaluatedText: {
		type: String,
		default: "Done",
	},
});

defineEmits(["action"]);

const isEvaluated = computed(() => {
	return (
		props.teacher.evaluated === "evaluated" ||
		props.teacher.evaluated === true ||
		props.teacher.evaluated === 1 ||
		props.teacher.evaluated === "1"
	);
});
</script>

<template>
	<div class="teacher-card" :class="{ 'card-evaluated': isEvaluated }">
		<div class="card-inner">
			<div class="card-header">
				<div class="profile-section">
					<div class="person-icon" :class="isEvaluated ? 'icon-evaluated' : 'icon-pending'">
						<span class="material-icons-outlined">person</span>
					</div>
					<div class="teacher-info">
						<h3>{{ teacher.firstname }} {{ teacher.lastname }}</h3>
						<p v-if="teacher.subject" class="subject">{{ teacher.subject }}</p>
					</div>
				</div>

				<div class="status-section">
					<span v-if="isEvaluated" class="status-pill pill-evaluated">Evaluated</span>
					<span v-else class="status-pill pill-pending">Pending</span>
				</div>
			</div>
			<div class="card-meta">
				<span v-if="teacher.quarter" class="meta-tag">Q{{ teacher.quarter }} {{ teacher.year }}</span>
				<span v-if="teacher.email" class="meta-tag">{{ teacher.email }}</span>
			</div>
			<div class="card-footer">
				<button v-if="isEvaluated" class="btn-card-action action-disabled" disabled>
					<span class="material-icons-outlined btn-icon">visibility</span> {{ evaluatedText }}
				</button>
				<button v-else class="btn-card-action" @click="$emit('action', teacher.id)">
					<span class="material-icons-outlined btn-icon">rate_review</span> {{ actionText }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.teacher-card {
	background: #ffffff;
	border-radius: var(--radius-lg);
	display: flex;
	flex-direction: column;
	border-left: 4px solid;
}
.teacher-card.card-evaluated { border-left-color: #16a34a; }
.teacher-card:not(.card-evaluated) { border-left-color: #f59e0b; }

.card-inner {
	padding: var(--space-5);
	display: flex;
	flex-direction: column;
	flex: 1;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: var(--space-3);
}

.profile-section {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	min-width: 0;
}

.person-icon {
	width: 48px;
	height: 48px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.person-icon .material-icons-outlined {
	font-size: 1.5rem;
}
.icon-evaluated {
	background: linear-gradient(135deg, #dcfce7, #bbf7d0);
	color: #16a34a;
}
.icon-pending {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	color: #d97706;
}

.teacher-info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.teacher-info h3 {
	font-size: 1.0625rem;
	font-weight: 700;
	color: #0f172a;
	margin: 0 0 2px 0;
	line-height: 1.2;
	white-space: normal;
	word-break: break-word;
}

.teacher-info .subject {
	font-size: 0.8125rem;
	color: #64748b;
	margin: 0;
	white-space: normal;
	word-break: break-word;
}

.status-section {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	flex-shrink: 0;
}

.status-pill {
	font-size: 0.7rem;
	font-weight: 600;
	padding: 3px 10px;
	border-radius: 999px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.pill-evaluated {
	background: #dcfce7;
	color: #15803d;
}
.pill-pending {
	background: #fef3c7;
	color: #b45309;
}

.card-meta {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin-top: var(--space-4);
	flex: 1;
	align-content: flex-start;
}

.meta-tag {
	font-size: 0.7rem;
	font-weight: 500;
	color: #64748b;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 2px 8px;
	border-radius: 6px;
	white-space: nowrap;
}

.card-footer {
	margin-top: var(--space-4);
	display: flex;
}

.btn-card-action {
	width: 100%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: 0.625rem 1rem;
	font-weight: 600;
	font-size: 0.8125rem;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;
	background: #ffffff;
	border: 1px solid #94a3b8;
	color: #0f172a;
}
.btn-card-action:hover:not(:disabled) {
	background: #f8fafc;
	border-color: #64748b;
}

.btn-icon {
	font-size: 1.125rem;
}

.action-disabled {
	background: #f1f5f9;
	border-color: #e2e8f0;
	color: #94a3b8;
	cursor: default;
}
</style>
