<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import ConfirmModal from "../../components/ConfirmModal.vue";
import API from "../../utils/api";
import { getToken } from "../../utils/auth";
import { 
	UploadCloud, Plus, Pencil, Trash2, X, CheckCircle2, Info, 
	FileText, Loader2, Save, FileQuestion, PlusCircle, Check
} from "@lucide/vue";

const props = defineProps({
	type: { type: String, default: "student" },
});

const { request, isLoading } = useApi();
const { requireAuth } = useAuth();

const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const showDeleteHeaderModal = ref(false);
const headerToDelete = ref(null);
const showDeleteQuestionModal = ref(false);
const questionToDelete = ref(null);

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

function deleteHeader(headerId) {
	headerToDelete.value = headerId;
	showDeleteHeaderModal.value = true;
}

async function executeDeleteHeader() {
	if (!headerToDelete.value) return;
	const result = await request(api.value.headerDelete, {
		body: { action: "deleteHeader", header_id: headerToDelete.value },
	});
	if (result.success) {
		notify("Header deleted", "success");
		fetchQuestions();
	} else {
		notify("Failed to delete header", "error");
	}
	showDeleteHeaderModal.value = false;
	headerToDelete.value = null;
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

function deleteQuestion(qId) {
	questionToDelete.value = qId;
	showDeleteQuestionModal.value = true;
}

async function executeDeleteQuestion() {
	if (!questionToDelete.value) return;
	const result = await request(api.value.questionDelete, {
		body: { action: "delQuestion", id: questionToDelete.value },
	});
	if (result.success) {
		notify("Question deleted", "success");
		fetchQuestions();
	} else {
		notify("Failed to delete question", "error");
	}
	showDeleteQuestionModal.value = false;
	questionToDelete.value = null;
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

	<div class="animate-fade-up space-y-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
					<FileQuestion class="h-6 w-6" />
				</div>
				<div>
					<h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
						{{ type === "teacher" ? "Teacher" : "Student" }} Evaluation Questions
					</h2>
					<p class="mt-1 text-sm text-slate-500">
						Manage the questions used in {{ type }} evaluations
					</p>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<!-- Version selector controls -->
				<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" v-if="versions.length > 0">
					<div class="relative">
						<select v-model="selectedVersion" @change="onVersionChange" class="appearance-none rounded-lg bg-slate-50 border-0 py-1.5 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 cursor-pointer">
							<option v-for="ver in versions" :key="ver" :value="ver">
								{{ ver }}
							</option>
						</select>
					</div>

					<div class="flex items-center gap-1.5 px-2">
						<span v-if="selectedVersion === activeVersion" class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
							<CheckCircle2 class="h-3 w-3" /> Active
						</span>
						<span v-else class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
							<Info class="h-3 w-3" /> Inactive
						</span>
					</div>

					<button
						v-if="selectedVersion !== activeVersion && selectedVersion"
						class="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors mr-1"
						@click="setActiveVersion"
					>
						Set Active
					</button>
				</div>

				<button
					class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
					@click="showUploadModal = true"
				>
					<UploadCloud class="h-4 w-4 text-slate-500" />
					Import
				</button>
				
				<button
					class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
					@click="showAddHeader = !showAddHeader"
				>
					<Plus class="h-4 w-4" />
					Add Section
				</button>
			</div>
		</div>

		<!-- Add Header -->
		<Transition
			enter-active-class="transition-all duration-300 ease-out"
			enter-from-class="opacity-0 -translate-y-4"
			enter-to-class="opacity-100 translate-y-0"
			leave-active-class="transition-all duration-200 ease-in"
			leave-from-class="opacity-100 translate-y-0"
			leave-to-class="opacity-0 -translate-y-4"
		>
			<div v-if="showAddHeader" class="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
				<input
					v-model="newHeader"
					type="text"
					placeholder="New section name..."
					class="block w-full rounded-lg border-0 py-2.5 px-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-indigo-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
					@keyup.enter="addHeader"
				/>
				<button class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700" @click="addHeader">
					<Check class="h-4 w-4" />
					Save
				</button>
				<button
					class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
					@click="showAddHeader = false"
				>
					Cancel
				</button>
			</div>
		</Transition>

		<!-- Sections -->
		<div class="space-y-6">
			<div
				v-for="header in headers"
				:key="header.header_id"
				class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
			>
				<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
					<div class="flex-1 mr-4">
						<h3 v-if="!header.editing" class="text-base font-bold text-slate-900">{{ header.header }}</h3>
						<input
							v-else
							v-model="header.header"
							type="text"
							class="block w-full rounded-lg border-0 py-1.5 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
							@keyup.enter="updateHeader(header)"
						/>
					</div>
					<div class="flex items-center gap-1.5 shrink-0">
						<button
							v-if="header.editing"
							class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
							@click="updateHeader(header)"
						>
							<Save class="h-3.5 w-3.5" />
							Save
						</button>
						<button
							class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
							@click="header.editing = !header.editing"
							:title="header.editing ? 'Cancel' : 'Edit section'"
						>
							<X v-if="header.editing" class="h-4 w-4" />
							<Pencil v-else class="h-4 w-4" />
						</button>
						<button
							class="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
							@click="header.addQ = !header.addQ"
							title="Add question"
						>
							<PlusCircle class="h-4 w-4" />
						</button>
						<button
							class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
							@click="deleteHeader(header.header_id)"
							title="Delete section"
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Add Question Bar -->
				<div v-if="header.addQ" class="border-b border-indigo-100 bg-indigo-50/30 p-3 sm:p-4">
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 max-w-3xl">
						<input
							v-model="newQuestion"
							type="text"
							placeholder="Type new question here..."
							class="block w-full rounded-lg border-0 py-2 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-indigo-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
							@keyup.enter="addQuestion(header.header_id)"
						/>
						<button
							class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
							@click="addQuestion(header.header_id)"
						>
							<Check class="h-4 w-4" />
							Add Question
						</button>
					</div>
				</div>

				<!-- Questions -->
				<div class="divide-y divide-slate-100">
					<div
						v-for="(q, idx) in header.questions"
						:key="q.question_id"
						class="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors"
					>
						<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 mt-0.5">
							{{ idx + 1 }}
						</span>
						<div class="flex-1 pt-0.5 min-w-0">
							<p v-if="!q.editing" class="text-sm font-medium text-slate-700">{{ q.question }}</p>
							<input
								v-else
								v-model="q.question"
								type="text"
								class="block w-full rounded-lg border-0 py-1.5 px-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
								@keyup.enter="updateQuestion(q)"
							/>
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button
								v-if="q.editing"
								class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors mr-2"
								@click="updateQuestion(q)"
							>
								Save
							</button>
							<button
								class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
								@click="q.editing = !q.editing"
							>
								<X v-if="q.editing" class="h-3.5 w-3.5" />
								<Pencil v-else class="h-3.5 w-3.5" />
							</button>
							<button
								class="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
								@click="deleteQuestion(q.question_id)"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
					
					<div
						v-if="!header.questions || header.questions.length === 0"
						class="p-8 text-center"
					>
						<p class="text-sm text-slate-400">No questions in this section</p>
					</div>
				</div>
			</div>

			<div v-if="headers.length === 0 && !isLoading" class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
				<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
					<FileQuestion class="h-7 w-7" />
				</div>
				<h3 class="text-sm font-bold text-slate-900">No question sections yet</h3>
				<p class="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
					Click "Add Section" to manually create one, or "Import" to upload a .docx questionnaire.
				</p>
			</div>
		</div>

		<!-- Import Modal (Teleport to Body) -->
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
					v-if="showUploadModal"
					class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 sm:p-6"
					@click.self="showUploadModal = false"
				>
					<Transition
						enter-active-class="transition duration-200 ease-out"
						enter-from-class="opacity-0 scale-95 translate-y-2"
						enter-to-class="opacity-100 scale-100 translate-y-0"
						leave-active-class="transition duration-150 ease-in"
						leave-from-class="opacity-100 scale-100 translate-y-0"
						leave-to-class="opacity-0 scale-95 translate-y-2"
					>
						<div v-if="showUploadModal" class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
							<!-- Modal Header -->
							<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
										<UploadCloud class="h-5 w-5" />
									</div>
									<div>
										<h3 class="text-base font-bold text-slate-900">Import Questionnaire</h3>
										<p class="text-xs text-slate-500">Upload a Microsoft Word (.docx) file</p>
									</div>
								</div>
								<button
									@click="showUploadModal = false"
									:disabled="isUploading"
									class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
								>
									<X class="h-5 w-5" />
								</button>
							</div>

							<!-- Modal Body -->
							<div class="p-6 space-y-5">
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">Version Identifier</label>
									<input
										v-model="uploadVersionName"
										type="text"
										placeholder="e.g. v2026, v2025_new"
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									/>
									<p class="mt-1.5 text-xs text-slate-500">Must be a unique name to identify this questionnaire set.</p>
								</div>

								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">Upload File</label>
									<div
										class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer"
										:class="{
											'border-indigo-400 bg-indigo-50': dragActive,
											'border-emerald-400 bg-emerald-50': uploadFile && !dragActive,
											'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100': !dragActive && !uploadFile
										}"
										@dragover.prevent="dragActive = true"
										@dragleave.prevent="dragActive = false"
										@drop.prevent="onDrop"
									>
										<FileText v-if="uploadFile" class="h-8 w-8 text-emerald-500 mb-3" />
										<FileText v-else class="h-8 w-8 text-indigo-500 mb-3" />
										
										<div v-if="!uploadFile">
											<p class="text-sm font-semibold text-slate-700">Drag & drop a .docx file here</p>
											<p class="text-xs text-slate-500 mt-1">or click to browse</p>
										</div>
										<div v-else>
											<p class="text-sm font-semibold text-slate-900">{{ uploadFile.name }}</p>
											<p class="text-xs text-slate-500 mt-1">{{ (uploadFile.size / 1024).toFixed(1) }} KB</p>
										</div>

										<input
											type="file"
											accept=".docx"
											class="absolute inset-0 cursor-pointer opacity-0"
											@change="onFileChange"
										/>
									</div>
								</div>
							</div>

							<!-- Modal Actions -->
							<div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">
								<button
									@click="showUploadModal = false"
									:disabled="isUploading"
									class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									@click="handleUpload"
									:disabled="isUploading || !uploadFile || !uploadVersionName.trim()"
									class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Loader2 v-if="isUploading" class="h-4 w-4 animate-spin" />
									<UploadCloud v-else class="h-4 w-4" />
									{{ isUploading ? 'Importing...' : 'Import Questionnaire' }}
								</button>
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</Teleport>

		<!-- Delete Header Confirm Modal -->
		<ConfirmModal
			v-model:visible="showDeleteHeaderModal"
			title="Delete Section"
			message="Delete this entire section and all its questions? This action cannot be undone."
			confirmText="Delete Section"
			cancelText="Cancel"
			:danger="true"
			icon="trash"
			@confirm="executeDeleteHeader"
		/>

		<!-- Delete Question Confirm Modal -->
		<ConfirmModal
			v-model:visible="showDeleteQuestionModal"
			title="Delete Question"
			message="Are you sure you want to delete this question? This action cannot be undone."
			confirmText="Delete Question"
			cancelText="Cancel"
			:danger="true"
			icon="trash"
			@confirm="executeDeleteQuestion"
		/>
	</div>
</template>
