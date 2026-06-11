<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";

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

// API endpoints based on type
// Use the "-all" variants for admin so displayed questions are not filtered
// by header_version and match exactly what is stored in the database.
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

// Use computed so this always reflects the current type when the route changes
// between student and teacher pages (Vue reuses the same component instance).
const api = computed(() => endpoints[props.type] || endpoints.student);

async function fetchQuestions() {
	const result = await request(api.value.questions, {
		body: { action: "getQuestions" },
	});
	if (result.success) {
		headers.value = (result.headers || []).map((h) => ({
			...h,
			editing: false,
			addQ: false,
		}));
		headerVersion.value = result.header_ver;
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

// Re-fetch when navigating between student and teacher question pages.
// Vue reuses the same component instance so props.type can change without
// unmounting — the watch ensures each page loads its own question set.
watch(
	() => props.type,
	() => {
		headers.value = [];
		headerVersion.value = null;
		fetchQuestions();
	},
);

onMounted(() => {
	if (!requireAuth()) return;
	fetchQuestions();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div class="questions-page">
		<div class="page-top">
			<div>
				<h2 class="page-title">
					{{ type === "teacher" ? "Teacher" : "Student" }} Evaluation
					Questions
				</h2>
				<p class="page-desc">
					Manage the questions used in {{ type }} evaluations
				</p>
			</div>
			<button
				class="btn btn-primary"
				@click="showAddHeader = !showAddHeader"
			>
				<span class="material-icons" style="font-size: 1.125rem"
					>add</span
				>
				Add Section
			</button>
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
			<p>No question sections yet. Click "Add Section" to get started.</p>
		</div>
	</div>
</template>

<style scoped>
.questions-page {
	animation: fadeIn 0.3s ease;
}

.page-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
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

.btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
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

@media (max-width: 640px) {
	.page-top {
		flex-direction: column;
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
