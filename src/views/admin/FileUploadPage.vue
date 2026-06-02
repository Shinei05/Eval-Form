<script setup>
import { ref, onMounted } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";
import { getToken } from "../../utils/auth";

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

	<div class="upload-page">
		<h2 class="page-title">CSV File Upload</h2>
		<p class="page-desc">
			Import student accounts and teacher assignments via CSV file
		</p>

		<div class="upload-layout">
			<div class="upload-card card">
				<div
					class="drop-zone"
					:class="{ active: dragActive, 'has-file': file }"
					@dragover.prevent="dragActive = true"
					@dragleave.prevent="dragActive = false"
					@drop.prevent="onDrop"
				>
					<span class="material-icons drop-icon">{{
						file ? "description" : "cloud_upload"
					}}</span>
					<p v-if="!file" class="drop-text">
						Drag & drop a CSV file here, or click to browse
					</p>
					<p v-else class="drop-text file-name">{{ file.name }}</p>
					<span v-if="file" class="file-size"
						>{{ (file.size / 1024).toFixed(1) }} KB</span
					>

					<input
						type="file"
						accept=".csv"
						class="file-input"
						@change="onFileChange"
					/>
				</div>

				<div class="upload-actions">
					<button
						class="btn btn-primary"
						@click="upload"
						:disabled="!file"
					>
						<span class="material-icons" style="font-size: 1.125rem"
							>upload</span
						>
						Upload
					</button>
					<button v-if="file" class="btn btn-ghost" @click="file = null">
						Clear
					</button>
				</div>
			</div>

			<div class="format-guide card">
				<h3 class="guide-title">CSV Format Guide</h3>
				<p class="guide-desc">
					Each row represents one student → teacher assignment. Student and teacher accounts are automatically created if they do not exist.
				</p>
				<div class="columns-grid">
					<div class="col-item">
						<span class="col-num">1</span>
						<strong>student_email</strong>
					</div>
					<div class="col-item">
						<span class="col-num">2</span> <strong>student_firstname</strong>
					</div>
					<div class="col-item">
						<span class="col-num">3</span> <strong>student_lastname</strong>
					</div>
					<div class="col-item">
						<span class="col-num">4</span> <strong>student_id</strong>
					</div>
					<div class="col-item">
						<span class="col-num">5</span> <strong>student_grade</strong>
					</div>
					<div class="col-item">
						<span class="col-num">6</span> <strong>student_section</strong>
					</div>
					<div class="col-item">
						<span class="col-num">7</span> <strong>student_password</strong>
					</div>
					<div class="col-item">
						<span class="col-num">8</span>
						<strong>teacher_email</strong>
					</div>
					<div class="col-item">
						<span class="col-num">9</span> <strong>teacher_firstname</strong>
					</div>
					<div class="col-item">
						<span class="col-num">10</span> <strong>teacher_lastname</strong>
					</div>
					<div class="col-item">
						<span class="col-num">11</span> <strong>teacher_password</strong>
					</div>
					<div class="col-item">
						<span class="col-num">12</span> <strong>subject_name</strong>
					</div>
					<div class="col-item">
						<span class="col-num">13</span> <strong>quarter</strong>
					</div>
					<div class="col-item">
						<span class="col-num">14</span> <strong>year</strong>
					</div>
				</div>
				<div class="example-box">
					<code>student1@school.edu,Juan,Dela Cruz,20001,11,Block A,p@ss123,teacher1@test.com,Jane,Doe,t@ach123,Mathematics,1,2026</code>
				</div>
				<ul class="guide-notes">
					<li>
						Header row (<code>student_email,...</code>) is auto-detected and skipped
					</li>
					<li>
						New student and teacher accounts are auto-created if they don't exist
					</li>
					<li>
						If a student already exists, their grade and section are updated
					</li>
					<li>
						If a teacher already exists, their elementary/JHS flags are updated based on grade assignment
					</li>
					<li>Duplicate student-teacher assignments are skipped automatically</li>
				</ul>

				<a
					href="/Test_CSV.csv"
					download="Test_CSV.csv"
					class="download-template"
				>
					<span class="material-icons" style="font-size: 1.125rem"
						>download</span
					>
					Download Example CSV
				</a>
			</div>
		</div>
	</div>
</template>

<style scoped>
.upload-page {
	animation: fadeIn 0.3s ease;
}

.page-title {
	font-size: 1.25rem;
	margin-bottom: var(--space-1);
}

.page-desc {
	color: var(--color-text-muted);
	font-size: 0.875rem;
	margin-bottom: var(--space-6);
}

.upload-layout {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-6);
	align-items: start;
}

.upload-card {
	padding: var(--space-6);
}

.drop-zone {
	position: relative;
	border: 2px dashed var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-10);
	text-align: center;
	cursor: pointer;
	transition: all var(--transition-base);
	margin-bottom: var(--space-5);
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
	font-size: 3rem;
	color: var(--color-text-muted);
	margin-bottom: var(--space-3);
	display: block;
}

.has-file .drop-icon {
	color: var(--color-success);
}

.drop-text {
	color: var(--color-text-muted);
	font-size: 0.875rem;
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

.upload-actions {
	display: flex;
	gap: var(--space-3);
}

.btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}

/* ── Format Guide ─────────────────────────── */
.format-guide {
	padding: var(--space-6);
}

.guide-title {
	font-size: 1rem;
	font-weight: 600;
	margin-bottom: var(--space-2);
}

.guide-desc {
	font-size: 0.8125rem;
	color: var(--color-text-muted);
	margin-bottom: var(--space-4);
}

.columns-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--space-2);
	margin-bottom: var(--space-4);
}

.col-item {
	font-size: 0.8125rem;
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.col-num {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	background: var(--color-primary-50, #eef2ff);
	color: var(--color-primary, #4f46e5);
	font-size: 0.6875rem;
	font-weight: 600;
	flex-shrink: 0;
}

.example-box {
	background: #f8fafc;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	padding: var(--space-3);
	margin-bottom: var(--space-4);
	overflow-x: auto;
}

.example-box code {
	font-size: 0.75rem;
	white-space: nowrap;
	color: var(--color-text);
}

.guide-notes {
	list-style: none;
	padding: 0;
	margin: 0;
}

.guide-notes li {
	font-size: 0.8125rem;
	color: var(--color-text-muted);
	padding: var(--space-1) 0;
	padding-left: 1rem;
	position: relative;
}

.guide-notes li::before {
	content: "•";
	position: absolute;
	left: 0;
	color: var(--color-text-muted);
}

.guide-notes code {
	font-size: 0.75rem;
	background: #f1f5f9;
	padding: 1px 4px;
	border-radius: 3px;
}

.download-template {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	margin-top: var(--space-4);
	padding: var(--space-2) var(--space-4);
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--color-primary);
	background: var(--color-primary-50);
	border: 1px solid var(--color-primary);
	border-radius: var(--radius-md);
	text-decoration: none;
	transition: all var(--transition-base);
}

.download-template:hover {
	background: var(--color-primary);
	color: #fff;
}

@media (max-width: 900px) {
	.upload-layout {
		grid-template-columns: 1fr;
	}
}
</style>
