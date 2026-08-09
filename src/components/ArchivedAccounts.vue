<script setup>

import { ref, computed, watch, onMounted } from "vue";
import { useApi } from "../composables/useApi";
import Pagination from "./Pagination.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import ConfirmModal from "./ConfirmModal.vue";
import { Search, X, UserX, RefreshCcw, Users } from "@lucide/vue";
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
		@confirm="confirmRestore"
	/>

	<div class="space-y-6 animate-fade-up">
		<!-- Toolbar -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="relative flex-1 max-w-lg">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<Search class="h-5 w-5 text-slate-400" />
				</div>
				<input
					v-model="manageSearch"
					type="text"
					placeholder="Search archived teachers..."
					class="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
				/>
				<button
					v-if="manageSearch"
					@click="manageSearch = ''"
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Card Grid -->
		<div v-if="filteredTeachers.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div
				v-for="teacher in filteredTeachers"
				:key="teacher.id"
				class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="flex items-center gap-3 min-w-0">
						<div class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
							<UserX class="h-6 w-6" />
						</div>
						<div class="min-w-0">
							<h3 class="truncate text-base font-bold text-slate-900" :title="teacher.firstname + ' ' + teacher.lastname">
								{{ teacher.firstname }} {{ teacher.lastname }}
							</h3>
							<p class="truncate text-sm font-medium text-slate-500" :title="teacher.subject">{{ teacher.subject }}</p>
						</div>
					</div>
				</div>

				<div class="mt-4 flex flex-wrap gap-2">
					<span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
						Q{{ teacher.quarter }} {{ teacher.year }}
					</span>
					<span class="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
						Archived
					</span>
				</div>

				<div class="mt-5 flex gap-2">
					<button
						@click="restoreTeacher(teacher.id)"
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-300"
					>
						<RefreshCcw class="h-4 w-4" />
						Restore User
					</button>
				</div>
			</div>
		</div>
		
		<!-- Empty State -->
		<div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
				<Users class="h-8 w-8" />
			</div>
			<h3 class="text-lg font-bold text-slate-900 mb-1">No archived teachers</h3>
			<p class="text-sm text-slate-500 max-w-sm">
				{{ manageSearch ? "Try adjusting your search terms." : "There are currently no archived faculty accounts." }}
			</p>
		</div>

		<Pagination
			v-if="filteredTeachers.length > 0 && !manageSearch"
			:current-page="currentPage"
			:total-pages="totalPages"
			:total-items="teacherCount"
			:per-page="perPage"
			@page-change="currentPage = $event"
		/>
	</div>
</template>
