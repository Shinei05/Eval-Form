<script setup>
import { computed } from "vue";

const props = defineProps({
	currentPage: { type: Number, required: true },
	totalPages: { type: Number, required: true },
	totalItems: { type: Number, required: true },
	perPage: { type: Number, required: true },
});

const emit = defineEmits(["page-change"]);

const showingStart = computed(() =>
	props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.perPage + 1
);

const showingEnd = computed(() =>
	Math.min(props.currentPage * props.perPage, props.totalItems)
);

const pages = computed(() => {
	const total = props.totalPages;
	const current = props.currentPage;
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const result = [];
	const delta = 2;
	const rangeStart = Math.max(2, current - delta);
	const rangeEnd = Math.min(total - 1, current + delta);

	result.push(1);
	if (rangeStart > 2) result.push("...");
	for (let i = rangeStart; i <= rangeEnd; i++) result.push(i);
	if (rangeEnd < total - 1) result.push("...");
	if (total > 1) result.push(total);

	return result;
});

function go(page) {
	if (page < 1 || page > props.totalPages || page === props.currentPage) return;
	emit("page-change", page);
}
</script>

<template>
	<div v-if="totalPages > 1" class="pagination">
		<div class="pagination-info">
			Showing {{ showingStart }}–{{ showingEnd }} of {{ totalItems }}
		</div>
		<div class="pagination-controls">
			<button
				class="page-btn"
				:disabled="currentPage === 1"
				aria-label="Previous page"
				@click="go(currentPage - 1)"
			>
				<span class="material-icons-outlined">chevron_left</span>
			</button>
			<button
				v-for="page in pages"
				:key="page"
				class="page-btn page-num"
				:class="{ active: page === currentPage }"
				:aria-label="page === '...' ? 'More pages' : `Page ${page}`"
				:aria-current="page === currentPage ? 'page' : undefined"
				:disabled="page === '...'"
				@click="go(page)"
			>{{ page }}</button>
			<button
				class="page-btn"
				:disabled="currentPage === totalPages"
				aria-label="Next page"
				@click="go(currentPage + 1)"
			>
				<span class="material-icons-outlined">chevron_right</span>
			</button>
		</div>
	</div>
</template>

<style scoped>
.pagination {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-4);
	padding-top: var(--space-4);
	margin-bottom: var(--space-6);
}

.pagination-info {
	font-size: 0.8125rem;
	color: #64748b;
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 2px;
}

.page-btn {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid #e2e8f0;
	border-radius: var(--radius-md);
	background: #fff;
	color: #475569;
	font-size: 0.8125rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
	background: #f8fafc;
	border-color: #94a3b8;
}

.page-btn:disabled {
	opacity: 0.4;
	cursor: default;
}

.page-btn .material-icons-outlined {
	font-size: 1.125rem;
}

.page-num.active {
	background: var(--color-primary, #6366f1);
	border-color: var(--color-primary, #6366f1);
	color: #fff;
}
</style>
