<script setup>
import { ref, onMounted } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRoute } from "vue-router";
import API from "../../utils/api";
import { useApi } from "../../composables/useApi";
import depedLogo from "../../assets/DepEd-Logo.png";
import bagongPinasLogo from "../../assets/bagongpinas.png";
import jlgisLogo from "../../assets/JLGISlogo.png";

const route = useRoute();
const { isLoading, error, request } = useApi();

const teacher = ref({});
const studentEvals = ref([]);
const peerEvals = ref([]);
const studentCategories = ref([]);
const peerCategories = ref([]);
const printArea = ref(null);
const stats = ref({
	studentCount: 0,
	peerCount: 0,
	totalCount: 0,
	studentAvg: 0,
	peerAvg: 0,
	combinedAvg: 0
});

const reportDate = ref("");

// Format rating levels based on numeric score
function getAdjectivalRating(score) {
	if (!score || score === 0) return "N/A";
	if (score >= 4.5) return "Outstanding (Very Evident)";
	if (score >= 3.5) return "Very Satisfactory";
	if (score >= 2.5) return "Satisfactory (Sometimes Evident)";
	if (score >= 1.5) return "Unsatisfactory";
	return "Poor (Not Evident)";
}

// Sentiment CSS tag
function getSentimentClass(sentiment) {
	if (!sentiment) return "sentiment-neutral";
	const s = sentiment.toLowerCase();
	if (s.includes("positive")) return "sentiment-positive";
	if (s.includes("negative")) return "sentiment-negative";
	return "sentiment-neutral";
}

async function fetchReportData() {
	const tcrid = route.params.tcrid;
	const res = await request(API.teacherReportData, {
		body: { tcr_id: Number(tcrid) }
	});
	if (res?.success) {
		teacher.value = res.teacher || {};
		studentEvals.value = res.studentEvals || [];
		peerEvals.value = res.peerEvals || [];
		studentCategories.value = res.studentCategories || [];
		peerCategories.value = res.peerCategories || [];
		stats.value = res.stats || {
			studentCount: 0,
			peerCount: 0,
			totalCount: 0,
			studentAvg: 0,
			peerAvg: 0,
			combinedAvg: 0
		};
	}
}

async function handleSavePdf() {
	if (!printArea.value) return;

	const canvas = await html2canvas(printArea.value, {
		scale: 2,
		useCORS: true,
		backgroundColor: "#ffffff"
	});

	const imgData = canvas.toDataURL("image/png");
	const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const imgProps = pdf.getImageProperties(imgData);
	const imgWidth = pageWidth;
	const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

	let offset = 0;
	while (offset < imgHeight) {
		pdf.addImage(imgData, "PNG", 0, -offset, imgWidth, imgHeight);
		offset += pageHeight;
		if (offset < imgHeight) {
			pdf.addPage();
		}
	}

	const safeDate = reportDate.value
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
	const safeLastName = (teacher.value.lastname || "report")
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
	const fileName = `teacher-report-${safeLastName}-${safeDate}.pdf`;

	pdf.save(fileName);
}

onMounted(async () => {
	await fetchReportData();
	const now = new Date();
	const months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	reportDate.value = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
});
</script>

<template>
	<div class="export-report-container">
		<!-- Loading state -->
		<div v-if="isLoading" class="loading-state">
			<div class="spinner"></div>
			<p>Loading teacher performance statistics...</p>
		</div>

		<!-- Error state -->
		<div v-else-if="error" class="error-state">
			<div class="error-card">
				<h3>Failed to load report</h3>
				<p>{{ error }}</p>
				<button class="btn-retry" @click="fetchReportData">Retry</button>
				<router-link to="/principal" class="btn-link-back">Back to Dashboard</router-link>
			</div>
		</div>

		<!-- Report View -->
		<div v-else class="report-content-wrapper">
			<!-- Floating Action Toolbar (hidden on print) -->
			<div class="toolbar no-print">
				<router-link to="/principal" class="btn-back">
					<span class="material-icons">arrow_back</span> Back to Dashboard
				</router-link>
				<div class="toolbar-actions">
					<button class="btn-print" @click="handleSavePdf">
						<span class="material-icons">picture_as_pdf</span> Save as PDF
					</button>
				</div>
			</div>

			<!-- printable A4 page -->
			<div class="a4-page" ref="printArea">
				<!-- School Letterhead -->
				<header class="doc-header">
					<div class="logo-box">
						<img :src="depedLogo" alt="DepEd Logo" />
					</div>
					<div class="header-text">
						<p class="line-sm">Republic of the Philippines</p>
						<p class="line-md">Department of Education</p>
						<p class="line-lg">SCHOOLS DIVISION OF OLONGAPO CITY</p>
						<p class="line-school">JAMES L. GORDON INTEGRATED SCHOOL</p>
					</div>
					<div class="logo-box">
						<img :src="bagongPinasLogo" alt="Bagong Pilipinas Logo" />
					</div>
				</header>

				<!-- Title -->
				<div class="report-title-section">
					<h2>TEACHER EVALUATION PERFORMANCE & SUMMARY REPORT</h2>
					<p class="subtitle">Generated on {{ reportDate }}</p>
				</div>

				<!-- Teacher Profile Info -->
				<section class="info-section">
					<h3 class="section-heading">Teacher Profile</h3>
					<div class="info-grid">
						<div class="info-row">
							<span class="info-label">Name:</span>
							<span class="info-value text-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Email:</span>
							<span class="info-value">{{ teacher.email }}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Subject:</span>
							<span class="info-value text-bold">{{ teacher.subject_name }}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Quarter / Year:</span>
							<span class="info-value">Quarter {{ teacher.quarter }} | SY {{ teacher.year }}</span>
						</div>
					</div>
				</section>

				<!-- Overall Metrics Summary -->
				<section class="info-section">
					<h3 class="section-heading">Overall Performance Summary</h3>
					
					<div class="metrics-grid">
						<!-- Student Evals Card -->
						<div class="metric-card student-color">
							<div class="metric-header">
								<span class="metric-title">Student Evaluations</span>
								<span class="count-badge">{{ stats.studentCount }} respondents</span>
							</div>
							<div class="metric-body">
								<div class="score-value">{{ stats.studentAvg.toFixed(2) }}</div>
								<div class="score-scale">/ 5.00</div>
							</div>
							<div class="metric-rating">{{ getAdjectivalRating(stats.studentAvg) }}</div>
							<!-- Progress Bar -->
							<div class="progress-bar-container">
								<div class="progress-bar" :style="{ width: (stats.studentAvg / 5 * 100) + '%' }"></div>
							</div>
						</div>

						<!-- Peer Evals Card -->
						<div class="metric-card peer-color">
							<div class="metric-header">
								<span class="metric-title">Peer/Teacher Evals</span>
								<span class="count-badge">{{ stats.peerCount }} respondents</span>
							</div>
							<div class="metric-body">
								<div class="score-value">{{ stats.peerAvg.toFixed(2) }}</div>
								<div class="score-scale">/ 5.00</div>
							</div>
							<div class="metric-rating">{{ getAdjectivalRating(stats.peerAvg) }}</div>
							<!-- Progress Bar -->
							<div class="progress-bar-container">
								<div class="progress-bar" :style="{ width: (stats.peerAvg / 5 * 100) + '%' }"></div>
							</div>
						</div>

						<!-- Combined Card -->
						<div class="metric-card combined-color">
							<div class="metric-header">
								<span class="metric-title">Combined Rating</span>
								<span class="count-badge">{{ stats.totalCount }} total evals</span>
							</div>
							<div class="metric-body">
								<div class="score-value text-primary">{{ stats.combinedAvg.toFixed(2) }}</div>
								<div class="score-scale">/ 5.00</div>
							</div>
							<div class="metric-rating rating-bold">{{ getAdjectivalRating(stats.combinedAvg) }}</div>
							<!-- Progress Bar -->
							<div class="progress-bar-container">
								<div class="progress-bar" :style="{ width: (stats.combinedAvg / 5 * 100) + '%' }"></div>
							</div>
						</div>
					</div>
				</section>

				<!-- Category performance (Student & Peer) -->
				<section class="info-section page-break-before">
					<h3 class="section-heading">Performance Breakdown By Category</h3>
					
					<div class="categories-container">
						<!-- Student Categories -->
						<div class="category-block">
							<h4>Student Evaluation Categories</h4>
							<div v-if="studentCategories.length === 0" class="no-data-msg">No student evaluations recorded.</div>
							<div v-else class="category-list">
								<div v-for="cat in studentCategories" :key="cat.header" class="category-row">
									<div class="category-info">
										<span class="category-name">{{ cat.header }}</span>
										<span class="category-score">{{ Number(cat.avg_score).toFixed(2) }} / 5.00</span>
									</div>
									<div class="progress-bar-container">
										<div class="progress-bar student-bar" :style="{ width: (Number(cat.avg_score) / 5 * 100) + '%' }"></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Peer Categories -->
						<div class="category-block">
							<h4>Peer/Teacher Evaluation Categories</h4>
							<div v-if="peerCategories.length === 0" class="no-data-msg">No peer/teacher evaluations recorded.</div>
							<div v-else class="category-list">
								<div v-for="cat in peerCategories" :key="cat.header" class="category-row">
									<div class="category-info">
										<span class="category-name">{{ cat.header }}</span>
										<span class="category-score">{{ Number(cat.avg_score).toFixed(2) }} / 5.00</span>
									</div>
									<div class="progress-bar-container">
										<div class="progress-bar peer-bar" :style="{ width: (Number(cat.avg_score) / 5 * 100) + '%' }"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>


				<!-- Signatures Section -->
				<section class="signature-section">
					<div class="sig-col">
						<div class="sig-line"></div>
						<p class="sig-label">Prepared By (Admin)</p>
					</div>
					<div class="sig-col">
						<div class="sig-line"></div>
						<p class="sig-label">Noted / Approved By (Principal)</p>
					</div>
				</section>

				<!-- Document Footer -->
				<footer class="doc-footer">
					<div class="footer-logo">
						<img :src="jlgisLogo" alt="JLGIS Logo" />
					</div>
					<div class="footer-lines">
						<p><strong>Address:</strong> Foster St. Brgy. Kababae, Olongapo City 2200</p>
						<p><strong>Tel. no.:</strong> (047) 222-4769 | <strong>Email:</strong> 500027@deped.gov.ph</p>
						<p><strong>Facebook Page:</strong> depedtayojameslgordonintegratedschool</p>
					</div>
				</footer>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* ── Print styling ─────────────────────────────────── */
@media print {
	.no-print {
		display: none !important;
	}
	.export-report-container {
		background: none !important;
		padding: 0 !important;
	}
	.a4-page {
		box-shadow: none !important;
		margin: 0 !important;
		border: none !important;
		padding: 0 !important;
		width: 100% !important;
		max-width: 100% !important;
	}
	.page-break-before {
		page-break-before: always;
		margin-top: 20mm;
	}
	body {
		background-color: #fff !important;
		color: #000 !important;
	}
}

@page {
	size: A4;
	margin: 15mm 10mm;
}

/* ── Container styles ───────────────────────────────── */
.export-report-container {
	min-height: 100vh;
	background: #f1f5f9;
	padding: 2rem 1rem;
	font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
	color: #1e293b;
}

.report-content-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

/* ── Floating Action Toolbar ────────────────────────── */
.toolbar {
	width: 210mm;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #ffffff;
	padding: 1rem 1.5rem;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
	margin-bottom: 1.5rem;
}

.btn-back {
	color: #4f46e5;
	text-decoration: none;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: transform 0.2s;
}
.btn-back:hover {
	transform: translateX(-4px);
}

.btn-print {
	background: #4f46e5;
	color: white;
	border: none;
	padding: 0.625rem 1.25rem;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
	transition: background 0.2s, box-shadow 0.2s;
}
.btn-print:hover {
	background: #4338ca;
	box-shadow: 0 4px 12px -1px rgba(79, 70, 229, 0.4);
}

.btn-back .material-icons,
.btn-print .material-icons {
	font-size: 1.25rem;
}

/* ── A4 Page Layout ─────────────────────────────────── */
.a4-page {
	width: 210mm;
	min-height: 297mm;
	background: #ffffff;
	box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
	border: 1px solid #e2e8f0;
	padding: 15mm 20mm;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

/* ── Letterhead Header ──────────────────────────────── */
.doc-header {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 3px double #0f172a;
	margin-bottom: 1.5rem;
}

.logo-box {
	width: 4.5rem;
	height: 4.5rem;
	flex-shrink: 0;
}
.logo-box img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.header-text {
	flex: 1;
	text-align: center;
}
.header-text p {
	margin: 0;
	line-height: 1.35;
	color: #0f172a;
}
.line-sm {
	font-size: 0.8rem;
}
.line-md {
	font-size: 0.9rem;
	font-weight: 500;
}
.line-lg {
	font-size: 0.95rem;
	font-weight: 700;
	letter-spacing: 0.5px;
}
.line-school {
	font-size: 1.05rem;
	font-weight: 800;
	color: #1e3a8a !important;
	margin-top: 2px !important;
}

/* ── Report Title ───────────────────────────────────── */
.report-title-section {
	text-align: center;
	margin-bottom: 1.5rem;
}
.report-title-section h2 {
	font-size: 1.25rem;
	color: #1e293b;
	font-weight: 800;
	margin: 0 0 0.25rem 0;
	letter-spacing: 0.5px;
}
.subtitle {
	font-size: 0.85rem;
	color: #64748b;
	margin: 0;
}

/* ── Report Sections ────────────────────────────────── */
.info-section {
	margin-bottom: 1.75rem;
}

.section-heading {
	font-size: 0.95rem;
	text-transform: uppercase;
	color: #1e3a8a;
	border-bottom: 2px solid #e2e8f0;
	padding-bottom: 0.35rem;
	margin: 0 0 0.85rem 0;
	font-weight: 700;
	letter-spacing: 0.5px;
}

/* ── Teacher Profile Grid ───────────────────────────── */
.info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem 2rem;
	background: #f8fafc;
	border-radius: 8px;
	padding: 1rem;
	border: 1px solid #f1f5f9;
}
.info-row {
	display: flex;
	font-size: 0.875rem;
}
.info-label {
	color: #64748b;
	width: 110px;
	font-weight: 500;
}
.info-value {
	color: #0f172a;
	flex: 1;
}
.text-bold {
	font-weight: 600;
}

/* ── Overall Metrics Cards ──────────────────────────── */
.metrics-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}
.metric-card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
}
.metric-header {
	display: flex;
	flex-direction: column;
	margin-bottom: 0.5rem;
}
.metric-title {
	font-size: 0.8rem;
	color: #64748b;
	font-weight: 600;
	text-transform: uppercase;
}
.count-badge {
	font-size: 0.7rem;
	color: #94a3b8;
}
.metric-body {
	display: flex;
	align-items: baseline;
	margin-bottom: 0.25rem;
}
.score-value {
	font-size: 1.85rem;
	font-weight: 800;
	line-height: 1.1;
	color: #1e293b;
}
.score-scale {
	font-size: 0.8rem;
	color: #94a3b8;
	margin-left: 0.25rem;
}
.metric-rating {
	font-size: 0.75rem;
	color: #475569;
	margin-bottom: 0.5rem;
}
.rating-bold {
	font-weight: 600;
	color: #1e3a8a;
}

/* Card custom colors and borders */
.student-color {
	border-left: 4px solid #3b82f6;
}
.peer-color {
	border-left: 4px solid #10b981;
}
.combined-color {
	border-left: 4px solid #6366f1;
	background: #fcfcff;
}

/* Progress bar in metrics */
.progress-bar-container {
	height: 6px;
	background: #e2e8f0;
	border-radius: 3px;
	overflow: hidden;
	width: 100%;
}
.progress-bar {
	height: 100%;
	background: #6366f1;
	border-radius: 3px;
}
.student-color .progress-bar {
	background: #3b82f6;
}
.peer-color .progress-bar {
	background: #10b981;
}
.combined-color .progress-bar {
	background: #6366f1;
}

/* ── Category Breakdowns ────────────────────────────── */
.categories-container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
}
.category-block h4 {
	font-size: 0.85rem;
	color: #475569;
	margin: 0 0 0.75rem 0;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
}
.no-data-msg {
	font-size: 0.8rem;
	color: #94a3b8;
	font-style: italic;
}
.category-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.category-row {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}
.category-info {
	display: flex;
	justify-content: space-between;
	font-size: 0.8rem;
}
.category-name {
	color: #1e293b;
	font-weight: 500;
	white-space: normal;
	word-break: break-word;
	max-width: 180px;
}
.category-score {
	font-weight: 600;
	color: #475569;
}
.student-bar {
	background: #3b82f6;
}
.peer-bar {
	background: #10b981;
}

/* ── Comments Feedback Table ────────────────────────── */
.feedback-table-wrapper {
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
}
.report-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.8rem;
}
.report-table th,
.report-table td {
	padding: 0.5rem 0.75rem;
	text-align: left;
	border-bottom: 1px solid #e2e8f0;
}
.report-table th {
	background: #f8fafc;
	color: #475569;
	font-weight: 700;
	text-transform: uppercase;
	font-size: 0.75rem;
	letter-spacing: 0.3px;
}
.report-table tr:last-child td {
	border-bottom: none;
}
.center-text {
	text-align: center;
}
.text-muted {
	color: #94a3b8;
}
.feedback-cell {
	line-height: 1.4;
	color: #334155;
	font-style: italic;
}

/* Sentiment badges */
.sentiment-badge {
	display: inline-block;
	font-size: 0.7rem;
	font-weight: 600;
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	text-transform: uppercase;
}
.sentiment-positive {
	background: #dcfce7;
	color: #166534;
	border: 1px solid #bbf7d0;
}
.sentiment-negative {
	background: #fee2e2;
	color: #991b1b;
	border: 1px solid #fecaca;
}
.sentiment-neutral {
	background: #f1f5f9;
	color: #475569;
	border: 1px solid #e2e8f0;
}

/* ── Signatures Section ──────────────────────────────── */
.signature-section {
	margin-top: auto;
	padding-top: 3.5rem;
	display: flex;
	justify-content: space-between;
	margin-bottom: 2rem;
}
.sig-col {
	width: 40%;
	text-align: center;
}
.sig-line {
	border-bottom: 1px solid #0f172a;
	margin-bottom: 0.5rem;
}
.sig-label {
	font-size: 0.8rem;
	color: #475569;
	margin: 0;
	font-weight: 500;
}

/* ── Document Footer ────────────────────────────────── */
.doc-footer {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	padding-top: 0.75rem;
	border-top: 2px solid #0f172a;
	margin-top: 1rem;
}
.footer-logo {
	width: 3.2rem;
	flex-shrink: 0;
}
.footer-logo img {
	width: 100%;
	object-fit: contain;
}
.footer-lines p {
	font-size: 0.65rem;
	line-height: 1.35;
	color: #64748b;
	margin: 0;
}

/* ── Loading Screen ─────────────────────────────────── */
.loading-state,
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 50vh;
}
.spinner {
	width: 2.5rem;
	height: 2.5rem;
	border: 3px solid #e2e8f0;
	border-top-color: #4f46e5;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin-bottom: 1rem;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}

.error-card {
	background: white;
	padding: 2rem;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	text-align: center;
	max-width: 400px;
}
.error-card h3 {
	color: #dc2626;
	margin: 0 0 0.5rem 0;
}
.error-card p {
	color: #64748b;
	font-size: 0.875rem;
	margin-bottom: 1.5rem;
}
.btn-retry {
	background: #4f46e5;
	color: white;
	border: none;
	padding: 0.5rem 1.25rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	margin-right: 0.75rem;
}
.btn-link-back {
	color: #4f46e5;
	text-decoration: none;
	font-size: 0.875rem;
}
</style>
