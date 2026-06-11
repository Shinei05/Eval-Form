<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";
import { getToken } from "../../utils/auth";

const props = defineProps({
	type: { type: String, default: "student" },
});

const { request, isLoading } = useApi();
const { requireAuth } = useAuth();

const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const headers = ref([]);
const headerVersion = ref(null);
const newHeader = ref("");
const newQuestion = ref("");
const showAddHeader = ref(false);

// Versioning state
const versions = ref([]);
const activeVersion = ref(null);
const selectedVersion = ref("");

// Import modal state
const showUploadModal = ref(false);
const uploadVersionName = ref("");
const uploadFile = ref(null);
const dragActive = ref(false);
const isUploading = ref(false);

const endpoints = {
	student: {
		questions: API.questionsStudentAll,
		headerUpdate: API.headerUpdate,
		headerAdd: API.headerAdd,
		headerDelete: API.headerDelete,
		questionUpdate: API.questionUpdate,
		questionDelete: API.questionDelete,
		questionAdd: API.questionAdd,
	},
	teacher: {
		questions: API.questionsTeacherAll,
		headerUpdate: API.headerUpdateTeacher,
		headerAdd: API.headerAddTeacher,
		headerDelete: API.headerDeleteTeacher,
		questionUpdate: API.questionUpdateTeacher,
		questionDelete: API.questionDeleteTeacher,
		questionAdd: API.questionAddTeacher,
	},
};

const api = computed(() => endpoints[props.type] || endpoints.student);

async function fetchVersions() {
	const result = await request(API.questionsVersions, {
		body: { type: props.type },
	});
	if (result.success) {
		versions.value = result.versions || [];
		activeVersion.value = result.activeVersion;
		if (!selectedVersion.value || !versions.value.includes(selectedVersion.value)) {
			selectedVersion.value = activeVersion.value || (versions.value.length > 0 ? versions.value[0] : "");
		}
	}
}

async function fetchQuestions() {
	const result = await request(api.value.questions, {
		body: { 
			action: "getQuestions",
			version: selectedVersion.value || undefined
		},
	});
	if (result.success) {
		headers.value = (result.headers || []).map((h) => ({
			...h,
			editing: false,
			addQ: false,
		}));
		headerVersion.value = result.header_ver;
		if (!selectedVersion.value && result.header_ver) {
			selectedVersion.value = result.header_ver;
		}
	}
}

async function setActiveVersion() {
	if (!selectedVersion.value) return;
	const result = await request(API.questionsSetActive, {
		body: {
			type: props.type,
			version: selectedVersion.value
		}
	});
	if (result.success) {
		activeVersion.value = selectedVersion.value;
		notify(`Successfully set ${selectedVersion.value} as the active version`, "success");
	} else {
		notify(result.error || "Failed to set active version", "error");
	}
}

function onVersionChange() {
	fetchQuestions();
}

function onFileChange(e) {
	uploadFile.value = e.target.files[0];
}

function onDrop(e) {
	dragActive.value = false;
	if (e.dataTransfer.files.length) {
		uploadFile.value = e.dataTransfer.files[0];
	}
}

async function handleUpload() {
	if (!uploadVersionName.value.trim()) {
		notify("Please enter a version name (e.g. v2026)", "error");
		return;
	}
	if (!uploadFile.value) {
		notify("Please select a .docx file to upload", "error");
		return;
	}

	isUploading.value = true;
	try {
		const form = new FormData();
		form.append("type", props.type);
		form.append("version", uploadVersionName.value.trim());
		form.append("file", uploadFile.value);

		const response = await fetch(API.questionsUpload, {
			method: "POST",
			headers: { Authorization: `Bearer ${getToken()}` },
			body: form,
		});

		const result = await response.json();
		if (result.success) {
			notify("Questionnaire imported successfully!", "success");
			showUploadModal.value = false;
			selectedVersion.value = uploadVersionName.value.trim();
			uploadVersionName.value = "";
			uploadFile.value = null;
			await fetchVersions();
			await fetchQuestions();
		} else {
			notify(result.error || result.message || "Upload failed", "error");
		}
	} catch (err) {
		notify("Upload failed: " + err.message, "error");
	} finally {
		isUploading.value = false;
	}
}

async function updateHeader(header) {
	header.editing = false;
	const result = await request(api.value.headerUpdate, {
		body: {
			action: "changeHeaders",
			id: header.header_id,
			newHeader: header.header,
		},
	});
	if (result.success) {
		notify("Header updated", "success");
	} else {
		notify("Failed to update header", "error");
		fetchQuestions();
	}
}

async function addHeader() {
	if (!newHeader.value.trim()) return;
	const result = await request(api.value.headerAdd, {
		body: {
			action: "addHeader",
			header: newHeader.value,
			identifier: headerVersion.value,
		},
	});
	if (result.success) {
		notify("Header added", "success");
		newHeader.value = "";
		showAddHeader.value = false;
		fetchQuestions();
	} else {
		notify("Failed to add header", "error");
	}
}

async function deleteHeader(headerId) {
	if (!confirm("Delete this entire section and all its questions?")) return;
	const result = await request(api.value.headerDelete, {
		body: { action: "deleteHeader", header_id: headerId },
	});
	if (result.success) {
		notify("Header deleted", "success");
		fetchQuestions();
	} else {
		notify("Failed to delete header", "error");
	}
}

async function updateQuestion(question) {
	question.editing = false;
	const result = await request(api.value.questionUpdate, {
		body: {
			action: "chQuestions",
			id: question.question_id,
			question: question.question,
		},
	});
	if (result.success) {
		notify("Question updated", "success");
	} else {
		notify("Failed to update question", "error");
		fetchQuestions();
	}
}

async function deleteQuestion(qId) {
	if (!confirm("Delete this question?")) return;
	const result = await request(api.value.questionDelete, {
		body: { action: "delQuestion", id: qId },
	});
	if (result.success) {
		notify("Question deleted", "success");
		fetchQuestions();
	} else {
		notify("Failed to delete question", "error");
	}
}

async function addQuestion(headerId) {
	if (!newQuestion.value.trim()) return;
	const result = await request(api.value.questionAdd, {
		body: {
			action: "addQuestion",
			question: newQuestion.value,
			id: headerId,
			identifier: headerVersion.value,
		},
	});
	if (result.success) {
		notify("Question added", "success");
		newQuestion.value = "";
		const h = headers.value.find((h) => h.header_id === headerId);
		if (h) h.addQ = false;
		fetchQuestions();
	} else {
		notify("Failed to add question", "error");
	}
}

watch(
	() => props.type,
	async () => {
		headers.value = [];
		headerVersion.value = null;
		selectedVersion.value = "";
		await fetchVersions();
		await fetchQuestions();
	},
);

// Watch modal state to lock body scrolling
watch(showUploadModal, (val) => {
	if (val) {
		document.body.style.overflow = "hidden";
	} else {
		document.body.style.overflow = "";
	}
});

onUnmounted(() => {
	document.body.style.overflow = "";
});

onMounted(async () => {
	if (!requireAuth()) return;
	await fetchVersions();
	await fetchQuestions();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading || isUploading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div class="questions-page">
		<div class="page-top">
			<div class="title-section">
				<h2 class="page-title">
					{{ type === "teacher" ? "Teacher" : "Student" }} Evaluation
					Questions
				</h2>
				<p class="page-desc">
					Manage the questions used in {{ type }} evaluations
				</p>
			</div>

			<div class="actions-section">
				<!-- Version selector controls -->
				<div class="version-controls" v-if="versions.length > 0">
					<span class="control-label">Version Set:</span>
					<select v-model="selectedVersion" @change="onVersionChange" class="version-select">
						<option v-for="ver in versions" :key="ver" :value="ver">
							{{ ver }}
						</option>
					</select>

					<span v-if="selectedVersion === activeVersion" class="badge badge-success">
						<span class="material-icons" style="font-size: 0.875rem; margin-right: 2px;">check_circle</span>
						Active
					</span>
					<span v-else class="badge badge-warning">
						<span class="material-icons" style="font-size: 0.875rem; margin-right: 2px;">info</span>
						Inactive
					</span>

					<button
						v-if="selectedVersion !== activeVersion && selectedVersion"
						class="btn btn-secondary btn-sm"
						@click="setActiveVersion"
					>
						Set Active
					</button>
				</div>

				<button
					class="btn btn-outline"
					@click="showUploadModal = true"
				>
					<span class="material-icons" style="font-size: 1.125rem">upload</span>
					Import
				</button>
				
				<button
					class="btn btn-primary"
					@click="showAddHeader = !showAddHeader"
				>
					<span class="material-icons" style="font-size: 1.125rem">add</span>
					Add Section
				</button>
			</div>
		</div>

		<!-- Add Header -->
		<Transition name="expand">
			<div v-if="showAddHeader" class="add-header-bar card">
				<input
					v-model="newHeader"
					type="text"
					placeholder="New section name..."
					@keyup.enter="addHeader"
				/>
				<button class="btn btn-primary btn-sm" @click="addHeader">
					Add
				</button>
				<button
					class="btn btn-ghost btn-sm"
					@click="showAddHeader = false"
				>
					Cancel
				</button>
			</div>
		</Transition>

		<!-- Sections -->
		<div
			v-for="header in headers"
			:key="header.header_id"
			class="section card"
		>
			<div class="section-top">
				<div class="section-title-area">
					<h3 v-if="!header.editing">{{ header.header }}</h3>
					<input
						v-else
						v-model="header.header"
						type="text"
						class="edit-input"
						@keyup.enter="updateHeader(header)"
					/>
				</div>
				<div class="section-actions">
					<button
						v-if="header.editing"
						class="btn btn-primary btn-sm"
						@click="updateHeader(header)"
					>
						Save
					</button>
					<button
						class="icon-btn"
						@click="header.editing = !header.editing"
						:title="header.editing ? 'Cancel' : 'Edit section'"
					>
						<span class="material-icons">{{
							header.editing ? "close" : "edit"
						}}</span>
					</button>
					<button
						class="icon-btn"
						@click="header.addQ = !header.addQ"
						title="Add question"
					>
						<span class="material-icons">add_circle_outline</span>
					</button>
					<button
						class="icon-btn danger"
						@click="deleteHeader(header.header_id)"
						title="Delete section"
					>
						<span class="material-icons">delete_outline</span>
					</button>
				</div>
			</div>

			<!-- Add Question Bar -->
			<div v-if="header.addQ" class="add-q-bar">
				<input
					v-model="newQuestion"
					type="text"
					placeholder="New question..."
					@keyup.enter="addQuestion(header.header_id)"
				/>
				<button
					class="btn btn-primary btn-sm"
					@click="addQuestion(header.header_id)"
				>
					Add
				</button>
			</div>

			<!-- Questions -->
			<div class="q-list">
				<div
					v-for="(q, idx) in header.questions"
					:key="q.question_id"
					class="q-item"
				>
					<span class="q-num">{{ idx + 1 }}.</span>
					<div class="q-content">
						<p v-if="!q.editing">{{ q.question }}</p>
						<input
							v-else
							v-model="q.question"
							type="text"
							class="edit-input"
							@keyup.enter="updateQuestion(q)"
						/>
					</div>
					<div class="q-actions">
						<button
							v-if="q.editing"
							class="btn btn-primary btn-sm"
							@click="updateQuestion(q)"
						>
							Save
						</button>
						<button
							class="icon-btn"
							@click="q.editing = !q.editing"
						>
							<span class="material-icons">{{
								q.editing ? "close" : "edit"
							}}</span>
						</button>
						<button
							class="icon-btn danger"
							@click="deleteQuestion(q.question_id)"
						>
							<span class="material-icons">delete_outline</span>
						</button>
					</div>
				</div>
				<p
					v-if="!header.questions || header.questions.length === 0"
					class="no-questions"
				>
					No questions in this section
				</p>
			</div>
		</div>

		<div v-if="headers.length === 0" class="empty-state">
			<span class="material-icons">quiz</span>
			<p>No question sections yet. Click "Add Section" or "Import" to get started.</p>
		</div>

		<!-- Import Modal -->
		<Transition name="fade">
			<div v-if="showUploadModal" class="modal-backdrop" @click.self="showUploadModal = false">
				<Transition name="modal">
					<div class="modal-card">
						<div class="modal-header">
							<span class="material-icons modal-icon" style="color: var(--color-primary)">
								cloud_upload
							</span>
							<h2>Import Questionnaire (.docx)</h2>
							<p>
								Select a Microsoft Word (.docx) file containing the new questionnaire to automatically parse and import it.
							</p>
						</div>

						<div class="modal-body form-layout">
							<div class="form-group">
								<label for="version-name">Version Identifier</label>
								<input
									id="version-name"
									v-model="uploadVersionName"
									type="text"
									placeholder="e.g. v2026, v2025_new"
									class="modal-input"
								/>
								<span class="input-tip">Must be a unique name to identify this questionnaire set.</span>
							</div>

							<div class="form-group">
								<label>Upload File</label>
								<div
									class="drop-zone"
									:class="{ active: dragActive, 'has-file': uploadFile }"
									@dragover.prevent="dragActive = true"
									@dragleave.prevent="dragActive = false"
									@drop.prevent="onDrop"
								>
									<span class="material-icons drop-icon">{{
										uploadFile ? "description" : "article"
									}}</span>
									<p v-if="!uploadFile" class="drop-text">
										Drag & drop a .docx file here, or click to browse
									</p>
									<p v-else class="drop-text file-name">{{ uploadFile.name }}</p>
									<span v-if="uploadFile" class="file-size"
										>{{ (uploadFile.size / 1024).toFixed(1) }} KB</span
									>

									<input
										type="file"
										accept=".docx"
										class="file-input"
										@change="onFileChange"
									/>
								</div>
							</div>
						</div>

						<div class="modal-actions">
							<button class="btn btn-ghost" @click="showUploadModal = false" :disabled="isUploading">
								Cancel
							</button>
							<button class="btn btn-primary" @click="handleUpload" :disabled="isUploading || !uploadFile || !uploadVersionName.trim()">
								<span v-if="isUploading" class="material-icons spin">sync</span>
								<span v-else class="material-icons">upload</span>
								Import
							</button>
						</div>
					</div>
				</Transition>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.questions-page {
	animation: fadeIn 0.3s ease;
}

.page-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-6);
	gap: var(--space-4);
	flex-wrap: wrap;
}

.page-title {
	font-size: 1.25rem;
	margin-bottom: var(--space-1);
}

.page-desc {
	color: var(--color-text-muted);
	font-size: 0.875rem;
}

.actions-section {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	flex-wrap: wrap;
}

.version-controls {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.control-label {
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--color-text-muted);
	margin: 0;
	white-space: nowrap;
}

.version-select {
	font-family: var(--font-sans);
	font-size: 0.875rem;
	font-weight: 500;
	padding: 0.375rem 2rem 0.375rem 0.75rem;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-bg) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.5rem center/1.25rem;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	cursor: pointer;
	outline: none;
	transition: all var(--transition-fast);
	min-width: 100px;
}

.version-select:hover {
	border-color: var(--color-border-strong);
}

.version-select:focus {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px var(--color-primary-light);
}

.badge {
	font-size: 0.75rem;
	padding: 0.25rem 0.625rem;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border-radius: var(--radius-full);
	font-weight: 600;
	line-height: 1;
}

.badge-success {
	background: var(--color-success-light);
	color: var(--color-success);
}

.badge-warning {
	background: var(--color-warning-light);
	color: var(--color-warning);
}

.btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}

.btn-outline {
	background: transparent;
	color: var(--color-primary);
	border: 1px solid var(--color-primary);
}
.btn-outline:hover:not(:disabled) {
	background: var(--color-primary-50);
	color: var(--color-primary-hover);
	border-color: var(--color-primary-hover);
}

/* Modal backdrop and card styling */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.3);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: var(--space-4);
}

.modal-card {
	background: var(--color-bg);
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-2xl);
	width: 100%;
	max-width: 480px;
	padding: var(--space-6);
	position: relative;
	box-shadow: var(--shadow-xl);
}

.modal-header {
	margin-bottom: var(--space-4);
	text-align: center;
}

.modal-icon {
	font-size: 2.5rem;
	margin-bottom: var(--space-2);
}

.modal-header h2 {
	margin-bottom: var(--space-1);
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--color-text);
}

.modal-header p {
	font-size: 0.875rem;
	color: var(--color-text-muted);
	line-height: 1.5;
}

.modal-body {
	margin-bottom: var(--space-5);
}

.modal-input {
	padding: var(--space-2) var(--space-3);
	font-size: 0.9375rem;
	border: 1px solid var(--color-border-strong);
	border-radius: var(--radius-md);
}

.input-tip {
	font-size: 0.75rem;
	color: var(--color-text-muted);
	margin-top: 2px;
}

.drop-zone {
	position: relative;
	border: 2px dashed var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-6) var(--space-4);
	text-align: center;
	cursor: pointer;
	transition: all var(--transition-base);
}

.drop-zone:hover,
.drop-zone.active {
	border-color: var(--color-primary);
	background: var(--color-primary-50);
}

.drop-zone.has-file {
	border-color: var(--color-success);
	background: var(--color-success-light);
}

.drop-icon {
	font-size: 2.5rem;
	color: var(--color-text-muted);
	margin-bottom: var(--space-2);
	display: block;
}

.has-file .drop-icon {
	color: var(--color-success);
}

.drop-text {
	color: var(--color-text-muted);
	font-size: 0.8125rem;
}

.file-name {
	font-weight: 600;
	color: var(--color-text);
}

.file-size {
	font-size: 0.75rem;
	color: var(--color-text-muted);
}

.file-input {
	position: absolute;
	inset: 0;
	opacity: 0;
	cursor: pointer;
}

.modal-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: flex-end;
}

.modal-actions .btn {
	min-width: 100px;
}

.spin {
	animation: spin 1s linear infinite;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.modal-enter-active {
	animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
	animation: slideUp 0.2s ease reverse;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

/* Add header bar */
.add-header-bar {
	display: flex;
	gap: var(--space-3);
	align-items: center;
	padding: var(--space-4) var(--space-5);
	margin-bottom: var(--space-5);
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-sm);
	animation: slideDown var(--transition-base);
}

.add-header-bar input {
	flex: 1;
}

/* Section */
.section {
	padding: var(--space-5);
	margin-bottom: var(--space-5);
}

.section-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	margin-bottom: var(--space-4);
	flex-wrap: wrap;
}

.section-title-area {
	flex: 1;
	min-width: 200px;
}

.section-title-area h3 {
	font-size: 1.0625rem;
	margin: 0;
}

.section-actions {
	display: flex;
	gap: var(--space-2);
	align-items: center;
}

.edit-input {
	font-size: 0.9375rem;
	padding: var(--space-2) var(--space-4);
	width: 100%;
	border: 1px solid var(--color-primary);
	border-radius: var(--radius-md);
	background: #ffffff;
	box-shadow: 0 0 0 3px var(--color-primary-light);
	outline: none;
	transition: all var(--transition-fast);
}

.edit-input:focus {
	border-color: var(--color-primary-hover);
	box-shadow: 0 0 0 4px var(--color-primary-light);
}

.icon-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-bg);
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: all var(--transition-base);
}

.icon-btn:hover {
	background: var(--color-bg-subtle);
	color: var(--color-text);
}

.icon-btn.danger:hover {
	background: #fee2e2;
	color: var(--color-error);
	border-color: #fca5a5;
}

.icon-btn .material-icons {
	font-size: 1.125rem;
}

/* Add Q bar */
.add-q-bar {
	display: flex;
	gap: var(--space-3);
	align-items: center;
	padding: var(--space-4);
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	margin-bottom: var(--space-4);
	box-shadow: var(--shadow-xs);
	animation: slideDown var(--transition-base);
}

.add-q-bar input {
	flex: 1;
}

/* Questions list */
.q-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.q-item {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	border-radius: var(--radius-md);
	transition: background var(--transition-base);
}

.q-item:hover {
	background: var(--color-bg-subtle);
}

.q-num {
	font-weight: 600;
	color: var(--color-text-muted);
	font-size: 0.875rem;
	min-width: 24px;
}

.q-content {
	flex: 1;
}

.q-content p {
	margin: 0;
	font-size: 0.9375rem;
}

.q-actions {
	display: flex;
	gap: var(--space-1);
	opacity: 0;
	transition: opacity var(--transition-base);
}

.q-item:hover .q-actions {
	opacity: 1;
}

.no-questions {
	color: var(--color-text-muted);
	font-size: 0.875rem;
	font-style: italic;
	padding: var(--space-3);
}

/* Empty */
.empty-state {
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
	.page-top {
		flex-direction: column;
		align-items: flex-start;
	}
	.actions-section {
		width: 100%;
		justify-content: space-between;
	}
	.version-controls {
		width: 100%;
		justify-content: space-between;
	}
	.section-top {
		flex-direction: column;
		align-items: flex-start;
	}
	.q-actions {
		opacity: 1;
	}
}
</style>
