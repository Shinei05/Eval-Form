<script setup>
import { ref, onMounted } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";
import { getToken } from "../../utils/auth";
import { UploadCloud, FileText, Download, Info, X } from "@lucide/vue";

const { isLoading } = useApi();
const { requireAuth } = useAuth();

const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const file = ref(null);
const loading = ref(false);
const dragActive = ref(false);

function onFileChange(e) {
	file.value = e.target.files[0];
}

function onDrop(e) {
	dragActive.value = false;
	if (e.dataTransfer.files.length) {
		file.value = e.dataTransfer.files[0];
	}
}

async function upload() {
	if (!file.value) {
		notify("Please select a file", "error");
		return;
	}

	loading.value = true;
	try {
		const form = new FormData();
		form.append("action", "uploadCSV");
		form.append("file", file.value);

		const response = await fetch(API.csvImport, {
			method: "POST",
			headers: { Authorization: `Bearer ${getToken()}` },
			body: form,
		});

		const result = await response.json();
		if (result.success) {
			notify("File uploaded successfully!", "success");
			file.value = null;
		} else {
			notify(result.message || "Upload failed", "error");
		}
	} catch (err) {
		notify("Upload failed: " + err.message, "error");
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	if (!requireAuth()) return;
});
</script>

<template>
	<LoadingOverlay v-if="loading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div class="animate-fade-up space-y-6">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
				<UploadCloud class="h-6 w-6" />
			</div>
			<div>
				<h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">CSV File Upload</h2>
				<p class="mt-1 text-sm text-slate-500">
					Import student accounts and teacher assignments via CSV file
				</p>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2 items-start">
			<!-- Upload Card -->
			<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
				<div
					class="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-6"
					:class="{
						'border-indigo-400 bg-indigo-50': dragActive,
						'border-emerald-400 bg-emerald-50': file && !dragActive,
						'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100': !dragActive && !file
					}"
					@dragover.prevent="dragActive = true"
					@dragleave.prevent="dragActive = false"
					@drop.prevent="onDrop"
				>
					<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
						<FileText v-if="file" class="h-8 w-8 text-emerald-500" />
						<UploadCloud v-else class="h-8 w-8 text-indigo-500" />
					</div>
					
					<div v-if="!file">
						<p class="text-sm font-semibold text-slate-700">
							Drag & drop a CSV file here
						</p>
						<p class="text-xs text-slate-500 mt-1">or click to browse</p>
					</div>
					<div v-else>
						<p class="text-sm font-semibold text-slate-900">{{ file.name }}</p>
						<p class="text-xs text-slate-500 mt-1">{{ (file.size / 1024).toFixed(1) }} KB</p>
					</div>

					<input
						type="file"
						accept=".csv"
						class="absolute inset-0 cursor-pointer opacity-0"
						@change="onFileChange"
					/>
				</div>

				<div class="flex gap-3">
					<button
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
						@click="upload"
						:disabled="!file"
					>
						<UploadCloud class="h-4 w-4" />
						Upload
					</button>
					<button
						v-if="file"
						class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
						@click="file = null"
					>
						<X class="h-4 w-4" />
						Clear
					</button>
				</div>
			</div>

			<!-- Format Guide Card -->
			<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
				<div class="mb-4 flex items-center gap-2">
					<Info class="h-5 w-5 text-indigo-500" />
					<h3 class="text-base font-bold text-slate-900">CSV Format Guide</h3>
				</div>
				<p class="text-sm text-slate-500 mb-6">
					Each row represents one student → teacher assignment. Student and teacher accounts are automatically created if they do not exist.
				</p>
				
				<div class="mb-6 space-y-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
					<div>
						<h4 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Details (Columns 1-7)</h4>
						<div class="flex flex-wrap gap-2">
							<span v-for="(col, idx) in ['email', 'firstname', 'lastname', 'id', 'grade', 'section', 'password']" :key="col" class="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
								<span class="font-mono text-[10px] font-bold text-indigo-500">{{ idx + 1 }}</span>
								student_{{ col }}
							</span>
						</div>
					</div>
					<div>
						<h4 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Teacher & Class Details (Columns 8-14)</h4>
						<div class="flex flex-wrap gap-2">
							<span v-for="(col, idx) in ['teacher_email', 'teacher_firstname', 'teacher_lastname', 'teacher_password', 'subject_name', 'quarter', 'year']" :key="col" class="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
								<span class="font-mono text-[10px] font-bold text-emerald-500">{{ idx + 8 }}</span>
								{{ col }}
							</span>
						</div>
					</div>
				</div>

				<div class="mb-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-inner">
					<div class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Example Row</div>
					<code class="text-xs text-emerald-400 whitespace-nowrap font-mono">student1@school.edu,Juan,Dela Cruz,20001,11,Block A,p@ss123,teacher1@test.com,Jane,Doe,t@ach123,Mathematics,1,2026</code>
				</div>

				<ul class="space-y-2 mb-6">
					<li class="flex items-start gap-2 text-sm text-slate-600">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
						<span>Header row (<code class="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">student_email,...</code>) is auto-detected and skipped</span>
					</li>
					<li class="flex items-start gap-2 text-sm text-slate-600">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
						<span>New student and teacher accounts are auto-created if they don't exist</span>
					</li>
					<li class="flex items-start gap-2 text-sm text-slate-600">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
						<span>If a student already exists, their grade and section are updated</span>
					</li>
					<li class="flex items-start gap-2 text-sm text-slate-600">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
						<span>If a teacher already exists, their elementary/JHS flags are updated based on grade assignment</span>
					</li>
					<li class="flex items-start gap-2 text-sm text-slate-600">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
						<span>Duplicate student-teacher assignments are skipped automatically</span>
					</li>
				</ul>

				<a
					href="/Test_CSV.csv"
					download="Test_CSV.csv"
					class="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 border border-indigo-100"
				>
					<Download class="h-4 w-4" />
					Download Example CSV
				</a>
			</div>
		</div>
	</div>
</template>
