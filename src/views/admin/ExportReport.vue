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
import { ArrowLeft, FileText, School, Users, Layers, Download, Loader2, X } from "@lucide/vue";

const route = useRoute();
const { isLoading, error, request } = useApi();

const teacher = ref({});
const studentEvals = ref([]);
const peerEvals = ref([]);
const studentCategories = ref([]);
const peerCategories = ref([]);
const printArea = ref(null);
const showExportModal = ref(false);
const exportLoading = ref(null);
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

// Dynamic score style & rating tier palette
function getScoreStyle(scoreNum) {
	const score = Number(scoreNum) || 0;
	if (score >= 4.5) {
		return {
			bar: '#059669',
			badgeBg: '#ecfdf5',
			badgeText: '#047857',
			border: '#a7f3d0',
			label: 'Outstanding'
		};
	}
	if (score >= 3.5) {
		return {
			bar: '#2563eb',
			badgeBg: '#eff6ff',
			badgeText: '#1d4ed8',
			border: '#bfdbfe',
			label: 'Very Satisfactory'
		};
	}
	if (score >= 2.5) {
		return {
			bar: '#4f46e5',
			badgeBg: '#eef2ff',
			badgeText: '#3730a3',
			border: '#c7d2fe',
			label: 'Satisfactory'
		};
	}
	if (score >= 1.5) {
		return {
			bar: '#d97706',
			badgeBg: '#fffbeb',
			badgeText: '#b45309',
			border: '#fde68a',
			label: 'Unsatisfactory'
		};
	}
	return {
		bar: '#e11d48',
		badgeBg: '#fef2f2',
		badgeText: '#9f1239',
		border: '#fecdd3',
		label: 'Poor'
	};
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

function handleSavePdf() {
	showExportModal.value = true;
}

async function doExport(target) {
	exportLoading.value = target;
	showExportModal.value = false;

	const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "legal" });
	const pageWidth  = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();

	const pages = Array.from(printArea.value.querySelectorAll("[data-pdf-page]"));
	const toExport = target === "both" ? pages
		: target === "student" ? [pages[0]]
		: [pages[1]];

	for (let i = 0; i < toExport.length; i++) {
		const canvas = await html2canvas(toExport[i], {
			scale: 2,
			useCORS: true,
			backgroundColor: "#ffffff",
			logging: false,
		});

		const imgData = canvas.toDataURL("image/png");
		let imgWidth  = pageWidth;
		let imgHeight = (canvas.height * imgWidth) / canvas.width;
		if (imgHeight > pageHeight) {
			const ratio = pageHeight / imgHeight;
			imgWidth  *= ratio;
			imgHeight  = pageHeight;
		}
		const xOffset = (pageWidth - imgWidth) / 2;
		if (i > 0) pdf.addPage();
		pdf.addImage(imgData, "PNG", xOffset, 0, imgWidth, imgHeight, undefined, "FAST");
	}

	const safeDate = reportDate.value
		.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	const safeLastName = (teacher.value.lastname || "report")
		.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	const suffix = target === "student" ? "student-eval"
		: target === "peer" ? "peer-eval" : "full-report";
	const fileName = `teacher-report-${safeLastName}-${safeDate}-${suffix}.pdf`;

	pdf.save(fileName);
	exportLoading.value = null;
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
		<div v-else class="report-content-wrapper" ref="printArea">
			<!-- Floating Action Toolbar (hidden on print) -->
			<div class="toolbar no-print">
				<router-link to="/principal" class="btn-back">
					<ArrowLeft class="h-4 w-4" /> Back to Dashboard
				</router-link>
				<div class="toolbar-actions">
					<button class="btn-print" @click="handleSavePdf">
						<FileText class="h-4 w-4" /> Save as PDF
					</button>
				</div>
			</div>

			<!-- ── Two documents side by side ─────────────── -->
			<div class="pages-row">

				<!-- ── Doc 1: Student Evaluation Document ───── -->
				<div class="doc-column">
					<div class="doc-label no-print student-label">
						<span class="doc-label-dot" style="background:#3b82f6"></span>
						Student Evaluation Document
					</div>

					<div class="a4-page" data-pdf-page>
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
							<h2>TEACHER EVALUATION PERFORMANCE REPORT</h2>
							<p class="subtitle">Student Evaluation Report &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Compact Side-by-Side: Profile + Summary Hero -->
						<div class="profile-summary-grid">
							<!-- Teacher Profile -->
							<div class="profile-card">
								<h4 class="card-title">Teacher Profile</h4>
								<div class="meta-list">
									<div class="meta-item">
										<span class="meta-label">Name:</span>
										<span class="meta-val font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Email:</span>
										<span class="meta-val">{{ teacher.email }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Subject:</span>
										<span class="meta-val font-bold">{{ teacher.subject_name }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Period:</span>
										<span class="meta-val">Quarter {{ teacher.quarter }} | SY {{ teacher.year }}</span>
									</div>
								</div>
							</div>

							<!-- Summary Hero Card -->
							<div class="summary-hero-card" :style="{ borderColor: getScoreStyle(stats.studentAvg).border }">
								<div class="hero-header">
									<span class="hero-title">Overall Student Rating</span>
									<span class="hero-badge">{{ stats.studentCount }} respondents</span>
								</div>
								<div class="hero-body">
									<span class="hero-score" :style="{ color: getScoreStyle(stats.studentAvg).bar }">{{ stats.studentAvg.toFixed(2) }}</span>
									<span class="hero-scale">/ 5.00</span>
								</div>
								<div class="hero-tag" :style="{ background: getScoreStyle(stats.studentAvg).badgeBg, color: getScoreStyle(stats.studentAvg).badgeText }">
									{{ getAdjectivalRating(stats.studentAvg) }}
								</div>
								<div class="hero-progress-track">
									<div class="hero-progress-fill" :style="{ width: (stats.studentAvg / 5 * 100) + '%', background: getScoreStyle(stats.studentAvg).bar }"></div>
								</div>
							</div>
						</div>

						<!-- Student Category Breakdown — color-coded cards -->
						<section class="info-section">
							<h3 class="section-heading">Student Evaluation — Category Breakdown</h3>
							<div v-if="studentCategories.length === 0" class="no-data-msg">No student evaluations recorded.</div>
							<div v-else class="cat-cards-list">
								<div
									v-for="(cat, idx) in studentCategories"
									:key="cat.header"
									class="cat-card"
									:style="{ borderLeftColor: getScoreStyle(cat.avg_score).bar }"
								>
									<div class="cat-card-top">
										<div class="cat-left">
											<span class="cat-idx">{{ String(idx + 1).padStart(2, '0') }}</span>
											<span class="cat-title">{{ cat.header }}</span>
										</div>
										<div
											class="cat-score-badge"
											:style="{
												background: getScoreStyle(cat.avg_score).badgeBg,
												color: getScoreStyle(cat.avg_score).badgeText,
												borderColor: getScoreStyle(cat.avg_score).border
											}"
										>
											<strong>{{ Number(cat.avg_score).toFixed(2) }}</strong> / 5.00
											<span class="cat-rating-tag">{{ getScoreStyle(cat.avg_score).label }}</span>
										</div>
									</div>
									<div class="cat-track">
										<div
											class="cat-fill"
											:style="{
												width: (Number(cat.avg_score) / 5 * 100) + '%',
												background: getScoreStyle(cat.avg_score).bar
											}"
										></div>
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
					</div> <!-- /a4-page doc 1 -->
				</div> <!-- /doc-column 1 -->

				<!-- ── Doc 2: Peer / Teacher Evaluation Document ────── -->
				<div class="doc-column">
					<div class="doc-label no-print peer-label">
						<span class="doc-label-dot" style="background:#10b981"></span>
						Peer / Teacher Evaluation
					</div>

					<div class="a4-page" data-pdf-page>
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
							<h2>PEER / TEACHER EVALUATION PERFORMANCE REPORT</h2>
							<p class="subtitle">Peer / Teacher Evaluation Report &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Compact Side-by-Side: Profile + Summary Hero -->
						<div class="profile-summary-grid">
							<!-- Teacher Profile -->
							<div class="profile-card">
								<h4 class="card-title">Teacher Profile</h4>
								<div class="meta-list">
									<div class="meta-item">
										<span class="meta-label">Name:</span>
										<span class="meta-val font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Email:</span>
										<span class="meta-val">{{ teacher.email }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Subject:</span>
										<span class="meta-val font-bold">{{ teacher.subject_name }}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">Period:</span>
										<span class="meta-val">Quarter {{ teacher.quarter }} | SY {{ teacher.year }}</span>
									</div>
								</div>
							</div>

							<!-- Summary Hero Card -->
							<div class="summary-hero-card" :style="{ borderColor: getScoreStyle(stats.peerAvg).border }">
								<div class="hero-header">
									<span class="hero-title">Overall Peer / Teacher Rating</span>
									<span class="hero-badge">{{ stats.peerCount }} respondents</span>
								</div>
								<div class="hero-body">
									<span class="hero-score" :style="{ color: getScoreStyle(stats.peerAvg).bar }">{{ stats.peerAvg.toFixed(2) }}</span>
									<span class="hero-scale">/ 5.00</span>
								</div>
								<div class="hero-tag" :style="{ background: getScoreStyle(stats.peerAvg).badgeBg, color: getScoreStyle(stats.peerAvg).badgeText }">
									{{ getAdjectivalRating(stats.peerAvg) }}
								</div>
								<div class="hero-progress-track">
									<div class="hero-progress-fill" :style="{ width: (stats.peerAvg / 5 * 100) + '%', background: getScoreStyle(stats.peerAvg).bar }"></div>
								</div>
							</div>
						</div>

						<!-- Peer Category Breakdown — color-coded cards -->
						<section class="info-section">
							<h3 class="section-heading">Peer / Teacher Evaluation — Category Breakdown</h3>
							<div v-if="peerCategories.length === 0" class="no-data-msg">No peer/teacher evaluations recorded.</div>
							<div v-else class="cat-cards-list">
								<div
									v-for="(cat, idx) in peerCategories"
									:key="cat.header"
									class="cat-card"
									:style="{ borderLeftColor: getScoreStyle(cat.avg_score).bar }"
								>
									<div class="cat-card-top">
										<div class="cat-left">
											<span class="cat-idx">{{ String(idx + 1).padStart(2, '0') }}</span>
											<span class="cat-title">{{ cat.header }}</span>
										</div>
										<div
											class="cat-score-badge"
											:style="{
												background: getScoreStyle(cat.avg_score).badgeBg,
												color: getScoreStyle(cat.avg_score).badgeText,
												borderColor: getScoreStyle(cat.avg_score).border
											}"
										>
											<strong>{{ Number(cat.avg_score).toFixed(2) }}</strong> / 5.00
											<span class="cat-rating-tag">{{ getScoreStyle(cat.avg_score).label }}</span>
										</div>
									</div>
									<div class="cat-track">
										<div
											class="cat-fill"
											:style="{
												width: (Number(cat.avg_score) / 5 * 100) + '%',
												background: getScoreStyle(cat.avg_score).bar
											}"
										></div>
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
					</div> <!-- /a4-page doc 2 -->
				</div> <!-- /doc-column 2 -->
			</div> <!-- /pages-row -->
		</div> <!-- /report-content-wrapper -->

		<!-- ── Export Choice Modal ────────────────────────── -->
		<Teleport to="body">
			<Transition
				enter-active-class="transition duration-150 ease-out"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition duration-100 ease-in"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<div
					v-if="showExportModal"
					class="export-modal-backdrop"
					@click.self="showExportModal = false"
				>
					<Transition
						enter-active-class="transition duration-200 ease-out"
						enter-from-class="opacity-0 scale-95 translate-y-2"
						enter-to-class="opacity-100 scale-100 translate-y-0"
						leave-active-class="transition duration-150 ease-in"
						leave-from-class="opacity-100 scale-100 translate-y-0"
						leave-to-class="opacity-0 scale-95 translate-y-2"
					>
						<div v-if="showExportModal" class="export-modal-card">
							<!-- Close X button -->
							<button type="button" class="export-modal-close" @click="showExportModal = false" aria-label="Close dialog">
								<X class="h-4 w-4" />
							</button>

							<!-- Icon -->
							<div class="export-modal-icon">
								<FileText class="h-7 w-7 text-indigo-600" />
							</div>
							<h3 class="export-modal-title">Export Evaluation Report</h3>
							<p class="export-modal-sub">Select which document format you want to download:</p>

							<!-- Options -->
							<div class="export-options">
								<!-- Student Only -->
								<button
									class="export-option student-opt"
									:disabled="exportLoading !== null"
									@click="doExport('student')"
								>
									<span class="export-opt-icon-wrap bg-blue-100 text-blue-700">
										<School class="h-5 w-5" />
									</span>
									<div class="export-opt-text">
										<strong>Student Evaluation</strong>
										<small>Student-to-teacher ratings &amp; category breakdown</small>
									</div>
								</button>

								<!-- Peer Only -->
								<button
									class="export-option peer-opt"
									:disabled="exportLoading !== null"
									@click="doExport('peer')"
								>
									<span class="export-opt-icon-wrap bg-emerald-100 text-emerald-700">
										<Users class="h-5 w-5" />
									</span>
									<div class="export-opt-text">
										<strong>Peer / Teacher Evaluation</strong>
										<small>Peer-to-peer ratings &amp; category breakdown</small>
									</div>
								</button>

								<!-- Export Both -->
								<button
									class="export-option both-opt"
									:disabled="exportLoading !== null"
									@click="doExport('both')"
								>
									<span class="export-opt-icon-wrap bg-indigo-100 text-indigo-700">
										<Layers class="h-5 w-5" />
									</span>
									<div class="export-opt-text">
										<strong>Export Both Documents</strong>
										<small>Complete two-page Legal PDF package</small>
									</div>
								</button>
							</div>

							<!-- Cancel -->
							<button class="export-cancel" @click="showExportModal = false">Cancel</button>
						</div>
					</Transition>
				</div>
			</Transition>
		</Teleport>
	</div> <!-- /export-report-container -->
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
	size: legal;
	margin: 15mm 10mm;
}

/* ── Container styles ───────────────────────────────── */
.export-report-container {
	min-height: 100vh;
	background: #f4f6fa;
	padding: 2rem 1rem;
	font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
	color: #0f172a;
}

.report-content-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

/* ── Floating Action Toolbar ────────────────────────── */
.toolbar {
	width: fit-content;
	min-width: 472mm;
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

/* ── Legal Page Layout ─────────────────────────────────── */
.a4-page {
	width: 215.9mm;
	min-height: 355.6mm;
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

/* ── Side-by-Side Profile + Hero Grid ───────────────── */
.profile-summary-grid {
	display: grid;
	grid-template-columns: 1.1fr 0.9fr;
	gap: 1.25rem;
	margin-bottom: 1.5rem;
}

.profile-card {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 1rem 1.25rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
}
.card-title {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	font-weight: 700;
	color: #64748b;
	margin: 0 0 0.6rem 0;
}
.meta-list {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem 1rem;
}
.meta-item {
	display: flex;
	flex-direction: column;
	font-size: 0.8rem;
}
.meta-label {
	font-size: 0.7rem;
	color: #94a3b8;
	font-weight: 500;
	text-transform: uppercase;
}
.meta-val {
	color: #0f172a;
	word-break: break-word;
}

.summary-hero-card {
	background: #ffffff;
	border: 2px solid #bfdbfe;
	border-radius: 10px;
	padding: 1rem 1.25rem;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	box-shadow: 0 4px 6px -2px rgba(15, 23, 42, 0.03);
}
.hero-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.hero-title {
	font-size: 0.75rem;
	font-weight: 700;
	color: #475569;
	text-transform: uppercase;
	letter-spacing: 0.4px;
}
.hero-badge {
	font-size: 0.7rem;
	color: #94a3b8;
	font-weight: 500;
}
.hero-body {
	display: flex;
	align-items: baseline;
	margin: 0.3rem 0;
}
.hero-score {
	font-size: 2.2rem;
	font-weight: 800;
	line-height: 1;
}
.hero-scale {
	font-size: 0.85rem;
	color: #94a3b8;
	margin-left: 0.3rem;
	font-weight: 600;
}
.hero-tag {
	display: inline-block;
	align-self: flex-start;
	font-size: 0.725rem;
	font-weight: 700;
	padding: 0.2rem 0.55rem;
	border-radius: 6px;
	margin-bottom: 0.5rem;
}
.hero-progress-track {
	height: 6px;
	background: #e2e8f0;
	border-radius: 3px;
	overflow: hidden;
	width: 100%;
}
.hero-progress-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.3s ease;
}

/* ── Category Breakdown Cards (Dynamic Colors & Space-Efficient) ─ */
.cat-cards-list {
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
}
.cat-card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-left-width: 4px;
	border-radius: 8px;
	padding: 0.65rem 0.85rem;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.cat-card-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
}
.cat-left {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex: 1;
	min-width: 0;
}
.cat-idx {
	font-size: 0.7rem;
	font-weight: 800;
	color: #64748b;
	background: #f1f5f9;
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	letter-spacing: 0.5px;
	flex-shrink: 0;
}
.cat-title {
	font-size: 0.825rem;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.35;
	word-break: break-word;
}
.cat-score-badge {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.75rem;
	padding: 0.2rem 0.55rem;
	border-radius: 6px;
	border: 1px solid transparent;
	flex-shrink: 0;
}
.cat-rating-tag {
	font-size: 0.675rem;
	font-weight: 600;
	opacity: 0.85;
	border-left: 1px solid currentColor;
	padding-left: 0.4rem;
	margin-left: 0.2rem;
}
.cat-track {
	height: 6px;
	background: #f1f5f9;
	border-radius: 3px;
	overflow: hidden;
	width: 100%;
}
.cat-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.3s ease;
}


/* ── Page 2 gap in browser preview ─────────────────── */
.page-2 {
	margin-top: 2rem;
}

/* ── Category Breakdowns (legacy, still used for .no-data-msg) ─ */
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

/* ── Side-by-side page layout ───────────────────── */
.pages-row {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 2.5rem;
	overflow-x: auto;
	padding-bottom: 2rem;
}
.doc-column {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-shrink: 0;
}
.doc-label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	padding: 0.35rem 0.75rem;
	border-radius: 20px;
	margin-bottom: 0.75rem;
}
.student-label {
	background: #eff6ff;
	color: #1d4ed8;
}
.peer-label {
	background: #f0fdf4;
	color: #15803d;
}
.doc-label-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

/* Remove old page-2 margin-top since we're side by side */
.page-2 {
	margin-top: 0;
}

/* ── Export Choice Modal ────────────────────────── */
.export-modal-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(15, 23, 42, 0.6);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
}
.export-modal-card {
	position: relative;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 1.25rem;
	box-shadow: 0 32px 64px -16px rgba(2, 6, 23, 0.45);
	padding: 2rem;
	width: 100%;
	max-width: 440px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
}
.export-modal-close {
	position: absolute;
	top: 1.25rem;
	right: 1.25rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
	background: #ffffff;
	color: #64748b;
	cursor: pointer;
	transition: all 0.15s ease;
}
.export-modal-close:hover {
	background: #f8fafc;
	color: #0f172a;
}
.export-modal-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 3.5rem;
	height: 3.5rem;
	border-radius: 1rem;
	background: #eef2ff;
	margin-bottom: 1rem;
}
.export-modal-title {
	font-size: 1.25rem;
	font-weight: 800;
	color: #0f172a;
	margin: 0 0 0.35rem 0;
	letter-spacing: -0.02em;
}
.export-modal-sub {
	font-size: 0.875rem;
	color: #475569;
	margin: 0 0 1.5rem 0;
}
.export-options {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	margin-bottom: 1.25rem;
}
.export-option {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.875rem 1.25rem;
	border-radius: 0.875rem;
	border: 1.5px solid transparent;
	cursor: pointer;
	text-align: left;
	transition: all 0.15s ease;
	font-family: inherit;
}
.export-option:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.export-opt-icon-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 0.75rem;
	flex-shrink: 0;
}
.export-opt-text {
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
}
.export-opt-text strong {
	font-size: 0.9rem;
	font-weight: 700;
	color: #0f172a;
}
.export-opt-text small {
	font-size: 0.75rem;
	color: #64748b;
}
.student-opt {
	background: #f8fafc;
	border-color: #e2e8f0;
}
.student-opt:hover:not(:disabled) {
	background: #eff6ff;
	border-color: #bfdbfe;
}
.peer-opt {
	background: #f8fafc;
	border-color: #e2e8f0;
}
.peer-opt:hover:not(:disabled) {
	background: #f0fdf4;
	border-color: #bbf7d0;
}
.both-opt {
	background: #f8fafc;
	border-color: #e2e8f0;
}
.both-opt:hover:not(:disabled) {
	background: #eef2ff;
	border-color: #c7d2fe;
}
.export-cancel {
	width: 100%;
	padding: 0.65rem;
	border-radius: 0.75rem;
	border: 1px solid #e2e8f0;
	background: #ffffff;
	color: #475569;
	font-size: 0.875rem;
	font-weight: 700;
	cursor: pointer;
	transition: background 0.15s;
	font-family: inherit;
}
.export-cancel:hover {
	background: #f8fafc;
	color: #0f172a;
}

/* ── Skeleton Loaders ────────────────────────── */
@keyframes shimmer {
	0% { opacity: 0.45; }
	50% { opacity: 0.85; }
	100% { opacity: 0.45; }
}

.report-skeleton-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	animation: shimmer 1.5s ease-in-out infinite;
}

.toolbar-sk {
	width: fit-content;
	min-width: 472mm;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #ffffff;
	padding: 1rem 1.5rem;
	border-radius: 12px;
	margin-bottom: 1.5rem;
	border: 1px solid #e2e8f0;
}

.sk-page {
	background: #ffffff !important;
	border: 1px solid #e2e8f0 !important;
}

.sk-pill {
	height: 1.5rem;
	background: #e2e8f0;
	border-radius: 999px;
}
.sk-w-28 { width: 7rem; }
.sk-w-32 { width: 8rem; }
.sk-w-36 { width: 9rem; }
.sk-w-40 { width: 10rem; }
.sk-w-44 { width: 11rem; }
.sk-w-50 { width: 12.5rem; }
.sk-w-60 { width: 15rem; }
.sk-w-70 { width: 17.5rem; }
.sk-w-80 { width: 20rem; }
.sk-w-90 { width: 22.5rem; }

.sk-h-5 { height: 1.25rem; }
.sk-h-6 { height: 1.5rem; }
.sk-h-16 { height: 4rem; }
.sk-h-32 { height: 8rem; }

.sk-header {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid #e2e8f0;
	margin-bottom: 1.5rem;
}
.sk-logo {
	width: 4.5rem;
	height: 4.5rem;
	background: #e2e8f0;
	border-radius: 50%;
	flex-shrink: 0;
}
.sk-header-lines {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
}
.sk-line {
	height: 0.75rem;
	background: #e2e8f0;
	border-radius: 4px;
}
.sk-title-block {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
}
.sk-card {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
}
</style>
