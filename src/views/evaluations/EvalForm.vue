<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import ConfirmModal from "../../components/ConfirmModal.vue";
import API from "../../utils/api";

const props = defineProps({
	type: { type: String, default: "student" }, // 'student' | 'teacher'
});

const router = useRouter();
const route = useRoute();
const { request, isLoading } = useApi();
const { requireAuth } = useAuth();

const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const headers = ref([]);
const teacher = ref({});
const answer = ref({});
const feedback = ref("");
const showSubmitModal = ref(false);

const isStudent = computed(() => props.type === "student");
const userName = computed(() => {
	const ud = JSON.parse(localStorage.getItem("userData") || "{}");
	return ud.fullname || ud.firstname || "User";
});
const userId = computed(() => {
	return JSON.parse(localStorage.getItem("userData") || "{}").id;
});

const dateStr = computed(() => {
	const d = new Date();
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
});

const ratingScale = computed(() => {
	if (isStudent.value) {
		return [
			{ value: 5, label: "Very Evident", desc: "Palagiang Nakikita" },
			{
				value: 3,
				label: "Sometimes Evident",
				desc: "Paminsan-minsang Nakikita",
			},
			{ value: 1, label: "Not Evident", desc: "Hindi Nakikita" },
		];
	}
	return [
		{ value: 5, label: "Outstanding" },
		{ value: 4, label: "Very Satisfactory" },
		{ value: 3, label: "Satisfactory" },
		{ value: 2, label: "Unsatisfactory" },
		{ value: 1, label: "Poor" },
	];
});

// Sequential Locking Logic
function isCategoryComplete(header) {
	if (!header || !header.questions) return false;
	return header.questions.every((q) => answer.value[q.question_id]);
}

const firstIncompleteCategoryIndex = computed(() => {
	for (let i = 0; i < headers.value.length; i++) {
		if (!isCategoryComplete(headers.value[i])) {
			return i;
		}
	}
	return -1;
});

function isCategoryUnlocked(index) {
	if (index === 0) return true;
	const firstIncomplete = firstIncompleteCategoryIndex.value;
	if (firstIncomplete === -1) return true;
	return index <= firstIncomplete;
}

const allCategoriesComplete = computed(() => {
	return firstIncompleteCategoryIndex.value === -1;
});

function handleLockedClick(index) {
	const targetIdx = firstIncompleteCategoryIndex.value;
	if (targetIdx !== -1) {
		const sections = document.querySelectorAll(".card-wrap-relative");
		if (sections[targetIdx]) {
			sections[targetIdx].scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}
	notify("Please complete the prior category first!", "warning");
}

async function fetchQuestions() {
	const url = isStudent.value ? API.questionsStudent : API.questionsTeacher;
	const action = isStudent.value ? "getQuestions" : "getTeacherQuestions";
	const result = await request(url, { body: { action } });
	if (result.success) {
		headers.value = result.headers || [];
	}
}

async function fetchTeacher() {
	const result = await request(API.teacherGetById, {
		body: { action: "getteacherbyid", id: route.params.id },
	});
	if (result.success) {
		teacher.value = result.teacher || {};
	}
}

async function checkAlreadyEvaluated() {
	const result = await request(API.evalCheckStatus, {
		body: {
			teacherId: route.params.id,
			evaluatorId: userId.value,
			type: isStudent.value ? "student" : "teacher",
		},
	});
	if (result.success && result.alreadyEvaluated) {
		notify("You have already submitted an evaluation for this teacher.", "error");
		setTimeout(() => {
			router.replace(isStudent.value ? "/student" : "/teacher");
		}, 2000);
	}
}

function allAnswered() {
	const qIds = [];
	for (const h of headers.value) {
		for (const q of h.questions || []) {
			qIds.push(q.question_id);
		}
	}
	return qIds.every((id) => answer.value[id]);
}

function confirmSubmit() {
	if (!allAnswered()) {
		notify("Please answer all questions before submitting.", "error");
		return;
	}
	showSubmitModal.value = true;
}

async function submitEval() {
	const url = isStudent.value ? API.evalSubmitStudent : API.evalSubmitTeacher;
	const result = await request(url, {
		body: {
			action: "submits",
			id: route.params.id,
			feedback: feedback.value,
			answers: answer.value,
			stid: userId.value,
		},
	});

	if (result.success) {
		notify("Evaluation submitted successfully!", "success");
		setTimeout(() => {
			router.replace(isStudent.value ? "/student" : "/teacher");
		}, 1500);
	} else {
		notify(result.error || result.message || "Failed to submit evaluation", "error");
	}
}

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


function resetForm() {
	answer.value = {};
	feedback.value = "";
}

onMounted(() => {
	if (!requireAuth()) return;
	fetchQuestions();
	fetchTeacher();
	checkAlreadyEvaluated();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div :class="['eval-page', `theme-${type}`]">
		<div class="eval-container">
			<!-- Header -->
			<header class="eval-header">
				<button
					class="back-btn"
					@click="router.back()"
				>
					<span class="material-icons">arrow_back</span>
					Back to Portal
				</button>
				<h1>
					{{
						isStudent
							? "Student Evaluation Tool"
							: "Peer Evaluation for Teachers"
					}}
				</h1>
				<p class="eval-intro">
					{{
						isStudent
							? "Rate each indicator honestly to help improve teaching quality. All responses are confidential."
							: "Provide constructive feedback to colleagues based on observation. All responses are confidential."
					}}
				</p>
			</header>

			<!-- Info Fields -->
			<section class="info-section card">
				<div class="info-grid">
					<div class="info-item">
						<label>{{
							isStudent ? "Student Name" : "Evaluator"
						}}</label>
						<p>{{ userName }}</p>
					</div>
					<div class="info-item">
						<label>Teacher</label>
						<p>{{ teacher.firstnm }} {{ teacher.lastnm }}</p>
					</div>
					<div class="info-item">
						<label>Subject</label>
						<p>{{ teacher.sub }}</p>
					</div>
					<div class="info-item">
						<label>Date</label>
						<p>{{ dateStr }}</p>
					</div>
				</div>
			</section>

			<!-- Rating Scale Legend -->
			<section class="scale-section card">
				<h3>Rating Scale Legend</h3>
				<div class="scale-chips">
					<span
						v-for="r in ratingScale"
						:key="r.value"
						class="scale-chip"
					>
						<span class="scale-num">{{ r.value }}</span>
						<span class="scale-text">
							<span class="scale-main">{{ r.label }}</span>
							<span v-if="r.desc" class="scale-sub">{{ r.desc }}</span>
						</span>
					</span>
				</div>
			</section>

			<!-- Evaluation Sections -->
			<div
				v-for="(header, index) in headers"
				:key="header.header_id"
				class="card-wrap-relative"
			>
				<div
					v-if="!isCategoryUnlocked(index)"
					class="locked-overlay"
					@click="handleLockedClick(index)"
				></div>
				
				<section
					class="eval-section card"
					:class="{ 'locked-card': !isCategoryUnlocked(index) }"
				>
					<h2 class="section-header">{{ header.header }}</h2>
					<div class="questions-list">
						<div
							v-for="(question, idx) in header.questions"
							:key="question.question_id"
							class="question-row"
						>
							<div class="question-text">
								<span class="q-num">{{ idx + 1 }}.</span>
								<div class="q-content">
									<div class="q-main">{{ question.question }}</div>
									<div v-if="!isStudent && teacherTagalogTranslations[question.question_id]" class="q-tagalog">
										{{ teacherTagalogTranslations[question.question_id] }}
									</div>
								</div>
							</div>
							<div class="rating-options">
								<label
									v-for="r in ratingScale"
									:key="r.value"
									class="rating-option"
									:class="{
										selected:
											answer[question.question_id] == r.value,
									}"
								>
									<input
										type="radio"
										:name="'q-' + question.question_id"
										:value="r.value"
										v-model="answer[question.question_id]"
									/>
									<span class="option-value">{{ r.value }}</span>
								</label>
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- Feedback -->
			<div class="card-wrap-relative">
				<div
					v-if="!allCategoriesComplete"
					class="locked-overlay"
					@click="handleLockedClick(headers.length)"
				></div>
				
				<section
					class="feedback-section card"
					:class="{ 'locked-card': !allCategoriesComplete }"
				>
					<h3>
						{{
							isStudent
								? "Additional Feedback / Karagdagang Mensahe"
								: "Professional Feedback for Colleague Development"
						}}
					</h3>
					<textarea
						v-model="feedback"
						:disabled="!allCategoriesComplete"
						:placeholder="
							isStudent
								? 'Share your feedback and suggestions to help improve teaching...'
								: 'Provide constructive feedback for your colleague\'s professional growth...'
						"
						rows="5"
					></textarea>
				</section>
			</div>

			<!-- Actions -->
			<div class="eval-actions">
				<button
					type="button"
					class="btn btn-primary btn-submit"
					:disabled="!allCategoriesComplete"
					@click="confirmSubmit"
				>
					Submit Evaluation
				</button>
				<button class="btn btn-ghost" @click="resetForm">
					<span class="material-icons" style="font-size: 1.125rem"
						>refresh</span
					>
					Reset Form
				</button>
			</div>

			<footer class="eval-footer">
				<p>
					This evaluation is intended for educational improvement
					purposes. All responses are kept confidential.
				</p>
			</footer>
		</div>

		<!-- Submit Confirmation Modal -->
		<ConfirmModal
			v-model:visible="showSubmitModal"
			title="Submit Evaluation"
			message="Are you sure you want to submit this evaluation? This action cannot be undone."
			confirmText="Submit"
			cancelText="Review Again"
			confirmBtnClass="btn-theme"
			icon="send"
			:iconColor="isStudent ? 'var(--color-primary)' : 'var(--color-success)'"
			@confirm="submitEval"
		/>
	</div>
</template>

<style scoped>
.eval-page {
	min-height: 100vh;
	background: var(--color-bg-page);
	padding: var(--space-8) var(--space-4);
	
	/* Theme Variables - Default (Student/Indigo) */
	--theme-color: var(--color-primary);
	--theme-color-hover: var(--color-primary-hover);
	--theme-color-light: var(--color-primary-light);
	--theme-color-50: var(--color-primary-50);
	--theme-color-glow: rgba(99, 102, 241, 0.35);
	--theme-color-glow-btn: rgba(99, 102, 241, 0.2);
}

.eval-page.theme-teacher {
	/* Theme Variables - Teacher/Emerald */
	--theme-color: var(--color-success);
	--theme-color-hover: #047857;
	--theme-color-light: var(--color-success-light);
	--theme-color-50: #f0fdf4;
	--theme-color-glow: rgba(5, 150, 105, 0.35);
	--theme-color-glow-btn: rgba(5, 150, 105, 0.2);
}

.eval-container {
	max-width: 800px;
	margin: 0 auto;
}

/* Sequential Locking Classes */
.card-wrap-relative {
	position: relative;
	margin-bottom: var(--space-6);
}

.locked-overlay {
	position: absolute;
	inset: 0;
	z-index: 100;
	cursor: not-allowed;
	border-radius: var(--radius-xl);
}

.locked-card {
	opacity: 0.4 !important;
	filter: grayscale(50%) !important;
	pointer-events: none !important;
	background: rgba(248, 250, 252, 0.8) !important;
	border-color: var(--color-border) !important;
	box-shadow: none !important;
}

.locked-card .scale-chip {
	background: var(--color-bg-subtle) !important;
}

/* Header */
.eval-header {
	margin-bottom: var(--space-8);
	text-align: left;
}

.back-btn {
	background: none;
	border: none;
	color: var(--color-text-muted);
	font-size: 0.875rem;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	margin-bottom: var(--space-4);
	cursor: pointer;
	padding: 0;
	transition: color 0.15s;
}

.back-btn:hover {
	color: var(--theme-color);
}

.back-btn .material-icons {
	font-size: 1.125rem;
}

.eval-header h1 {
	font-size: 1.85rem;
	font-weight: 800;
	margin-bottom: var(--space-2);
	color: var(--theme-color);
	letter-spacing: -0.5px;
}

.eval-intro {
	color: var(--color-text-muted);
	font-size: 0.9375rem;
	line-height: 1.5;
}

/* Info Section Card */
.info-section {
	padding: var(--space-6);
	margin-bottom: var(--space-6);
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: var(--space-4);
}

.info-item label {
	display: block;
	font-size: 0.6875rem;
	font-weight: 700;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.075em;
	margin-bottom: var(--space-1);
}

.info-item p {
	font-weight: 700;
	font-size: 0.9375rem;
	color: var(--color-text);
	margin: 0;
}

/* Scale Section Card */
.scale-section {
	padding: var(--space-6);
	margin-bottom: var(--space-6);
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
}

.scale-section h3 {
	font-size: 0.9375rem;
	font-weight: 800;
	color: var(--color-text);
	margin-bottom: var(--space-4);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.scale-chips {
	display: flex;
	flex-wrap: nowrap;
	gap: 30px;
	justify-content: center;
	align-items: center;
	overflow-x: auto;
	padding-bottom: 2px;
}

.theme-teacher .scale-chips {
	gap: 12px;
}

.theme-teacher .scale-chip {
	width: auto;
	padding-right: var(--space-4);
}

.scale-chip {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: 0.8125rem;
	padding: 0.25rem var(--space-3);
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-full);
	color: var(--color-text-secondary);
	box-shadow: var(--shadow-xs);
	white-space: nowrap;
	width: 220px;
	justify-content: flex-start;
}

.scale-num {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: var(--theme-color-light);
	color: var(--theme-color);
	font-weight: 800;
	font-size: 0.75rem;
}

.scale-text {
	display: flex;
	flex-direction: column;
	line-height: 1.1;
}

.scale-main {
	font-weight: 700;
	color: var(--color-text);
}

.scale-sub {
	color: var(--color-text-muted);
	font-size: 0.72rem;
	font-weight: 500;
}

/* Question Sections Card */
.eval-section {
	padding: var(--space-6);
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
}

.section-header {
	font-size: 1.125rem;
	font-weight: 800;
	color: var(--theme-color);
	margin-bottom: var(--space-5);
	padding-bottom: var(--space-3);
	border-bottom: 2px solid var(--theme-color-light);
}

.questions-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.question-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-6);
	padding: var(--space-4);
	border-radius: var(--radius-lg);
	background: var(--color-bg-page);
	border: 1px solid transparent;
	transition: all var(--transition-base);
}

.question-row:hover {
	background: #ffffff;
	border-color: var(--color-border);
	box-shadow: var(--shadow-sm);
}

.question-text {
	flex: 1;
	font-size: 0.9375rem;
	line-height: 1.5;
	font-weight: 600;
	color: var(--color-text-secondary);
	display: flex;
}

.q-content {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.q-main {
	color: var(--color-text);
}

.q-tagalog {
	font-size: 0.85rem;
	color: var(--color-text-muted);
	font-style: italic;
	font-weight: 500;
}

.q-num {
	font-weight: 700;
	color: var(--theme-color);
	margin-right: var(--space-2);
}

/* Rating Picker Circles */
.rating-options {
	display: flex;
	gap: var(--space-2);
	flex-shrink: 0;
}

.rating-option {
	position: relative;
	cursor: pointer;
}

.rating-option input {
	position: absolute;
	opacity: 0;
	pointer-events: none;
}

.option-value {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 42px;
	height: 42px;
	border: 2px solid var(--color-border);
	border-radius: var(--radius-full);
	font-weight: 800;
	font-size: 0.9375rem;
	color: var(--color-text-muted);
	background: #ffffff;
	transition: all var(--transition-base);
}

.rating-option:hover .option-value {
	border-color: var(--theme-color);
	color: var(--theme-color);
	background: var(--theme-color-50);
	transform: scale(1.05);
}

.rating-option.selected .option-value {
	background: var(--theme-color);
	border-color: var(--theme-color);
	color: white;
	box-shadow: 0 4px 12px var(--theme-color-glow);
	transform: scale(1.05);
}

/* Feedback Card */
.feedback-section {
	padding: var(--space-6);
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
}

.feedback-section h3 {
	font-size: 0.9375rem;
	font-weight: 800;
	color: var(--color-text);
	margin-bottom: var(--space-4);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.feedback-section textarea {
	width: 100%;
	min-height: 120px;
	padding: var(--space-4);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	font-family: inherit;
	font-size: 0.9375rem;
	color: var(--color-text);
	background: var(--color-bg-page);
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
	resize: vertical;
	box-sizing: border-box;
}

.feedback-section textarea:focus {
	border-color: var(--theme-color);
	box-shadow: 0 0 0 3px var(--theme-color-glow-btn);
	background: #ffffff;
}

/* Actions Container styling */
.eval-actions {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	margin-top: var(--space-8);
	margin-bottom: var(--space-10);
}

.btn-submit {
	padding: 0.75rem 2rem;
	font-size: 0.9375rem;
	font-weight: 700;
	border-radius: var(--radius-md);
	box-shadow: 0 4px 12px var(--theme-color-glow-btn);
	transition: all 0.2s;
	background: var(--theme-color);
	color: white;
	border: none;
	cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
	background: var(--theme-color-hover);
	transform: translateY(-1px);
	box-shadow: 0 6px 16px var(--theme-color-glow);
}

.btn-submit:active:not(:disabled) {
	transform: translateY(0);
}

.btn-submit:disabled {
	opacity: 0.5;
	background: #cbd5e1 !important;
	color: #94a3b8 !important;
	box-shadow: none !important;
	cursor: not-allowed;
}

.btn-ghost {
	background: none;
	border: 1px solid var(--color-border);
	color: var(--color-text-secondary);
	padding: 0.75rem 1.5rem;
	font-size: 0.9375rem;
	font-weight: 600;
	border-radius: var(--radius-md);
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	transition: all 0.15s;
}

.btn-ghost:hover {
	background: var(--color-bg-subtle);
	color: var(--color-text);
	border-color: var(--color-border-strong);
}

/* Footer styling */
.eval-footer {
	text-align: center;
	padding: var(--space-6) var(--space-4);
	color: var(--color-text-muted);
	font-size: 0.8125rem;
	border-top: 1px solid var(--color-border);
	margin-top: var(--space-8);
}

/* Deep Selector for Modal Actions matching role color scheme */
:deep(.btn-theme) {
	background: var(--theme-color) !important;
	color: #ffffff !important;
	border: none !important;
	box-shadow: 0 4px 12px var(--theme-color-glow-btn) !important;
	font-weight: 700;
	padding: 0.625rem 1.25rem;
	border-radius: var(--radius-lg);
	cursor: pointer;
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.btn-theme:hover) {
	background: var(--theme-color-hover) !important;
	transform: translateY(-2px);
	box-shadow: 0 6px 16px var(--theme-color-glow) !important;
}

:deep(.btn-theme:active) {
	transform: scale(0.97);
}

/* Mobile Breakpoints styling */
@media (max-width: 768px) {
	.info-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}
}

@media (max-width: 640px) {
	.eval-page {
		padding: var(--space-4) var(--space-3);
	}

	.eval-header h1 {
		font-size: 1.5rem;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}

	.question-row {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-3);
	}

	.rating-options {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: var(--space-2);
	}

	.rating-option {
		flex: 1;
	}

	.option-value {
		width: 100% !important;
		max-width: 44px;
		height: 44px;
		margin: 0 auto;
	}

	.eval-actions {
		flex-direction: column;
		width: 100%;
		gap: var(--space-3);
	}

	.btn-submit, .btn-ghost {
		width: 100%;
		justify-content: center;
		box-sizing: border-box;
	}
}
</style>
