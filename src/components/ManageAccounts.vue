<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useApi } from "../composables/useApi";
import Pagination from "./Pagination.vue";
import ConfirmModal from "./ConfirmModal.vue";
import API from "../utils/api";

const props = defineProps({
	currentTeacherId: {
		type: Number,
		default: null,
	},
});

const emit = defineEmits(["notify"]);

const { request, isLoading } = useApi();

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
		const activeBackdrops = document.querySelectorAll(".modal-backdrop");
		if (activeBackdrops.length <= 1) {
			document.body.style.overflow = "";
		}
	}
});

onUnmounted(() => {
	const activeBackdrops = document.querySelectorAll(".modal-backdrop");
	if (activeBackdrops.length === 0) {
		document.body.style.overflow = "";
	}
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
		confirmBtnClass="btn-danger"
		icon="archive"
		iconColor="var(--color-danger)"
		@confirm="confirmDelete"
	/>

	<div class="manage-section">
		<!-- Unified List View -->
		<div>
			<div class="manage-toolbar">
				<div class="manage-search-wrap">
					<span class="material-icons-outlined search-icon">search</span>
					<input v-model="manageSearch" type="text" placeholder="Search teachers by name, subject, or email..." class="manage-search-input" />
					<span v-if="manageSearch" class="clear-search" @click="manageSearch = ''">
						<span class="material-icons-outlined">close</span>
					</span>
				</div>
				<button class="btn btn-primary btn-add-user" @click="showCreateForm = true">
					<span class="material-icons">person_add</span> Add User
				</button>
			</div>

			<div class="card-grid">
				<div v-for="teacher in filteredTeachers" :key="teacher.id" class="admin-teacher-card">
					<div class="card-inner">
						<div class="card-header">
							<div class="profile-section">
								<div class="person-icon icon-pending">
									<span class="material-icons-outlined">person</span>
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
							<button class="btn-card-action" @click="startEdit(teacher)">
								<span class="material-icons-outlined btn-icon">edit</span> Edit User
							</button>
							<button
								class="btn-card-action btn-card-danger"
								@click="deleteTeacher(teacher.id)"
								:disabled="teacher.id === currentTeacherId"
								:title="teacher.id === currentTeacherId ? 'You cannot archive your own account' : 'Archive User'"
								:class="{ 'action-disabled': teacher.id === currentTeacherId }"
							>
								<span class="material-icons-outlined btn-icon">archive</span> Archive User
							</button>
						</div>
					</div>
				</div>
				<div v-if="filteredTeachers.length === 0" class="empty-state">
					<span class="material-icons">person_search</span>
					<p>{{ manageSearch ? 'No teachers match your search' : 'No teachers available' }}</p>
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

		<!-- Create Form Modal -->
		<Transition name="fade">
		<div v-if="showCreateForm" class="modal-backdrop" @click.self="showCreateForm = false">
		<div class="form-card card modal-panel">
			<div class="form-header">
				<h3 class="form-title">
					<span class="material-icons">person_add</span>
					Add Teacher
				</h3>
				<button class="btn btn-ghost btn-sm" @click="showCreateForm = false">Cancel</button>
			</div>
			<form @submit.prevent="createTeacher" class="form-layout">
				<div class="form-section">
					<div class="form-section-header">
						<span class="material-icons">badge</span>
						<h4>Personal Info</h4>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>First Name</label>
							<input v-model="teacherForm.fn" type="text" placeholder="First name" required />
						</div>
						<div class="form-group">
							<label>Last Name</label>
							<input v-model="teacherForm.ln" type="text" placeholder="Last name" required />
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Email</label>
							<input v-model="teacherForm.email" type="email" placeholder="Email" required />
						</div>
						<div class="form-group">
							<label>ID</label>
							<input v-model="teacherForm.id" type="number" placeholder="Teacher ID" required />
						</div>
					</div>
				</div>

				<div class="form-section">
					<div class="form-section-header">
						<span class="material-icons">school</span>
						<h4>Assignment</h4>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Subject</label>
							<select v-model="teacherForm.sub" required>
								<option value="" disabled>Select subject</option>
								<option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.subjects }}</option>
							</select>
						</div>
						<div class="form-group">
							<label>Quarter</label>
							<select v-model="teacherForm.qrt" required>
								<option value="" disabled>Select</option>
								<option value="1">Q1</option>
								<option value="2">Q2</option>
								<option value="3">Q3</option>
								<option value="4">Q4</option>
							</select>
						</div>
						<div class="form-group">
							<label>Year</label>
							<input v-model="teacherForm.yr" type="number" placeholder="Year" required />
						</div>
					</div>
				</div>

				<div class="form-section">
					<div class="form-section-header">
						<span class="material-icons">lock</span>
						<h4>Security</h4>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Password</label>
							<div class="password-wrap">
								<input
									v-model="teacherForm.ps"
									:type="showPassword ? 'text' : 'password'"
									placeholder="Password"
									minlength="8"
									required
								/>
								<button type="button" class="toggle-pw" @click="showPassword = !showPassword" tabindex="-1">
									<span class="material-icons-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
								</button>
							</div>
						</div>
						<div class="form-group">
							<label>Confirm Password</label>
							<input v-model="teacherForm.cpas" type="password" placeholder="Confirm password" required />
						</div>
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn btn-primary">
						<span class="material-icons" style="font-size: 1.125rem">person_add</span>
						Create Teacher
					</button>
					<button type="button" class="btn btn-ghost" @click="showCreateForm = false">Cancel</button>
				</div>
			</form>
		</div>
		</div>
		</Transition>

		<!-- Edit Form Modal -->
		<Transition name="fade">
		<div v-if="isEditing" class="modal-backdrop" @click.self="cancelEdit">
		<div class="form-card card modal-panel">
			<div class="form-header">
				<h3 class="form-title">
					<span class="material-icons">edit</span>
					Edit Teacher
				</h3>
				<button class="btn btn-ghost btn-sm" @click="cancelEdit">Cancel</button>
			</div>
			<form @submit.prevent="saveEdit" class="form-layout">
				<div class="form-section">
					<div class="form-section-header">
						<span class="material-icons">badge</span>
						<h4>Personal Info</h4>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>First Name</label>
							<input v-model="editForm.fn" type="text" required />
						</div>
						<div class="form-group">
							<label>Last Name</label>
							<input v-model="editForm.ln" type="text" required />
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Email</label>
							<input v-model="editForm.email" type="email" required />
						</div>
						<div class="form-group">
							<label>ID</label>
							<input v-model="editForm.id" type="number" required />
						</div>
					</div>
				</div>

				<div class="form-section">
					<div class="form-section-header">
						<span class="material-icons">school</span>
						<h4>Assignment</h4>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>Subject</label>
							<select v-model="editForm.sub" required>
								<option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.subjects }}</option>
							</select>
						</div>
						<div class="form-group">
							<label>Quarter</label>
							<select v-model="editForm.qrt" required>
								<option value="1">Q1</option>
								<option value="2">Q2</option>
								<option value="3">Q3</option>
								<option value="4">Q4</option>
							</select>
						</div>
						<div class="form-group">
							<label>Year</label>
							<input v-model="editForm.yr" type="number" required />
						</div>
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn btn-primary">
						<span class="material-icons" style="font-size: 1.125rem">save</span>
						Save Changes
					</button>
					<button type="button" class="btn btn-ghost" @click="cancelEdit">Cancel</button>
				</div>
			</form>
		</div>
		</div>
		</Transition>
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

.form-card {
	padding: var(--space-6);
	max-width: 800px;
}

.form-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
	font-size: 1.0625rem;
}
.form-title .material-icons {
	color: var(--color-primary);
}

.form-layout {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
}

.form-section {
	background: #f8fafc;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-5);
}

.form-section-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
}
.form-section-header .material-icons {
	font-size: 1.25rem;
	color: var(--color-primary);
}
.form-section-header h4 {
	font-size: 0.9375rem;
	font-weight: 600;
	margin: 0;
}

.form-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--space-4);
}

.form-group label {
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text-secondary);
	margin-bottom: var(--space-2);
}

.form-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-5);
}
.form-header h3 {
	margin: 0;
}

.form-actions {
	display: flex;
	align-items: center;
	gap: var(--space-3);
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

.btn-add-user {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	white-space: nowrap;
}

/* Modals */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: var(--space-4);
}

.modal-panel {
	max-height: 90vh;
	overflow-y: auto;
	width: 100%;
	max-width: 800px;
	margin: 0;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
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
.clear-search .material-icons-outlined {
	font-size: 1.125rem;
}

/* Password toggle */
.password-wrap {
	position: relative;
}
.password-wrap input {
	padding-right: 2.75rem;
}
.toggle-pw {
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #94a3b8;
	padding: 4px;
	display: flex;
	border-radius: var(--radius-sm);
	transition: all var(--transition-fast);
}
.toggle-pw:hover {
	color: #64748b;
	background: #f1f5f9;
}
.toggle-pw .material-icons-outlined {
	font-size: 1.25rem;
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
	border-left: 4px solid #f59e0b;
	transition: all var(--transition-base);
}
.admin-teacher-card.card-evaluated { border-left-color: #16a34a; }

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
.admin-teacher-card .icon-evaluated {
	background: linear-gradient(135deg, #dcfce7, #bbf7d0);
	color: #16a34a;
}
.admin-teacher-card .icon-pending {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	color: #d97706;
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

.admin-teacher-card .btn-card-danger {
	background: #fef2f2;
	border-color: #fca5a5;
	color: #dc2626;
}
.admin-teacher-card .btn-card-danger:hover:not(:disabled) {
	background: #fee2e2;
	border-color: #ef4444;
}

.admin-teacher-card .action-disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.admin-teacher-card .action-disabled:hover {
	background: #fef2f2 !important;
	border-color: #fca5a5 !important;
}

.admin-teacher-card .btn-icon {
	font-size: 1.125rem;
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
	color: var(--color-bg-muted);
}

@media (max-width: 768px) {
	.card-grid {
		grid-template-columns: 1fr;
	}
	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
