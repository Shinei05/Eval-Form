<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useApi } from "../composables/useApi";
import Pagination from "./Pagination.vue";
import ConfirmModal from "./ConfirmModal.vue";
import API from "../utils/api";

const emit = defineEmits(["notify"]);

const { request, isLoading } = useApi();

const archivedTeachers = ref([]);
const teacherCount = ref(0);
const currentPage = ref(1);
const perPage = 12;

const manageSearch = ref("");
const restoreTarget = ref(null);
const showRestoreModal = ref(false);

function notify(msg, type = "info") {
	emit("notify", msg, type);
}

async function fetchArchivedTeachers() {
	const result = await request(API.teacherArchivedList, {
		method: "POST",
		body: { page: currentPage.value, perPage }
	});
	if (result.success) {
		archivedTeachers.value = result.teachers || [];
		teacherCount.value = result.total || 0;
	}
}

function restoreTeacher(id) {
	restoreTarget.value = id;
	showRestoreModal.value = true;
}

function confirmRestore() {
	if (!restoreTarget.value) return;
	const id = restoreTarget.value;
	restoreTarget.value = null;
	showRestoreModal.value = false;
	request(API.teacherRestore, { body: { id } }).then((r) => {
		if (r.success) {
			notify("Teacher restored successfully", "success");
			fetchArchivedTeachers();
		} else {
			notify(r.message || "Failed to restore teacher", "error");
		}
	});
}

const filteredTeachers = computed(() => {
	const q = manageSearch.value.toLowerCase().trim();
	if (!q) return archivedTeachers.value;
	return archivedTeachers.value.filter(
		(t) =>
			(t.firstname || "").toLowerCase().includes(q) ||
			(t.lastname || "").toLowerCase().includes(q) ||
			(t.subject || "").toLowerCase().includes(q) ||
			(t.email || "").toLowerCase().includes(q),
	);
});

const totalPages = computed(() => Math.max(1, Math.ceil(teacherCount.value / perPage)));

watch(currentPage, () => {
	fetchArchivedTeachers();
});

onMounted(() => {
	fetchArchivedTeachers();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />

	<ConfirmModal
		v-model:visible="showRestoreModal"
		title="Restore Teacher"
		message="Are you sure you want to restore this teacher? They will be able to log in and receive evaluations again."
		confirmText="Restore"
		cancelText="Cancel"
		confirmBtnClass="btn-primary"
		icon="restore"
		iconColor="var(--color-primary)"
		@confirm="confirmRestore"
	/>

	<div class="manage-section">
		<div>
			<div class="manage-toolbar">
				<div class="manage-search-wrap">
					<span class="material-icons-outlined search-icon">search</span>
					<input v-model="manageSearch" type="text" placeholder="Search archived teachers..." class="manage-search-input" />
					<span v-if="manageSearch" class="clear-search" @click="manageSearch = ''">
						<span class="material-icons-outlined">close</span>
					</span>
				</div>
			</div>

			<div class="card-grid">
				<div v-for="teacher in filteredTeachers" :key="teacher.id" class="admin-teacher-card">
					<div class="card-inner">
						<div class="card-header">
							<div class="profile-section">
								<div class="person-icon icon-pending" style="background: #fef2f2; color: #dc2626;">
									<span class="material-icons-outlined">person_off</span>
								</div>
								<div class="teacher-info">
									<h3>{{ teacher.firstname }} {{ teacher.lastname }}</h3>
									<p v-if="teacher.subject" class="subject">{{ teacher.subject }}</p>
								</div>
							</div>
						</div>
						<div class="card-meta">
							<span v-if="teacher.quarter" class="meta-tag">Q{{ teacher.quarter }} {{ teacher.year }}</span>
						</div>
						<div class="card-footer card-actions-dual">
							<button class="btn-card-action" @click="restoreTeacher(teacher.id)">
								<span class="material-icons-outlined btn-icon">settings_backup_restore</span> Restore User
							</button>
						</div>
					</div>
				</div>
				<div v-if="filteredTeachers.length === 0" class="empty-state">
					<span class="material-icons">person_search</span>
					<p>{{ manageSearch ? 'No archived teachers match your search' : 'No archived teachers available' }}</p>
				</div>
			</div>
			<Pagination
				:current-page="currentPage"
				:total-pages="totalPages"
				:total-items="teacherCount"
				:per-page="perPage"
				@page-change="currentPage = $event"
			/>
		</div>
	</div>
</template>

<style scoped>
.manage-section {
	animation: fadeIn 0.3s ease;
}

.card-actions-dual {
	display: flex;
	gap: var(--space-2);
}
.card-actions-dual .btn-card-action {
	flex: 1;
}

/* Manage Toolbar */
.manage-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-4);
	margin-bottom: var(--space-4);
}

.manage-search-wrap {
	position: relative;
	flex: 1;
	max-width: 480px;
}

.manage-search-wrap .search-icon {
	position: absolute;
	left: 0.875rem;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
	font-size: 1.25rem;
	pointer-events: none;
}

.manage-search-input {
	width: 100%;
	padding: 0.625rem 2.5rem 0.625rem 2.75rem;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-lg);
	background: #fff;
	font-size: 0.875rem;
	color: #0f172a;
	outline: none;
	transition: border-color 0.2s;
}
.manage-search-input:focus {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 3px var(--color-primary-light);
}

.clear-search {
	position: absolute;
	right: 0.625rem;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
	cursor: pointer;
	display: flex;
	padding: 2px;
	border-radius: var(--radius-full);
	transition: all var(--transition-fast);
}
.clear-search:hover {
	color: #64748b;
	background: #f1f5f9;
}

/* Card Grid */
.card-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-4);
}

.admin-teacher-card {
	background: #ffffff;
	border-radius: var(--radius-lg);
	display: flex;
	flex-direction: column;
	border-left: 4px solid #ef4444; /* red-500 */
	transition: all var(--transition-base);
}

.admin-teacher-card .card-inner {
	padding: var(--space-5);
	display: flex;
	flex-direction: column;
	flex: 1;
}

.admin-teacher-card .card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: var(--space-3);
}

.admin-teacher-card .profile-section {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	min-width: 0;
}

.admin-teacher-card .person-icon {
	width: 48px;
	height: 48px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.admin-teacher-card .person-icon .material-icons-outlined {
	font-size: 1.5rem;
}

.admin-teacher-card .teacher-info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.admin-teacher-card .teacher-info h3 {
	font-size: 1.0625rem;
	font-weight: 700;
	color: #0f172a;
	margin: 0 0 2px 0;
	line-height: 1.2;
	white-space: normal;
	word-break: break-word;
}

.admin-teacher-card .teacher-info .subject {
	font-size: 0.8125rem;
	color: #64748b;
	margin: 0;
	white-space: normal;
	word-break: break-word;
}

.admin-teacher-card .card-meta {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin-top: var(--space-4);
	flex: 1;
	align-content: flex-start;
}

.admin-teacher-card .meta-tag {
	font-size: 0.7rem;
	font-weight: 500;
	color: #64748b;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 2px 8px;
	border-radius: 6px;
	white-space: nowrap;
}

.admin-teacher-card .card-footer {
	margin-top: var(--space-4);
	display: flex;
}

.admin-teacher-card .btn-card-action {
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
.admin-teacher-card .btn-card-action:hover:not(:disabled) {
	background: #f8fafc;
	border-color: #64748b;
}

/* Empty state */
.empty-state {
	grid-column: 1 / -1;
	text-align: center;
	padding: var(--space-12);
	color: var(--color-text-muted);
}

.empty-state .material-icons {
	font-size: 3rem;
	margin-bottom: var(--space-3);
}
</style>
