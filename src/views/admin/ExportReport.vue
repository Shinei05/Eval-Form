<script setup>
import { ref, computed, onMounted } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRoute } from "vue-router";
import API from "../../utils/api";
import { useApi } from "../../composables/useApi";
import depedLogo from "../../assets/DepEd-Logo.png";
import bagongPinasLogo from "../../assets/bagongpinas.png";
import jlgisLogo from "../../assets/JLGISlogo.png";
import {
	ArrowLeft,
	FileText,
	School,
	Users,
	Layers,
	Download,
	Loader2,
	X,
	ChevronRight,
	ChevronLeft,
	Quote
} from "@lucide/vue";

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
const isExporting = ref(false);

const stats = ref({
	studentCount: 0,
	peerCount: 0,
	totalCount: 0,
	studentAvg: 0,
	peerAvg: 0,
	combinedAvg: 0
});

const reportDate = ref("");

// Interactive Page navigation states (1 = Breakdown, 2 = Comments)
const studentDocPage = ref(1);
const peerDocPage = ref(1);

// References for PDF rendering
const studentPage1Ref = ref(null);
const studentPage2Ref = ref(null);
const peerPage1Ref = ref(null);
const peerPage2Ref = ref(null);

// Normalized comments lists
const studentCommentsList = computed(() => {
	return (studentEvals.value || []).map((e, idx) => ({
		id: `student-eval-${idx}`,
		index: idx + 1,
		avg: Number(e.avg) || 0,
		sentiment: e.sentiment || "Average",
		feedback: (e.feedback || "").trim(),
		created_at: e.created_at,
	}));
});

const peerCommentsList = computed(() => {
	return (peerEvals.value || []).map((e, idx) => ({
		id: `peer-eval-${idx}`,
		index: idx + 1,
		avg: Number(e.avg) || 0,
		sentiment: e.sentiment || "Average",
		feedback: (e.feedback || "").trim(),
		created_at: e.created_at,
	}));
});

// Format rating levels based on numeric score
function getAdjectivalRating(score) {
	const s = Number(score) || 0;
	if (s === 0) return "N/A";
	if (s >= 4.5) return "Outstanding (Very Evident)";
	if (s >= 3.5) return "Very Satisfactory";
	if (s >= 2.5) return "Satisfactory (Sometimes Evident)";
	if (s >= 1.5) return "Unsatisfactory";
	return "Poor (Not Evident)";
}

function getRatingBadge(score) {
	const s = Number(score) || 0;
	if (s >= 4.5) return "Outstanding";
	if (s >= 3.5) return "Very Satisfactory";
	if (s >= 2.5) return "Satisfactory";
	if (s >= 1.5) return "Unsatisfactory";
	return "Poor";
}

function formatDate(iso) {
	if (!iso) return "N/A";
	try {
		const d = new Date(iso);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch (e) {
		return iso;
	}
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
	isExporting.value = true;

	const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "legal" });
	const pageWidth  = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();

	const origStudentPage = studentDocPage.value;
	const origPeerPage = peerDocPage.value;

	const captureTasks = [];

	if (target === "student" || target === "both") {
		captureTasks.push({
			setPages: () => { studentDocPage.value = 1; },
			getEl: () => studentPage1Ref.value,
		});
		captureTasks.push({
			setPages: () => { studentDocPage.value = 2; },
			getEl: () => studentPage2Ref.value,
		});
	}

	if (target === "peer" || target === "both") {
		captureTasks.push({
			setPages: () => { peerDocPage.value = 1; },
			getEl: () => peerPage1Ref.value,
		});
		captureTasks.push({
			setPages: () => { peerDocPage.value = 2; },
			getEl: () => peerPage2Ref.value,
		});
	}

	try {
		for (let i = 0; i < captureTasks.length; i++) {
			captureTasks[i].setPages();
			await new Promise((r) => setTimeout(r, 120));
			await document.fonts.ready;

			const el = captureTasks[i].getEl();
			if (!el) continue;

			const canvas = await html2canvas(el, {
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
	} catch (err) {
		console.error("Export PDF error:", err);
	} finally {
		isExporting.value = false;
		studentDocPage.value = origStudentPage;
		peerDocPage.value = origPeerPage;
		exportLoading.value = null;
	}
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
	<div class="export-report-container" :class="{ 'is-exporting': isExporting }">
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
					<!-- Interactive Document Header & Page Navigation -->
					<div class="doc-label no-print student-label">
						<div class="doc-label-left">
							<span class="doc-label-dot" style="background:#3b82f6"></span>
							Student Evaluation Document
						</div>
						<div class="page-nav-pills">
							<button
								type="button"
								class="page-nav-btn"
								:class="{ active: studentDocPage === 1 }"
								@click="studentDocPage = 1"
							>
								Page 1: Ratings
							</button>
							<button
								type="button"
								class="page-nav-btn next-btn"
								:class="{ active: studentDocPage === 2 }"
								@click="studentDocPage = 2"
							>
								Page 2: Comments (Next →)
							</button>
						</div>
					</div>

					<!-- Student Doc Page 1: Ratings Breakdown -->
					<div v-show="studentDocPage === 1" class="a4-page" ref="studentPage1Ref" data-pdf-page>
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
							<p class="subtitle">Student Evaluation Performance Summary &nbsp;·&nbsp; Page 1 &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Executive Profile & Summary Overview Box -->
						<div class="executive-summary-box">
							<div class="summary-meta-grid">
								<div class="meta-cell">
									<span class="cell-label">Faculty Name</span>
									<span class="cell-value font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Subject / Dept</span>
									<span class="cell-value">{{ teacher.subject_name || 'General' }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Institutional Email</span>
									<span class="cell-value">{{ teacher.email }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Evaluation Period</span>
									<span class="cell-value font-semibold">Quarter {{ teacher.quarter }} &bull; SY {{ teacher.year }}</span>
								</div>
							</div>

							<div class="summary-score-callout">
								<div class="score-callout-top">
									<span class="callout-title">Overall Student Rating</span>
									<span class="callout-respondents">{{ stats.studentCount }} Respondents</span>
								</div>
								<div class="score-callout-number">
									<span class="score-num">{{ stats.studentAvg ? stats.studentAvg.toFixed(2) : '0.00' }}</span>
									<span class="score-max">/ 5.00</span>
								</div>
								<div class="score-callout-tier">
									{{ getAdjectivalRating(stats.studentAvg) }}
								</div>
							</div>
						</div>

						<!-- Structured Category Breakdown Table -->
						<section class="info-section">
							<h3 class="section-heading">Category Rating Breakdown</h3>
							<div v-if="studentCategories.length === 0" class="no-data-msg">No student evaluations recorded.</div>
							<table v-else class="eval-data-table">
								<thead>
									<tr>
										<th class="col-num">#</th>
										<th class="col-domain">Performance Domain / Indicator</th>
										<th class="col-score">Mean Score</th>
										<th class="col-rating">Adjectival Rating</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(cat, idx) in studentCategories" :key="cat.header">
										<td class="col-num">{{ String(idx + 1).padStart(2, '0') }}</td>
										<td class="col-domain">
											<span class="domain-text">{{ cat.header }}</span>
										</td>
										<td class="col-score font-bold">
											{{ Number(cat.avg_score).toFixed(2) }} <span class="score-sub">/ 5.00</span>
										</td>
										<td class="col-rating">
											<span class="rating-pill">{{ getRatingBadge(cat.avg_score) }}</span>
										</td>
									</tr>
								</tbody>
								<tfoot>
									<tr class="tfoot-summary">
										<td colspan="2" class="summary-label font-bold">OVERALL COMPOSITE STUDENT EVALUATION RATING</td>
										<td class="col-score font-bold summary-score">{{ stats.studentAvg ? stats.studentAvg.toFixed(2) : '0.00' }} <span class="score-sub">/ 5.00</span></td>
										<td class="col-rating font-bold summary-rating">{{ getRatingBadge(stats.studentAvg) }}</td>
									</tr>
								</tfoot>
							</table>
						</section>

						<!-- Page Flip CTA -->
						<div class="page-flip-row no-print">
							<button type="button" @click="studentDocPage = 2" class="btn-page-flip">
								<span>Next: View Student Comments (Page 2)</span>
								<ChevronRight class="h-4 w-4" />
							</button>
						</div>

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

					<!-- Student Doc Page 2: Comments & Feedback -->
					<div v-show="studentDocPage === 2" class="a4-page" ref="studentPage2Ref" data-pdf-page>
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
							<h2>TEACHER EVALUATION COMMENTS &amp; FEEDBACK REPORT</h2>
							<p class="subtitle">Student Feedback &amp; Qualitative Remarks &nbsp;·&nbsp; Page 2 &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Executive Profile & Feedback Summary Box -->
						<div class="executive-summary-box">
							<div class="summary-meta-grid">
								<div class="meta-cell">
									<span class="cell-label">Faculty Name</span>
									<span class="cell-value font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Subject / Dept</span>
									<span class="cell-value">{{ teacher.subject_name || 'General' }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Evaluation Period</span>
									<span class="cell-value font-semibold">Quarter {{ teacher.quarter }} &bull; SY {{ teacher.year }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Comments Submitted</span>
									<span class="cell-value font-semibold">{{ studentCommentsList.filter(c => c.feedback).length }} Feedback Submissions</span>
								</div>
							</div>

							<div class="summary-score-callout">
								<div class="score-callout-top">
									<span class="callout-title">Composite Student Score</span>
									<span class="callout-respondents">{{ stats.studentCount }} Evaluators</span>
								</div>
								<div class="score-callout-number">
									<span class="score-num">{{ stats.studentAvg ? stats.studentAvg.toFixed(2) : '0.00' }}</span>
									<span class="score-max">/ 5.00</span>
								</div>
								<div class="score-callout-tier">
									{{ getAdjectivalRating(stats.studentAvg) }}
								</div>
							</div>
						</div>

						<!-- Comments List Section -->
						<section class="info-section comments-section-body">
							<h3 class="section-heading">Student Feedback &amp; Qualitative Notes Register</h3>
							<div v-if="studentCommentsList.length === 0" class="no-data-msg">
								No student comments or feedback recorded for this evaluation period.
							</div>
							<div v-else class="comments-log-container">
								<div
									v-for="(c, idx) in studentCommentsList"
									:key="c.id"
									class="comment-log-card"
								>
									<div class="comment-log-header">
										<div class="comment-idx-wrap">
											<span class="comment-idx">#{{ String(idx + 1).padStart(2, '0') }}</span>
											<span class="comment-source-tag">Student Evaluator</span>
										</div>
										<div class="comment-meta-badges">
											<span class="comment-score-badge">
												Rating: <strong>{{ c.avg.toFixed(2) }}</strong>
											</span>
											<span class="comment-sentiment-badge">
												{{ c.sentiment }}
											</span>
											<span class="comment-date">{{ formatDate(c.created_at) }}</span>
										</div>
									</div>
									<div class="comment-log-body">
										<p v-if="c.feedback" class="comment-text">"{{ c.feedback }}"</p>
										<p v-else class="comment-empty-text">(No additional written remarks provided.)</p>
									</div>
								</div>
							</div>
						</section>

						<!-- Page Flip CTA -->
						<div class="page-flip-row no-print">
							<button type="button" @click="studentDocPage = 1" class="btn-page-flip btn-prev">
								<ChevronLeft class="h-4 w-4" />
								<span>Back: View Ratings Breakdown (Page 1)</span>
							</button>
						</div>

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
				</div> <!-- /doc-column 1 -->

				<!-- ── Doc 2: Peer / Teacher Evaluation Document ────── -->
				<div class="doc-column">
					<!-- Interactive Document Header & Page Navigation -->
					<div class="doc-label no-print peer-label">
						<div class="doc-label-left">
							<span class="doc-label-dot" style="background:#10b981"></span>
							Peer / Teacher Evaluation
						</div>
						<div class="page-nav-pills">
							<button
								type="button"
								class="page-nav-btn"
								:class="{ active: peerDocPage === 1 }"
								@click="peerDocPage = 1"
							>
								Page 1: Ratings
							</button>
							<button
								type="button"
								class="page-nav-btn next-btn"
								:class="{ active: peerDocPage === 2 }"
								@click="peerDocPage = 2"
							>
								Page 2: Comments (Next →)
							</button>
						</div>
					</div>

					<!-- Peer Doc Page 1: Ratings Breakdown -->
					<div v-show="peerDocPage === 1" class="a4-page" ref="peerPage1Ref" data-pdf-page>
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
							<p class="subtitle">Colleague Peer Evaluation Summary &nbsp;·&nbsp; Page 1 &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Executive Profile & Summary Overview Box -->
						<div class="executive-summary-box">
							<div class="summary-meta-grid">
								<div class="meta-cell">
									<span class="cell-label">Faculty Name</span>
									<span class="cell-value font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Subject / Dept</span>
									<span class="cell-value">{{ teacher.subject_name || 'General' }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Institutional Email</span>
									<span class="cell-value">{{ teacher.email }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Evaluation Period</span>
									<span class="cell-value font-semibold">Quarter {{ teacher.quarter }} &bull; SY {{ teacher.year }}</span>
								</div>
							</div>

							<div class="summary-score-callout">
								<div class="score-callout-top">
									<span class="callout-title">Overall Peer Rating</span>
									<span class="callout-respondents">{{ stats.peerCount }} Respondents</span>
								</div>
								<div class="score-callout-number">
									<span class="score-num">{{ stats.peerAvg ? stats.peerAvg.toFixed(2) : '0.00' }}</span>
									<span class="score-max">/ 5.00</span>
								</div>
								<div class="score-callout-tier">
									{{ getAdjectivalRating(stats.peerAvg) }}
								</div>
							</div>
						</div>

						<!-- Structured Category Breakdown Table -->
						<section class="info-section">
							<h3 class="section-heading">Category Rating Breakdown</h3>
							<div v-if="peerCategories.length === 0" class="no-data-msg">No peer/teacher evaluations recorded.</div>
							<table v-else class="eval-data-table">
								<thead>
									<tr>
										<th class="col-num">#</th>
										<th class="col-domain">Performance Domain / Indicator</th>
										<th class="col-score">Mean Score</th>
										<th class="col-rating">Adjectival Rating</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(cat, idx) in peerCategories" :key="cat.header">
										<td class="col-num">{{ String(idx + 1).padStart(2, '0') }}</td>
										<td class="col-domain">
											<span class="domain-text">{{ cat.header }}</span>
										</td>
										<td class="col-score font-bold">
											{{ Number(cat.avg_score).toFixed(2) }} <span class="score-sub">/ 5.00</span>
										</td>
										<td class="col-rating">
											<span class="rating-pill">{{ getRatingBadge(cat.avg_score) }}</span>
										</td>
									</tr>
								</tbody>
								<tfoot>
									<tr class="tfoot-summary">
										<td colspan="2" class="summary-label font-bold">OVERALL COMPOSITE PEER EVALUATION RATING</td>
										<td class="col-score font-bold summary-score">{{ stats.peerAvg ? stats.peerAvg.toFixed(2) : '0.00' }} <span class="score-sub">/ 5.00</span></td>
										<td class="col-rating font-bold summary-rating">{{ getRatingBadge(stats.peerAvg) }}</td>
									</tr>
								</tfoot>
							</table>
						</section>

						<!-- Page Flip CTA -->
						<div class="page-flip-row no-print">
							<button type="button" @click="peerDocPage = 2" class="btn-page-flip">
								<span>Next: View Peer Comments (Page 2)</span>
								<ChevronRight class="h-4 w-4" />
							</button>
						</div>

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

					<!-- Peer Doc Page 2: Comments & Feedback -->
					<div v-show="peerDocPage === 2" class="a4-page" ref="peerPage2Ref" data-pdf-page>
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
							<h2>PEER / TEACHER EVALUATION COMMENTS &amp; FEEDBACK REPORT</h2>
							<p class="subtitle">Peer Feedback &amp; Colleague Remarks &nbsp;·&nbsp; Page 2 &nbsp;·&nbsp; Generated on {{ reportDate }}</p>
						</div>

						<!-- Executive Profile & Feedback Summary Box -->
						<div class="executive-summary-box">
							<div class="summary-meta-grid">
								<div class="meta-cell">
									<span class="cell-label">Faculty Name</span>
									<span class="cell-value font-bold">{{ teacher.firstname }} {{ teacher.lastname }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Subject / Dept</span>
									<span class="cell-value">{{ teacher.subject_name || 'General' }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Evaluation Period</span>
									<span class="cell-value font-semibold">Quarter {{ teacher.quarter }} &bull; SY {{ teacher.year }}</span>
								</div>
								<div class="meta-cell">
									<span class="cell-label">Comments Submitted</span>
									<span class="cell-value font-semibold">{{ peerCommentsList.filter(c => c.feedback).length }} Feedback Submissions</span>
								</div>
							</div>

							<div class="summary-score-callout">
								<div class="score-callout-top">
									<span class="callout-title">Composite Peer Score</span>
									<span class="callout-respondents">{{ stats.peerCount }} Evaluators</span>
								</div>
								<div class="score-callout-number">
									<span class="score-num">{{ stats.peerAvg ? stats.peerAvg.toFixed(2) : '0.00' }}</span>
									<span class="score-max">/ 5.00</span>
								</div>
								<div class="score-callout-tier">
									{{ getAdjectivalRating(stats.peerAvg) }}
								</div>
							</div>
						</div>

						<!-- Comments List Section -->
						<section class="info-section comments-section-body">
							<h3 class="section-heading">Peer / Teacher Feedback &amp; Qualitative Notes Register</h3>
							<div v-if="peerCommentsList.length === 0" class="no-data-msg">
								No peer comments or feedback recorded for this evaluation period.
							</div>
							<div v-else class="comments-log-container">
								<div
									v-for="(c, idx) in peerCommentsList"
									:key="c.id"
									class="comment-log-card"
								>
									<div class="comment-log-header">
										<div class="comment-idx-wrap">
											<span class="comment-idx">#{{ String(idx + 1).padStart(2, '0') }}</span>
											<span class="comment-source-tag">Peer Evaluator</span>
										</div>
										<div class="comment-meta-badges">
											<span class="comment-score-badge">
												Rating: <strong>{{ c.avg.toFixed(2) }}</strong>
											</span>
											<span class="comment-sentiment-badge">
												{{ c.sentiment }}
											</span>
											<span class="comment-date">{{ formatDate(c.created_at) }}</span>
										</div>
									</div>
									<div class="comment-log-body">
										<p v-if="c.feedback" class="comment-text">"{{ c.feedback }}"</p>
										<p v-else class="comment-empty-text">(No additional written remarks provided.)</p>
									</div>
								</div>
							</div>
						</section>

						<!-- Page Flip CTA -->
						<div class="page-flip-row no-print">
							<button type="button" @click="peerDocPage = 1" class="btn-page-flip btn-prev">
								<ChevronLeft class="h-4 w-4" />
								<span>Back: View Ratings Breakdown (Page 1)</span>
							</button>
						</div>

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
							<p class="export-modal-sub">Select which multi-page document format you want to download:</p>

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
										<strong>Student Evaluation (2 Pages)</strong>
										<small>Page 1: Performance table &bull; Page 2: Student feedback</small>
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
										<strong>Peer / Teacher Evaluation (2 Pages)</strong>
										<small>Page 1: Performance table &bull; Page 2: Peer feedback</small>
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
										<strong>Export Both Documents (4 Pages)</strong>
										<small>Complete multi-page Legal PDF package with all ratings &amp; comments</small>
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

/* ── Hidden elements during HTML2Canvas PDF Export ──── */
.is-exporting .no-print,
.is-exporting .page-flip-row,
.is-exporting .toolbar,
.is-exporting .page-nav-pills {
	display: none !important;
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

/* ── Legal Page Layout ─────────────────────────────────── */
.a4-page {
	width: 215.9mm;
	min-height: 355.6mm;
	background: #ffffff;
	box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
	border: 1px solid #cbd5e1;
	padding: 15mm 18mm;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

/* ── Letterhead Header ──────────────────────────────── */
.doc-header {
	display: flex;
	align-items: center;
	gap: 1.25rem;
	padding-bottom: 0.85rem;
	border-bottom: 2px solid #0f172a;
	margin-bottom: 1.15rem;
}

.logo-box {
	width: 4.2rem;
	height: 4.2rem;
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
	font-size: 0.78rem;
	color: #475569;
}
.line-md {
	font-size: 0.88rem;
	font-weight: 600;
	color: #1e293b;
}
.line-lg {
	font-size: 0.92rem;
	font-weight: 700;
	letter-spacing: 0.3px;
	color: #0f172a;
}
.line-school {
	font-size: 1.05rem;
	font-weight: 800;
	letter-spacing: 0.5px;
	color: #0f172a;
}

/* ── Report Title Section ──────────────────────────── */
.report-title-section {
	text-align: center;
	margin-bottom: 1.15rem;
}
.report-title-section h2 {
	margin: 0;
	font-size: 1.1rem;
	font-weight: 800;
	letter-spacing: 0.5px;
	color: #0f172a;
}
.subtitle {
	margin: 0.3rem 0 0 0;
	font-size: 0.78rem;
	color: #64748b;
	font-weight: 500;
}

/* ── Executive Summary Overview Box ───────────────── */
.executive-summary-box {
	display: grid;
	grid-template-columns: 1.35fr 0.85fr;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: #ffffff;
	margin-bottom: 1.15rem;
	overflow: hidden;
}

.summary-meta-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 0.75rem 0.95rem;
	gap: 0.6rem 0.85rem;
	background: #f8fafc;
	border-right: 1px solid #cbd5e1;
}

.meta-cell {
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
}
.cell-label {
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: #64748b;
}
.cell-value {
	font-size: 0.78rem;
	color: #0f172a;
	word-break: break-word;
	overflow-wrap: anywhere;
	line-height: 1.25;
}
.font-bold {
	font-weight: 700;
}
.font-semibold {
	font-weight: 600;
}

.summary-score-callout {
	padding: 0.75rem 1rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	background: #ffffff;
}
.score-callout-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-bottom: 0.2rem;
}
.callout-title {
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #475569;
}
.callout-respondents {
	font-size: 0.65rem;
	font-weight: 600;
	color: #64748b;
	background: #f1f5f9;
	padding: 0.1rem 0.4rem;
	border-radius: 4px;
}
.score-callout-number {
	display: flex;
	align-items: baseline;
	gap: 0.25rem;
	margin: 0.15rem 0;
}
.score-num {
	font-size: 2rem;
	font-weight: 900;
	color: #0f172a;
	line-height: 1;
}
.score-max {
	font-size: 0.85rem;
	font-weight: 600;
	color: #64748b;
}
.score-callout-tier {
	font-size: 0.72rem;
	font-weight: 700;
	color: #334155;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	padding: 0.15rem 0.6rem;
	border-radius: 4px;
	margin-top: 0.2rem;
}

/* ── Section Headings ──────────────────────────────── */
.info-section {
	margin-bottom: 0.85rem;
	flex: 1;
}
.section-heading {
	font-size: 0.72rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
	border-bottom: 1.5px solid #0f172a;
	padding-bottom: 0.25rem;
}

/* ── Clean Evaluation Data Table ───────────────────── */
.eval-data-table {
	width: 100%;
	border-collapse: collapse;
	border: 1px solid #cbd5e1;
	font-size: 0.76rem;
}
.eval-data-table thead tr {
	background: #0f172a;
	color: #ffffff;
}
.eval-data-table th {
	padding: 0.5rem 0.65rem;
	font-weight: 700;
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	border: 1px solid #334155;
	text-align: left;
}
.eval-data-table td {
	padding: 0.48rem 0.65rem;
	border: 1px solid #e2e8f0;
	color: #1e293b;
	vertical-align: middle;
}
.eval-data-table tbody tr:nth-child(even) {
	background: #f8fafc;
}
.col-num {
	width: 6%;
	text-align: center;
	font-weight: 700;
	color: #64748b;
}
.col-domain {
	width: 58%;
	font-weight: 600;
	color: #0f172a;
	line-height: 1.35;
}
.col-score {
	width: 18%;
	text-align: center;
	font-size: 0.78rem;
}
.score-sub {
	font-size: 0.68rem;
	font-weight: 500;
	color: #64748b;
}
.col-rating {
	width: 18%;
	text-align: center;
}
.rating-pill {
	display: inline-block;
	font-size: 0.68rem;
	font-weight: 700;
	color: #334155;
	background: #f1f5f9;
	border: 1px solid #cbd5e1;
	padding: 0.15rem 0.45rem;
	border-radius: 4px;
}
.tfoot-summary {
	background: #f1f5f9;
	border-top: 2px solid #0f172a;
}
.summary-label {
	padding: 0.55rem 0.65rem;
	font-size: 0.72rem;
	letter-spacing: 0.4px;
	color: #0f172a;
}
.summary-score {
	font-size: 0.82rem;
	color: #0f172a;
}
.summary-rating {
	font-size: 0.72rem;
	color: #0f172a;
}

/* ── Comments Log Section (Page 2) ─────────────────── */
.comments-log-container {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	max-height: 165mm;
	overflow-y: auto;
	padding-right: 0.25rem;
}
.is-exporting .comments-log-container {
	max-height: none !important;
	overflow: visible !important;
	padding-right: 0 !important;
}
.comment-log-card {
	background: #ffffff;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	padding: 0.55rem 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}
.comment-log-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	border-bottom: 1px solid #f1f5f9;
	padding-bottom: 0.25rem;
}
.comment-idx-wrap {
	display: flex;
	align-items: center;
	gap: 0.35rem;
}
.comment-idx {
	font-size: 0.72rem;
	font-weight: 800;
	color: #0f172a;
}
.comment-source-tag {
	font-size: 0.65rem;
	font-weight: 700;
	color: #475569;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	padding: 0.1rem 0.4rem;
	border-radius: 3px;
}
.comment-meta-badges {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}
.comment-score-badge {
	font-size: 0.68rem;
	font-weight: 600;
	color: #334155;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	padding: 0.1rem 0.4rem;
	border-radius: 3px;
}
.comment-score-badge strong {
	font-weight: 800;
	color: #0f172a;
}
.comment-sentiment-badge {
	font-size: 0.65rem;
	font-weight: 700;
	color: #334155;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	padding: 0.1rem 0.4rem;
	border-radius: 3px;
}
.comment-date {
	font-size: 0.68rem;
	color: #64748b;
	font-weight: 500;
	white-space: nowrap;
}
.comment-log-body {
	padding-left: 0.5rem;
	border-left: 2.5px solid #cbd5e1;
	margin: 0.15rem 0;
}
.comment-text {
	margin: 0;
	font-size: 0.76rem;
	line-height: 1.4;
	color: #1e293b;
	font-style: italic;
	word-break: break-word;
	overflow-wrap: break-word;
}
.comment-empty-text {
	margin: 0;
	font-size: 0.72rem;
	color: #94a3b8;
	font-style: italic;
}

/* ── Page Flip CTA ─────────────────────────────────── */
.page-flip-row {
	display: flex;
	justify-content: center;
	margin-top: 0.75rem;
	margin-bottom: 0.75rem;
}
.btn-page-flip {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	background: #ffffff;
	border: 1px solid #cbd5e1;
	color: #334155;
	padding: 0.4rem 0.9rem;
	border-radius: 6px;
	font-size: 0.76rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
}
.btn-page-flip:hover {
	background: #f8fafc;
	border-color: #94a3b8;
	color: #0f172a;
}
.btn-page-flip.btn-prev {
	color: #475569;
}

.no-data-msg {
	text-align: center;
	padding: 1.5rem;
	color: #94a3b8;
	font-size: 0.85rem;
	background: #f8fafc;
	border-radius: 6px;
	border: 1px dashed #cbd5e1;
}

/* ── Signatures Section ────────────────────────────── */
.signature-section {
	display: flex;
	justify-content: space-between;
	margin-top: auto;
	padding-top: 1.25rem;
}
.sig-col {
	width: 42%;
	text-align: center;
}
.sig-line {
	border-bottom: 1.5px solid #0f172a;
	margin-bottom: 0.35rem;
}
.sig-label {
	margin: 0;
	font-size: 0.76rem;
	font-weight: 700;
	color: #0f172a;
}

/* ── Document Footer ───────────────────────────────── */
.doc-footer {
	display: flex;
	align-items: center;
	gap: 1rem;
	border-top: 1px solid #cbd5e1;
	padding-top: 0.65rem;
	margin-top: 0.85rem;
}
.footer-logo {
	width: 2.2rem;
	height: 2.2rem;
	flex-shrink: 0;
}
.footer-logo img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}
.footer-lines {
	flex: 1;
}
.footer-lines p {
	margin: 0;
	font-size: 0.64rem;
	line-height: 1.35;
	color: #475569;
}

/* ── Loading / Error States ────────────────────────── */
.loading-state,
.error-state {
	min-height: 80vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.spinner {
	width: 3rem;
	height: 3rem;
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
	padding: 2rem 3rem;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	text-align: center;
	max-width: 400px;
}
.btn-retry {
	background: #4f46e5;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	margin-top: 1rem;
	display: inline-block;
}
.btn-link-back {
	display: block;
	margin-top: 0.75rem;
	color: #64748b;
	font-size: 0.85rem;
	text-decoration: none;
}

/* ── Two Document Columns Side by Side ─────────────── */
.pages-row {
	display: flex;
	flex-direction: row;
	gap: 2rem;
	align-items: flex-start;
	justify-content: center;
	width: 100%;
}
.doc-column {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.doc-label {
	width: 215.9mm;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.75rem;
	padding: 0 0.5rem;
	box-sizing: border-box;
}
.doc-label-left {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 700;
	font-size: 0.88rem;
}
.student-label .doc-label-left {
	color: #1d4ed8;
}
.peer-label .doc-label-left {
	color: #047857;
}
.doc-label-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	display: inline-block;
}

.page-nav-pills {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	padding: 0.2rem;
	border-radius: 9999px;
	box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.page-nav-btn {
	border: none;
	background: transparent;
	padding: 0.3rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 700;
	color: #64748b;
	cursor: pointer;
	transition: all 0.15s ease-in-out;
}
.page-nav-btn:hover {
	color: #1e293b;
	background: #f1f5f9;
}
.student-label .page-nav-btn.active {
	background: #2563eb;
	color: #ffffff;
	box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}
.peer-label .page-nav-btn.active {
	background: #059669;
	color: #ffffff;
	box-shadow: 0 1px 3px rgba(5, 150, 105, 0.3);
}

/* ── Export Modal ──────────────────────────────────── */
.export-modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: 1rem;
}
.export-modal-card {
	position: relative;
	background: #ffffff;
	border-radius: 16px;
	padding: 2rem;
	max-width: 480px;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1);
	text-align: center;
}
.export-modal-close {
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: #f1f5f9;
	border: none;
	border-radius: 50%;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}
.export-modal-close:hover {
	background: #e2e8f0;
	color: #0f172a;
}
.export-modal-icon {
	width: 3.5rem;
	height: 3.5rem;
	background: #e0e7ff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
}
.export-modal-title {
	margin: 0 0 0.35rem;
	font-size: 1.2rem;
	font-weight: 800;
	color: #0f172a;
}
.export-modal-sub {
	margin: 0 0 1.5rem;
	font-size: 0.85rem;
	color: #64748b;
}
.export-options {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
}
.export-option {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.85rem 1rem;
	border-radius: 10px;
	border: 1.5px solid #e2e8f0;
	background: #ffffff;
	cursor: pointer;
	text-align: left;
	transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
.export-option:hover:not(:disabled) {
	transform: translateY(-1px);
}
.export-option:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.student-opt:hover:not(:disabled) {
	border-color: #3b82f6;
	background: #eff6ff;
}
.peer-opt:hover:not(:disabled) {
	border-color: #10b981;
	background: #ecfdf5;
}
.both-opt:hover:not(:disabled) {
	border-color: #6366f1;
	background: #eef2ff;
}
.export-opt-icon-wrap {
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.export-opt-text strong {
	display: block;
	font-size: 0.9rem;
	color: #0f172a;
}
.export-opt-text small {
	display: block;
	font-size: 0.75rem;
	color: #64748b;
	margin-top: 0.15rem;
}
.export-cancel {
	background: transparent;
	border: none;
	color: #94a3b8;
	font-size: 0.85rem;
	cursor: pointer;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
}
.export-cancel:hover {
	color: #475569;
}
</style>
