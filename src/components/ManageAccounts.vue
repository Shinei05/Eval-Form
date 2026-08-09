<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useApi } from "../composables/useApi";
import Pagination from "./Pagination.vue";
import ConfirmModal from "./ConfirmModal.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import API from "../utils/api";
import {
	UserPlus, Pencil, Archive, Search, X, User, BookOpen,
	Lock, Eye, EyeOff, Users, Save, Mail, LayoutGrid, List
} from "@lucide/vue";

const props = defineProps({
	currentTeacherId: {
		type: Number,
		default: null,
	},
});

const emit = defineEmits(["notify"]);

const { request, isLoading } = useApi();

const viewMode = ref(localStorage.getItem("manage_accounts_view_mode") || "card"); // 'card' | 'list'

watch(viewMode, (newVal) => {
	try {
		localStorage.setItem("manage_accounts_view_mode", newVal);
	} catch (e) {
		console.error("Failed to save view mode", e);
	}
});
const teachers = ref([]);
const subjects = ref([]);
const teacherCount = ref(0);
const currentPage = ref(1);
const perPage = 12;

const isEditing = ref(false);
const teacherForm = ref({
	fn: "", ln: "", email: "", id: "", sub: "", qrt: "", yr: "", ps: "", cpas: "",
});
const editForm = ref(null);

const showCreateForm = ref(false);
const manageSearch = ref("");
const showPassword = ref(false);
const deleteTarget = ref(null);
const showDeleteModal = ref(false);

function notify(msg, type = "info") {
	emit("notify", msg, type);
}

async function fetchTeachers() {
	const result = await request(API.teachersListFaculty, {
		body: { action: "getTeachers", page: currentPage.value, perPage },
	});
	if (result.success) {
		teachers.value = result.teachers || [];
		teacherCount.value = result.total || 0;
	}
}

async function fetchSubjects() {
	const result = await request(API.subjects, { body: { action: "getSubjects" } });
	if (result.success) {
		subjects.value = result.subjects || [];
	}
}

async function createTeacher() {
	if (teacherForm.value.ps !== teacherForm.value.cpas) {
		notify("Passwords do not match", "error");
		return;
	}
	const result = await request(API.teacherCreate, {
		body: { action: "createTeachers", ...teacherForm.value },
	});
	if (result.success) {
		notify("Teacher created successfully", "success");
		teacherForm.value = { fn: "", ln: "", email: "", id: "", sub: "", qrt: "", yr: "", ps: "", cpas: "" };
		showCreateForm.value = false;
		fetchTeachers();
	} else {
		notify(result.message || "Failed to create teacher", "error");
	}
}

function startEdit(teacher) {
	editForm.value = {
		fn: teacher.firstname, ln: teacher.lastname, email: teacher.email,
		id: teacher.id, sub: teacher.subject, qrt: teacher.quarter, yr: teacher.year,
	};
	isEditing.value = true;
}

function cancelEdit() {
	editForm.value = null;
	isEditing.value = false;
}

async function saveEdit() {
	const result = await request(API.teacherEdit, {
		body: { action: "editTeacher", ...editForm.value },
	});
	if (result.success) {
		notify("Teacher updated", "success");
		isEditing.value = false;
		editForm.value = null;
		fetchTeachers();
	} else {
		notify(result.message || "Failed to update teacher", "error");
	}
}

function deleteTeacher(id) {
	deleteTarget.value = id;
	showDeleteModal.value = true;
}

function confirmDelete() {
	if (!deleteTarget.value) return;
	const id = deleteTarget.value;
	deleteTarget.value = null;
	showDeleteModal.value = false;
	request(API.teacherDelete, { body: { action: "rmTeachers", id } }).then((r) => {
		if (r.success) {
			notify("Teacher archived successfully", "success");
			fetchTeachers();
		} else {
			notify(r.message || "Failed to archive teacher", "error");
		}
	});
}

const sortedTeachers = computed(() => {
	const list = [...teachers.value];
	list.sort((a, b) => {
		const aEval = a.evaluated === "evaluated" ? 1 : 0;
		const bEval = b.evaluated === "evaluated" ? 1 : 0;
		if (aEval !== bEval) return aEval - bEval;
		return 0;
	});
	return list;
});

const filteredTeachers = computed(() => {
	const q = manageSearch.value.toLowerCase().trim();
	if (!q) return sortedTeachers.value;
	return sortedTeachers.value.filter(
		(t) =>
			(t.firstname || "").toLowerCase().includes(q) ||
			(t.lastname || "").toLowerCase().includes(q) ||
			(t.subject || "").toLowerCase().includes(q) ||
			(t.email || "").toLowerCase().includes(q),
	);
});

const totalPages = computed(() => Math.max(1, Math.ceil(teacherCount.value / perPage)));

watch(currentPage, () => {
	fetchTeachers();
});

watch([showCreateForm, isEditing], ([newCreate, newEdit]) => {
	if (newCreate || newEdit) {
		document.body.style.overflow = "hidden";
	} else {
		const activeBackdrops = document.querySelectorAll(".ma-modal-backdrop");
		if (activeBackdrops.length <= 1) {
			document.body.style.overflow = "";
		}
	}
});

onUnmounted(() => {
	document.body.style.overflow = "";
});

onMounted(() => {
	fetchSubjects();
	fetchTeachers();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />

	<ConfirmModal
		v-model:visible="showDeleteModal"
		title="Archive Teacher"
		message="Are you sure you want to archive this teacher? Their account will be deactivated and moved to the Archived Teachers list, but their data will be preserved."
		confirmText="Archive"
		cancelText="Cancel"
		:danger="true"
		icon="archive"
		@confirm="confirmDelete"
	/>

	<div class="space-y-6 animate-fade-up">
		<!-- Toolbar -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-1 items-center gap-3 max-w-xl">
				<div class="relative flex-1">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<Search class="h-5 w-5 text-slate-400" />
					</div>
					<input
						v-model="manageSearch"
						type="text"
						placeholder="Search by name, subject, or email..."
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

				<!-- Layout Toggle -->
				<div class="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 flex-none">
					<button
						type="button"
						@click="viewMode = 'card'"
						:class="[
							'flex items-center justify-center rounded-lg p-2 transition-all',
							viewMode === 'card'
								? 'bg-white text-indigo-600 shadow-xs font-bold'
								: 'text-slate-500 hover:text-slate-800'
						]"
						title="Card View"
					>
						<LayoutGrid class="h-4 w-4" />
					</button>
					<button
						type="button"
						@click="viewMode = 'list'"
						:class="[
							'flex items-center justify-center rounded-lg p-2 transition-all',
							viewMode === 'list'
								? 'bg-white text-indigo-600 shadow-xs font-bold'
								: 'text-slate-500 hover:text-slate-800'
						]"
						title="List View"
					>
						<List class="h-4 w-4" />
					</button>
				</div>
			</div>

			<button
				@click="showCreateForm = true"
				class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 whitespace-nowrap"
			>
				<UserPlus class="h-4 w-4" />
				Add Teacher
			</button>
		</div>

		<!-- Card Grid -->
		<div v-if="viewMode === 'card' && filteredTeachers.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div
				v-for="teacher in filteredTeachers"
				:key="teacher.id"
				class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
			>
				<!-- Card Header -->
				<div class="flex items-start justify-between gap-3">
					<div class="flex items-center gap-3 min-w-0">
						<div class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
							<User class="h-6 w-6" />
						</div>
						<div class="min-w-0">
							<h3
								class="truncate text-base font-bold text-slate-900"
								:title="teacher.firstname + ' ' + teacher.lastname"
							>
								{{ teacher.firstname }} {{ teacher.lastname }}
							</h3>
							<p class="truncate text-sm font-medium text-slate-500" :title="teacher.subject">
								{{ teacher.subject || "No subject assigned" }}
							</p>
						</div>
					</div>
				</div>

				<!-- Card Meta -->
				<div class="mt-4 flex flex-wrap gap-2">
					<div class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
						<span class="font-bold text-slate-400">ID:</span>
						{{ teacher.teacher_id || teacher.id }}
					</div>
					<div v-if="teacher.quarter && teacher.year" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
						<span class="font-bold text-slate-400">Term:</span>
						Q{{ teacher.quarter }} {{ teacher.year }}
					</div>
					<div v-if="teacher.email" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 min-w-0 max-w-full">
						<Mail class="h-3 w-3 text-slate-400 flex-none" />
						<span class="truncate">{{ teacher.email }}</span>
					</div>
				</div>

				<!-- Card Actions -->
				<div class="mt-5 flex gap-2">
					<button
						@click="startEdit(teacher)"
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300"
					>
						<Pencil class="h-4 w-4" />
						Edit
					</button>
					<button
						@click="deleteTeacher(teacher.id)"
						:disabled="teacher.id === currentTeacherId"
						:title="teacher.id === currentTeacherId ? 'You cannot archive your own account' : 'Archive User'"
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
					>
						<Archive class="h-4 w-4" />
						Archive
					</button>
				</div>
			</div>
		</div>

		<!-- List Table View -->
		<div v-else-if="viewMode === 'list' && filteredTeachers.length > 0" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-slate-600">
					<thead class="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
						<tr>
							<th scope="col" class="px-6 py-3.5">Teacher</th>
							<th scope="col" class="px-6 py-3.5">ID / Term</th>
							<th scope="col" class="px-6 py-3.5">Email</th>
							<th scope="col" class="px-6 py-3.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						<tr
							v-for="teacher in filteredTeachers"
							:key="teacher.id"
							class="transition-colors hover:bg-slate-50/80"
						>
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
										<User class="h-5 w-5" />
									</div>
									<div>
										<div class="font-bold text-slate-900">
											{{ teacher.firstname }} {{ teacher.lastname }}
										</div>
										<div class="text-xs text-slate-500">
											{{ teacher.subject || "No subject assigned" }}
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="text-xs font-semibold text-slate-700">
									ID: {{ teacher.teacher_id || teacher.id }}
								</div>
								<div v-if="teacher.quarter && teacher.year" class="text-xs text-slate-500">
									Q{{ teacher.quarter }} {{ teacher.year }}
								</div>
							</td>
							<td class="px-6 py-4">
								<div v-if="teacher.email" class="flex items-center gap-1.5 text-xs text-slate-600">
									<Mail class="h-3.5 w-3.5 text-slate-400" />
									{{ teacher.email }}
								</div>
								<span v-else class="text-xs text-slate-400">—</span>
							</td>
							<td class="px-6 py-4 text-right">
								<div class="flex items-center justify-end gap-2">
									<button
										@click="startEdit(teacher)"
										class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100"
									>
										<Pencil class="h-3.5 w-3.5" />
										Edit
									</button>
									<button
										@click="deleteTeacher(teacher.id)"
										:disabled="teacher.id === currentTeacherId"
										:title="teacher.id === currentTeacherId ? 'You cannot archive your own account' : 'Archive User'"
										class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<Archive class="h-3.5 w-3.5" />
										Archive
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
				<Users class="h-8 w-8" />
			</div>
			<h3 class="text-lg font-bold text-slate-900 mb-1">
				{{ manageSearch ? "No results found" : "No teachers available" }}
			</h3>
			<p class="text-sm text-slate-500 max-w-sm">
				{{ manageSearch ? "Try adjusting your search terms." : "Add a new teacher to get started." }}
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

	<!-- Create Form Modal -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="showCreateForm"
				class="ma-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
			>
				<div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showCreateForm = false"></div>
				<div class="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
					<!-- Modal Header -->
					<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
								<UserPlus class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-base font-bold text-slate-900">Add Teacher</h3>
								<p class="text-xs text-slate-500">Create a new faculty account</p>
							</div>
						</div>
						<button
							@click="showCreateForm = false"
							class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<!-- Modal Body -->
					<form @submit.prevent="createTeacher" class="p-6">
						<div class="space-y-6">
							<!-- Personal Info -->
							<div>
								<div class="mb-4 flex items-center gap-2">
									<User class="h-4 w-4 text-indigo-500" />
									<h4 class="text-sm font-bold uppercase tracking-wide text-slate-700">Personal Info</h4>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">First Name</label>
										<input
											v-model="teacherForm.fn"
											type="text"
											placeholder="First name"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Last Name</label>
										<input
											v-model="teacherForm.ln"
											type="text"
											placeholder="Last name"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
										<input
											v-model="teacherForm.email"
											type="email"
											placeholder="Email address"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Teacher ID</label>
										<input
											v-model="teacherForm.id"
											type="number"
											placeholder="Teacher ID"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
								</div>
							</div>

							<!-- Assignment -->
							<div>
								<div class="mb-4 flex items-center gap-2">
									<BookOpen class="h-4 w-4 text-indigo-500" />
									<h4 class="text-sm font-bold uppercase tracking-wide text-slate-700">Assignment</h4>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Subject</label>
										<select
											v-model="teacherForm.sub"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										>
											<option value="" disabled>Select subject</option>
											<option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.subjects }}</option>
										</select>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Quarter</label>
										<select
											v-model="teacherForm.qrt"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										>
											<option value="" disabled>Select</option>
											<option value="1">Q1</option>
											<option value="2">Q2</option>
											<option value="3">Q3</option>
											<option value="4">Q4</option>
										</select>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Year</label>
										<input
											v-model="teacherForm.yr"
											type="number"
											placeholder="Year"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
								</div>
							</div>

							<!-- Security -->
							<div>
								<div class="mb-4 flex items-center gap-2">
									<Lock class="h-4 w-4 text-indigo-500" />
									<h4 class="text-sm font-bold uppercase tracking-wide text-slate-700">Security</h4>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
										<div class="relative">
											<input
												v-model="teacherForm.ps"
												:type="showPassword ? 'text' : 'password'"
												placeholder="Password"
												minlength="8"
												required
												class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
											/>
											<button
												type="button"
												@click="showPassword = !showPassword"
												class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
												tabindex="-1"
											>
												<EyeOff v-if="showPassword" class="h-4 w-4" />
												<Eye v-else class="h-4 w-4" />
											</button>
										</div>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</label>
										<input
											v-model="teacherForm.cpas"
											type="password"
											placeholder="Confirm password"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
							<button
								type="button"
								@click="showCreateForm = false"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
							>
								<UserPlus class="h-4 w-4" />
								Create Teacher
							</button>
						</div>
					</form>
				</div>
			</div>
		</Transition>
	</Teleport>

	<!-- Edit Form Modal -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="isEditing"
				class="ma-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
			>
				<div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cancelEdit"></div>
				<div class="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
					<!-- Modal Header -->
					<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
								<Pencil class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-base font-bold text-slate-900">Edit Teacher</h3>
								<p class="text-xs text-slate-500">Update faculty account details</p>
							</div>
						</div>
						<button
							@click="cancelEdit"
							class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<!-- Modal Body -->
					<form @submit.prevent="saveEdit" class="p-6">
						<div class="space-y-6">
							<!-- Personal Info -->
							<div>
								<div class="mb-4 flex items-center gap-2">
									<User class="h-4 w-4 text-indigo-500" />
									<h4 class="text-sm font-bold uppercase tracking-wide text-slate-700">Personal Info</h4>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">First Name</label>
										<input
											v-model="editForm.fn"
											type="text"
											required
											disabled
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Last Name</label>
										<input
											v-model="editForm.ln"
											type="text"
											required
											disabled
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
										<input
											v-model="editForm.email"
											type="email"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Teacher ID</label>
										<input
											v-model="editForm.id"
											type="number"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
								</div>
							</div>

							<!-- Assignment -->
							<div>
								<div class="mb-4 flex items-center gap-2">
									<BookOpen class="h-4 w-4 text-indigo-500" />
									<h4 class="text-sm font-bold uppercase tracking-wide text-slate-700">Assignment</h4>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Subject</label>
										<select
											v-model="editForm.sub"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										>
											<option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.subjects }}</option>
										</select>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Quarter</label>
										<select
											v-model="editForm.qrt"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										>
											<option value="1">Q1</option>
											<option value="2">Q2</option>
											<option value="3">Q3</option>
											<option value="4">Q4</option>
										</select>
									</div>
									<div>
										<label class="mb-1.5 block text-sm font-semibold text-slate-700">Year</label>
										<input
											v-model="editForm.yr"
											type="number"
											required
											class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
										/>
									</div>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
							<button
								type="button"
								@click="cancelEdit"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
							>
								<Save class="h-4 w-4" />
								Save Changes
							</button>
						</div>
					</form>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
