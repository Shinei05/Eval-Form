<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import API from "../../utils/api";
import { useApi } from "../../composables/useApi";
import depedLogo from "../../assets/DepEd-Logo.png";
import bagongPinasLogo from "../../assets/bagongpinas.png";
import jlgisLogo from "../../assets/JLGISlogo.png";

/* ── props ────────────────────────────────────────────── */
const props = defineProps({
	type: {
		type: String,
		required: true,
		validator: (v) => ["student", "teacher"].includes(v),
	},
	mode: {
		type: String,
		default: "individual",
		validator: (v) => ["individual", "merge"].includes(v),
	},
});

const route = useRoute();
const { request } = useApi();

/* ── state ────────────────────────────────────────────── */
const isLoading = ref(true);
const headers = ref([]);
const answers = ref({});
const teacher = ref({});
const evaluator = ref({});
const evalDate = ref("");
const feedback = ref("");

/* ── endpoint map by type + mode ──────────────────────── */
const questionsUrl =
	props.type === "student"
		? API.questionsStudentAll
		: API.questionsTeacherAll;
const answersUrl =
	props.mode === "individual"
		? props.type === "student"
			? API.evalAnswersStudent
			: API.evalAnswersTeacher
		: props.type === "student"
			? API.evalMergeStudent
			: API.evalMergeTeacher;
const evaluatorUrl =
	props.type === "student" ? API.studentGetById : API.studentGetEvaluator;

/* ── rating scale (same on result printout for both) ──── */
const ratingScale = [
	{ rating: 5, en: "Very Evident", fil: "Palagiang Nakikita" },
	{ rating: 3, en: "Sometimes Evident", fil: "Paminsan-minsang Nakikita" },
	{ rating: 1, en: "Not Evident", fil: "Hindi Nakikita" },
];

/* ── data fetching ────────────────────────────────────── */
async function fetchQuestions() {
	const res = await request(questionsUrl, {
		body: {
			action:
				props.type === "student"
					? "getQuestions"
					: "getTeacherQuestions",
		},
	});
	if (res?.success) headers.value = res.headers;
}

async function fetchTeacher() {
	const res = await request(API.teacherGetById, {
		body: {
			action: "getteacherbyid",
			id: route.params.tcrid,
		},
	});
	if (res?.success) teacher.value = res.teacher;
}

async function fetchAnswers() {
	if (props.mode === "individual") {
		const res = await request(answersUrl, {
			body: {
				action: props.type === "student" ? "ansGetter" : "antGetter",
				id: route.params.id,
				evt: route.params.evtid,
				tcr: route.params.tcrid,
			},
		});
		if (res?.success) {
			const session = Object.values(res.answer)[0];
			evalDate.value = session.time;
			feedback.value = session.feedback || "";
			answers.value = {};
			for (const a of session.answer) {
				answers.value[Number(a.question_id)] = a.score;
			}
		}
	} else {
		const res = await request(answersUrl, {
			body: {
				action: props.type === "student" ? "student" : "teacher",
				tcr: route.params.tcrid,
			},
		});
		if (res?.success) {
			const merged = res.merged || res.answer || [];
			answers.value = {};
			for (const a of merged) {
				answers.value[Number(a.question_id)] = Number(
					Number(a.score).toFixed(1),
				);
			}
		}
	}
}

async function fetchEvaluator() {
	const res = await request(evaluatorUrl, {
		body: {
			action: "getstudentbyid",
			id: route.params.evtid,
		},
	});
	if (res?.success) evaluator.value = res.student || res.teacher || {};
}

function handlePrint() {
	window.print();
}

onMounted(async () => {
	isLoading.value = true;
	await Promise.all([
		fetchQuestions(),
		fetchTeacher(),
		fetchAnswers(),
		fetchEvaluator(),
	]);
	if (!evalDate.value) {
		const now = new Date();
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		evalDate.value = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
	}
	isLoading.value = false;
});

// Maps each question_id (DB PK) → its 1-based sequential position across all headers.
// The teacherTagalogTranslations object is keyed 1–34 by order, not by DB primary key.
const questionSequenceMap = computed(() => {
	const map = {};
	let seq = 1;
	for (const h of headers.value) {
		for (const q of h.questions || []) {
			map[q.question_id] = seq++;
		}
	}
	return map;
});

const teacherTagalogTranslations = {
	1: "(Maagang Pag-uulat sa Trabaho at Klase — Palaging dumarating sa tamang oras para sa klase, pulong, at iba pang pangakong propesyonal.)",
	2: "(Pagdalo sa Klase at Pagiging Available — Regular na dumadalo sa nakatakdang klase at oras ng opisina, pinapaliit ang mga hindi inaasahang pagliban.)",
	3: "(Pagsunod sa Iskedyul ng Institusyon — Sinusunod ang kalendaryong akademiko, nagpapasa ng mga kinakailangang dokumento sa tamang oras, at tumutupad sa mga deadline para sa pagmamarka at mga ulat.)",
	4: "(Maayos na Komunikasyon ng Pagliban — Inaabisuhan nang maaga ang administrasyon at mga mag-aaral kapag hindi maiiwasan ang pagliban at nag-aayos ng naaangkop na kapalit sa klase o make-up session.)",
	5: "(Paninindigan sa mga Propesyonal na Responsibilidad — Nagpapakita ng pagkamaaasahan sa pagdalo sa mga pulong ng guro, mga sesyon ng pagsasanay, at iba pang aktibidad ng institusyon.)",
	6: "(Paggalang at Pagiging Patas — Tinatrato ang mga mag-aaral, kasamahan, at mga magulang nang may paggalang, pagiging patas, at walang kinikilingan, anuman ang kanilang pinagmulan o personal na pagkakaiba.)",
	7: "(Pagiging Kompidensiyal at Integridad — Pinapanatili ang pagiging kompidensiyal sa paghawak ng mga talaan ng mag-aaral at sensitibong impormasyon, tinitiyak ang tiwala at etikal na responsibilidad.)",
	8: "(Propesyonalismo sa Komunikasyon — Nagpapakita ng propesyonalismo sa pasalita at pasulat na komunikasyon, gumagamit ng naaangkop na wika at tono sa pakikipag-ugnayan sa mga mag-aaral, kasamahan, at mga magulang.)",
	9: "(Pagsunod sa mga Patakaran ng Paaralan — Sumusunod sa mga patakaran ng institusyon, etikal na panuntunan, at propesyonal na pamantayan sa paggawa ng desisyon at pamamahala ng silid-aralan.)",
	10: "(Pagiging Mabuting Halimbawa sa Etikal na Pag-uugali — Nagsisilbing positibong huwaran sa pamamagitan ng pagtataguyod ng katapatan, pananagutan, at etikal na pag-uugali sa akademiko at propesyonal na mga sitwasyon.)",
	11: "(Pagtutulungan at Kooperasyon — Aktibong nakikibahagi sa mga pulong ng pangkat, aktibidad ng departamento, at mga inisyatiba ng paaralan na may positibo at nakikiisang saloobin.)",
	12: "(Paggalang sa mga Ideya ng Kasamahan — Nakikinig at nagpapahalaga sa mga pananaw at kontribusyon ng kapwa guro, nagpapalaganap ng kultura ng paggalang sa isa't isa.)",
	13: "(Kusang Magbahagi ng mga Mapagkukunan — Maluwag na nagbabahagi ng mga materyales sa pagtuturo, lesson plan, at magagandang kasanayan sa mga kasamahan upang mapabuti ang pangkalahatang pagiging epektibo sa pagtuturo.)",
	14: "(Nakabubuong Komunikasyon — Nakikilahok sa bukas at propesyonal na komunikasyon sa mga kasamahan, tinutugunan ang mga alalahanin o puna nang may paggalang.)",
	15: "(Suporta at Paghihikayat — Nagbibigay ng panghihikayat, paggabay, o tulong sa mga kasamahan kapag kinakailangan, lalo na sa bago o nahihirapang guro.)",
	16: "(Kolaborasyon para sa Tagumpay ng Mag-aaral — Nakikipagtulungan sa ibang guro upang bumuo ng mga estratehiya sa pagsuporta sa pagkatuto ng mag-aaral, kabilang ang mga cross-disciplinary project at interbensyon.)",
	17: "(Pakikilahok sa Propesyonal na Pag-unlad — Aktibong nakikibahagi sa mga propesyonal na komunidad ng pagkatuto, palihan, o mga sesyon ng pagsasanay upang sama-samang mapabuti ang mga kasanayan sa pagtuturo.)",
	18: "(Kasanayan sa Paglutas ng Salungatan — Pinangangasiwaan ang mga hindi pagkakasundo o magkakaibang pananaw nang propesyonal at naghahanap ng mga solusyon na nakabubuti sa pangkat at mga mag-aaral.)",
	19: "(Kakayahang Umangkop at Pagbabago — Kusang sumusunod sa mga pagbabago, tulad ng mga pagbabago sa iskedyul, mga bagong patakaran, o estratehiya sa pagtuturo, habang nagtatrabaho nang may pagkakasundo kasama ang mga katrabaho.)",
	20: "(Kontribusyon sa Kultura ng Paaralan — Nagpapakita ng dedikasyon sa pagpapalaganap ng positibo, nagtutulungan, at inklusibong kapaligiran ng paaralan sa pamamagitan ng pagiging madaling lapitan at mapagsuporta.)",
	21: "(Paglahok sa Propesyonal na Pag-unlad — Aktibong nakikibahagi sa mga seminar, palihan, kumperensya, o iba pang pagkakataon sa pagsasanay kaugnay ng pagtuturo at pananaliksik.)",
	22: "(Kusang Tumanggap at Maglapat ng Puna — Tumatanggap ng nakabubuong kritisismo at gumagawa ng mga kinakailangang pagpapabuti batay sa puna mula sa mga kapwa, mag-aaral, at tagapamahala.)",
	23: "(Kolaborasyon sa mga Kasamahan — Aktibong nakikibahagi sa mga propesyonal na talakayan, pagtuturo bilang pangkat, at mga inisyatiba sa pagbabahagi ng kaalaman kasama ang kapwa guro.)",
	24: "(Pakikilahok sa mga Inisyatiba ng Pag-aaral ng Institusyon at Komunidad — Nakikilahok sa mga komunidad ng pag-aaral ng guro, pagpapaunlad ng kurikulum, o mga programa sa edukasyon na nakabatay sa komunidad.)",
	25: "(Paggabay at Pagtuturo — Sinusuportahan ang propesyonal na pag-unlad ng mga kasamahan at mag-aaral sa pamamagitan ng pagbabahagi ng kadalubhasaan, paggabay sa kapwa guro, o paggabay sa mga mag-aaral sa pananaliksik at pagpapaunlad ng karera.)",
	26: "(Aktibong Pakikilahok sa mga Programa ng Paaralan — Nagpapakita ng dedikasyon sa pamamagitan ng aktibong paglahok at pagsuporta sa mga inisyatiba at programa ng buong paaralan.)",
	27: "(Kukusa at Inobasyon — Kusang nagpapanukala at nagpapatupad ng mga bagong ideya, estratehiya, o proyekto na nag-aambag sa pagpapabuti ng paaralan.)",
	28: "(Paggabay at Suporta — Nagbibigay ng patnubay at suporta sa kapwa guro, lalo na sa pagpapatupad ng mga bagong inisyatiba o pagpapabuti ng mga kasanayan sa pagtuturo.)",
	29: "(Impluwensya at Pagganyak — Nagbibigay-inspirasyon at nag-uudyok sa mga kasamahan at mag-aaral na aktibong lumahok sa mga inisyatiba ng paaralan at gumawa patungo sa mga karaniwang layunin.)",
	30: "(Dedikasyon sa Propesyonal na Pag-unlad — Naghahanap ng mga pagkakataon para sa patuloy na pagkatuto at nagbabahagi ng kaalaman o magagandang kasanayan sa mga kapwa.)",
	31: "(Paggawa ng Desisyon at Paglutas ng Problema — Nagpapakita ng tamang pagpapasya at mapanuring pag-iisip sa paglutas ng mga hamon na may kaugnayan sa mga inisyatiba ng paaralan.)",
	32: "(Komunikasyon at Pagtatanggol — Epektibong naipararating ang mga layunin at kahalagahan ng mga inisyatiba ng paaralan sa mga stakeholder.)",
	33: "(Pagpapatupad at Pagsusubaybay — Tinitiyak na ang mga inisyatiba ng paaralan ay epektibong naisasagawa at napapanatili sa paglipas ng panahon, gumagawa ng mga kinakailangang pagsasaayos kung kinakailangan.)",
	34: "(Epekto sa Komunidad ng Paaralan — Nag-aambag sa makabuluhang mga pagbabago o pagpapabuti sa kapaligiran ng paaralan sa pamamagitan ng pamumuno sa iba't ibang inisyatiba.)"
};
</script>

<template>
	<div class="eval-result-page">
		<!-- Loading -->
		<div v-if="isLoading" class="loading-screen">
			<div class="spinner"></div>
			<p>Loading evaluation…</p>
		</div>

		<!-- Toolbar (hidden in print) -->
		<div class="toolbar no-print">
			<button type="button" @click="$router.back()" class="btn-back"
				>← Back</button
			>
			<span class="badge-mode"
				>{{
					mode === "merge" ? "Averaged Results" : "Individual Result"
				}}
				—
				{{ type === "student" ? "Student Eval" : "Teacher Eval" }}</span
			>
			<button class="btn-print" @click="handlePrint">🖨 Print</button>
		</div>

		<!-- A4 Printable Document -->
		<div class="a4-page">
			<!-- Header / Letterhead -->
			<header class="doc-header">
				<div class="logo-box">
					<img :src="depedLogo" alt="DepEd Logo" />
				</div>
				<div class="header-text">
					<p class="line-sm">Republic of the Philippines</p>
					<p class="line-md">Department of Education</p>
					<p class="line-lg">SCHOOLS DIVISION OF OLONGAPO CITY</p>
				</div>
				<div class="logo-box">
					<img
						:src="bagongPinasLogo"
						alt="Bagong Pilipinas Logo"
					/>
				</div>
			</header>

			<!-- Info Fields -->
			<section class="info-grid">
				<div class="info-item">
					<span class="info-label">Pangalan:</span>
					<span class="info-value"
						>{{ evaluator.firstname }} {{ evaluator.lastname
						}}{{
							evaluator.stid ? ` (${evaluator.stid})` : ""
						}}</span
					>
				</div>
				<div class="info-item">
					<span class="info-label">Subject:</span>
					<span class="info-value">{{ teacher.sub }}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Subject Teacher:</span>
					<span class="info-value"
						>{{ teacher.firstnm }} {{ teacher.lastnm }}</span
					>
				</div>
				<div class="info-item">
					<span class="info-label">Petsa (Date):</span>
					<span class="info-value">{{ evalDate }}</span>
				</div>
			</section>

			<!-- Rating Scale -->
			<section class="rating-scale">
				<h3>Rating Scale</h3>
				<table class="scale-table">
					<thead>
						<tr>
							<th>Rating</th>
							<th>Description (English)</th>
							<th>Paglalarawan (Filipino)</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="s in ratingScale" :key="s.rating">
							<td class="center">{{ s.rating }}</td>
							<td>{{ s.en }}</td>
							<td>{{ s.fil }}</td>
						</tr>
					</tbody>
				</table>
				<p class="scale-note">
					Please rate the following aspects of your teacher's
					performance using the scale above:
				</p>
			</section>

			<!-- Evaluation Sections -->
			<section
				v-for="h in headers"
				:key="h.header_id"
				class="eval-section"
			>
				<div class="section-title">
					{{ h.header }}
					<span v-if="h.header_p" class="tagalog">{{
						h.header_p
					}}</span>
				</div>
				<div class="overflow-x-auto w-full max-w-full">
					<table class="questions-table">
						<thead>
							<tr>
								<th class="col-question">Questions</th>
								<th class="col-rating">Rating</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="q in h.questions" :key="q.question_id">
								<td>
									<div class="q-main">{{ q.question }}</div>
									<div v-if="type === 'teacher' && teacherTagalogTranslations[questionSequenceMap[q.question_id]]" class="q-tagalog">
										{{ teacherTagalogTranslations[questionSequenceMap[q.question_id]] }}
									</div>
								</td>
								<td class="center">
									{{ answers[Number(q.question_id)] ?? "N/A" }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Feedback (individual only) -->
			<section v-if="mode === 'individual'" class="feedback-section">
				<h3>Comments / Suggestions:</h3>
				<p class="feedback-text">{{ feedback || "N/A" }}</p>
			</section>

			<!-- Footer -->
			<footer class="doc-footer">
				<div class="footer-logo">
					<img :src="jlgisLogo" alt="JLGIS Logo" />
				</div>
				<div class="footer-lines">
					<p>
						<strong>Address:</strong> Foster St. Brgy. Kababae,
						Olongapo City 2200
					</p>
					<p><strong>Tel. no.:</strong> (047) 222-4769</p>
					<p>
						<strong>Email:</strong> 500027@deped.gov.ph /
						500027@r3-2.deped.gov.ph
					</p>
					<p>
						<strong>Facebook Page:</strong>
						depedtayojameslgordonintegratedschool
					</p>
				</div>
			</footer>
		</div>
	</div>
</template>

<style scoped>
/* ── Print controls ─────────────────────────────────── */
@media print {
	.no-print {
		display: none !important;
	}
	.eval-result-page {
		background: none;
		padding: 0;
	}
	.a4-page {
		box-shadow: none;
		margin: 0;
	}
}

@page {
	size: A4;
	margin: 15mm 10mm;
}

/* ── Page layout ────────────────────────────────────── */
.eval-result-page {
	min-height: 100vh;
	background: var(--color-bg-page, #f9fafb);
	padding: 1.5rem;
}

.toolbar {
	max-width: 210mm;
	margin: 0 auto 1rem;
	display: flex;
	align-items: center;
	gap: 1rem;
}

.btn-back {
	font-size: 0.875rem;
	color: var(--color-primary, #4f46e5);
	text-decoration: none;
	font-weight: 500;
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
}
.btn-back:hover {
	text-decoration: underline;
}

.badge-mode {
	flex: 1;
	font-size: 0.8rem;
	color: var(--color-text-secondary, #6b7280);
}

.btn-print {
	padding: 0.5rem 1rem;
	background: var(--color-primary, #4f46e5);
	color: #fff;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	cursor: pointer;
}
.btn-print:hover {
	opacity: 0.9;
}

/* ── A4 document ────────────────────────────────────── */
.a4-page {
	width: 210mm;
	min-height: 297mm;
	margin: 0 auto;
	background: #fff;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	padding: 0;
	font-family: "Arial", sans-serif;
	font-size: 14px;
	line-height: 1.5;
	color: #1a1a1a;
}

/* ── Header / Letterhead ────────────────────────────── */
.doc-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem 1.25rem;
	border-bottom: 2px solid #0044cc;
	background: #f8f9fa;
}

.logo-box {
	width: 4rem;
	height: 4rem;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.logo-box img {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
}

.header-text {
	flex: 1;
	text-align: center;
}
.header-text .line-sm {
	font-size: 0.85rem;
}
.header-text .line-md {
	font-size: 0.95rem;
	font-weight: 600;
}
.header-text .line-lg {
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: 0.5px;
}

/* ── Info Grid ──────────────────────────────────────── */
.info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem 2rem;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #dee2e6;
}

.info-item {
	display: flex;
	gap: 0.5rem;
}
.info-label {
	font-weight: 600;
	font-size: 0.85rem;
	white-space: nowrap;
}
.info-value {
	font-size: 0.85rem;
}

/* ── Rating Scale ───────────────────────────────────── */
.rating-scale {
	padding: 0.75rem 1.5rem;
	border-bottom: 1px solid #dee2e6;
}
.rating-scale h3 {
	font-size: 0.95rem;
	margin-bottom: 0.5rem;
	color: #0044cc;
}

.scale-table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 0.5rem;
	font-size: 0.8rem;
}
.scale-table th,
.scale-table td {
	border: 1px solid #ccc;
	padding: 0.35rem 0.6rem;
	text-align: left;
}
.scale-table th {
	background: #e8ecf4;
	font-weight: 600;
}
.scale-table .center {
	text-align: center;
}

.scale-note {
	font-size: 0.8rem;
	font-style: italic;
	color: #444;
}

/* ── Evaluation Sections ────────────────────────────── */
.eval-section {
	padding: 0 1.5rem;
	margin: 0.75rem 0;
}

.section-title {
	background: #0044cc;
	color: #fff;
	padding: 0.4rem 0.75rem;
	font-size: 0.9rem;
	font-weight: 600;
	border-radius: 4px 4px 0 0;
}
.section-title .tagalog {
	display: block;
	font-weight: 400;
	font-size: 0.8rem;
	opacity: 0.85;
}

.questions-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.8rem;
}
.questions-table th,
.questions-table td {
	border: 1px solid #ccc;
	padding: 0.35rem 0.6rem;
}
.questions-table th {
	background: #f0f2f5;
	font-weight: 600;
	text-align: left;
}
.col-question {
	width: 80%;
}
.col-rating {
	width: 20%;
	text-align: center;
}
.questions-table .center {
	text-align: center;
	font-weight: 600;
}

.q-main {
	color: #1a1a1a;
}

.q-tagalog {
	font-size: 0.75rem;
	color: #666;
	font-style: italic;
	margin-top: 2px;
}

/* ── Feedback ───────────────────────────────────────── */
.feedback-section {
	padding: 0.75rem 1.5rem;
	border-top: 1px solid #dee2e6;
}
.feedback-section h3 {
	font-size: 0.9rem;
	margin-bottom: 0.35rem;
}
.feedback-text {
	font-size: 0.85rem;
	color: #333;
	min-height: 2rem;
	padding: 0.5rem;
	background: #fafafa;
	border: 1px solid #eee;
	border-radius: 4px;
}

/* ── Footer ─────────────────────────────────────────── */
.doc-footer {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.6rem 1.5rem;
	border-top: 2px solid #0044cc;
	background: #f8f9fa;
	margin-top: auto;
}
.footer-logo {
	width: 3rem;
	flex-shrink: 0;
}
.footer-logo img {
	max-width: 100%;
	object-fit: contain;
}
.footer-lines p {
	font-size: 0.7rem;
	line-height: 1.4;
	color: #555;
}

/* ── Loading ────────────────────────────────────────── */
.loading-screen {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.9);
	z-index: 100;
}
.spinner {
	width: 2.5rem;
	height: 2.5rem;
	border: 3px solid #e5e7eb;
	border-top-color: var(--color-primary, #4f46e5);
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}
@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
