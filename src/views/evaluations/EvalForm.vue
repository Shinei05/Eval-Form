<template>
  <div class="min-h-screen bg-slate-50 bg-[url('/assets/background.png')] bg-cover bg-fixed bg-center">
    <TopBar :title="isStudent ? 'Student Evaluation Tool' : 'Peer Evaluation Tool'" />
    <LoadingOverlay v-if="isLoading" />

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          type="button"
          @click="router.back()"
          class="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Portal
        </button>
        <h1
          :class="[
            'text-3xl font-extrabold tracking-tight',
            isStudent ? 'text-indigo-950' : 'text-emerald-950'
          ]"
        >
          {{ isStudent ? 'Student Evaluation Tool' : 'Peer Evaluation for Teachers' }}
        </h1>
        <p class="mt-2 text-[15px] text-ink-soft">
          {{
            isStudent
              ? 'Rate each indicator honestly to help improve teaching quality. All responses are confidential.'
              : 'Provide constructive feedback to colleagues based on observation. All responses are confidential.'
          }}
        </p>
      </div>

      <!-- Info Section -->
      <section class="mb-8 overflow-hidden rounded-2xl border border-line bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              {{ isStudent ? 'Student Name' : 'Evaluator' }}
            </label>
            <p class="mt-1 font-semibold text-ink">{{ userName }}</p>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Teacher</label>
            <p class="mt-1 font-semibold text-ink">
              {{ teacher.firstnm }} {{ teacher.lastnm }}
            </p>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Subject</label>
            <p class="mt-1 font-semibold text-ink">{{ teacher.sub }}</p>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Date</label>
            <p class="mt-1 font-semibold text-ink">{{ dateStr }}</p>
          </div>
        </div>
      </section>

      <!-- Rating Scale Legend -->
      <section class="mb-8 overflow-hidden rounded-2xl border border-line bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <h3 class="mb-5 text-[13px] font-extrabold uppercase tracking-widest text-ink">
          Rating Scale Legend
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <div
            v-for="r in ratingScale"
            :key="r.value"
            class="flex items-center gap-3 rounded-full border border-line bg-white py-2 pl-2 pr-4 shadow-xs"
          >
            <span
              :class="[
                'flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-black',
                isStudent
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-emerald-50 text-emerald-700'
              ]"
            >
              {{ r.value }}
            </span>
            <div class="flex flex-col">
              <span class="text-sm font-bold leading-tight text-ink">
                {{ r.label }}
              </span>
              <span v-if="r.desc" class="text-[11px] font-medium leading-tight text-ink-muted">
                {{ r.desc }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Evaluation Sections -->
      <div
        v-for="(header, index) in headers"
        :key="header.header_id"
        class="relative mb-8"
      >
        <div
          v-if="!isCategoryUnlocked(index)"
          class="absolute inset-0 z-10 cursor-not-allowed rounded-2xl bg-slate-50/40 backdrop-blur-[2px]"
          @click="handleLockedClick(index)"
          aria-hidden="true"
        />

        <section
          :class="[
            'overflow-hidden rounded-2xl border border-line bg-white/90 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 sm:p-8',
            !isCategoryUnlocked(index) ? 'opacity-50 grayscale' : ''
          ]"
        >
          <h2
            :class="[
              'mb-6 border-b pb-4 text-lg font-bold',
              isStudent ? 'border-indigo-100 text-indigo-800' : 'border-emerald-100 text-emerald-800'
            ]"
          >
            {{ header.header }}
          </h2>

          <div class="space-y-4">
            <div
              v-for="(question, idx) in header.questions"
              :key="question.question_id"
              class="flex flex-col gap-4 rounded-xl border border-transparent bg-slate-50 p-4 transition-colors hover:border-line hover:bg-white sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex flex-1 gap-3">
                <span
                  :class="[
                    'font-bold',
                    isStudent ? 'text-indigo-600' : 'text-emerald-600'
                  ]"
                >
                  {{ idx + 1 }}.
                </span>
                <div class="flex flex-col gap-1">
                  <div class="text-[15px] font-semibold text-ink">
                    {{ question.question }}
                  </div>
                  <div
                    v-if="!isStudent && teacherTagalogTranslations[questionSequenceMap[question.question_id]]"
                    class="text-xs font-medium italic text-ink-soft"
                  >
                    {{ teacherTagalogTranslations[questionSequenceMap[question.question_id]] }}
                  </div>
                  <div
                    v-if="isStudent && studentEnglishTranslations[questionSequenceMap[question.question_id]]"
                    class="text-xs font-medium italic text-ink-soft"
                  >
                    {{ studentEnglishTranslations[questionSequenceMap[question.question_id]] }}
                  </div>
                </div>
              </div>

              <!-- Rating Picker -->
              <div class="flex flex-none flex-wrap items-center gap-1.5 sm:gap-2 max-w-full justify-start sm:justify-end">
                <label
                  v-for="r in ratingScale"
                  :key="r.value"
                  :class="[
                    'group relative flex h-9 w-9 sm:h-10 sm:w-10 text-xs sm:text-sm cursor-pointer items-center justify-center rounded-full border-2 font-bold transition-all',
                    answer[question.question_id] == r.value
                      ? (isStudent
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-110'
                          : 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-110')
                      : 'border-line bg-white text-ink-muted hover:border-slate-300 hover:bg-slate-100'
                  ]"
                >
                  <input
                    type="radio"
                    :name="'q-' + question.question_id"
                    :value="r.value"
                    v-model="answer[question.question_id]"
                    class="sr-only"
                  />
                  {{ r.value }}
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Feedback -->
      <div class="relative mb-8">
        <div
          v-if="!allCategoriesComplete"
          class="absolute inset-0 z-10 cursor-not-allowed rounded-2xl bg-slate-50/40 backdrop-blur-[2px]"
          @click="handleLockedClick(headers.length)"
          aria-hidden="true"
        />

        <section
          :class="[
            'overflow-hidden rounded-2xl border border-line bg-white/90 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 sm:p-8',
            !allCategoriesComplete ? 'opacity-50 grayscale' : ''
          ]"
        >
          <h3 class="mb-4 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-ink">
            <span>{{
              isStudent
                ? 'Additional Feedback / Karagdagang Mensahe'
                : 'Professional Feedback for Colleague Development'
            }}</span>
            <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-500">OPTIONAL</span>
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
            class="w-full rounded-xl border border-line bg-white p-4 text-[15px] font-medium text-ink transition-all placeholder:text-ink-muted focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          ></textarea>
        </section>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/50 pt-8">
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[15px] font-bold text-ink-soft shadow-sm transition-colors hover:bg-slate-50 hover:text-ink"
          @click="resetForm"
        >
          <RefreshCw class="h-4 w-4" />
          Reset Form
        </button>

        <button
          type="button"
          :disabled="!allCategoriesComplete"
          @click="confirmSubmit"
          :class="[
            'flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-bold text-white shadow-soft transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
            isStudent
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
          ]"
        >
          Submit Evaluation
          <Send class="h-4 w-4" />
        </button>
      </div>

      <footer class="mt-12 text-center">
        <p class="text-sm font-medium text-ink-muted">
          This evaluation is intended for educational improvement purposes. All responses are kept confidential.
        </p>
      </footer>
    </main>

    <!-- Submit Confirmation Modal -->
    <ConfirmModal
      :visible="showSubmitModal"
      title="Submit Evaluation"
      message="Are you sure you want to submit this evaluation? This action cannot be undone."
      confirmText="Submit"
      cancelText="Review Again"
      icon="send"
      @confirm="submitEval"
      @cancel="showSubmitModal = false"
      @update:visible="showSubmitModal = $event"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ArrowLeft, RefreshCw, Send } from "@lucide/vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import ConfirmModal from "../../components/ConfirmModal.vue";
import TopBar from "../../components/common/TopBar.vue";
import API from "../../utils/api";

const props = defineProps({
  type: { type: String, default: "student" }, // 'student' | 'teacher'
});

const router = useRouter();
const route = useRoute();
const { request, isLoading } = useApi();
const { requireAuth, userData } = useAuth();
const { showToast } = useToast();

const headers = ref([]);
const teacher = ref({});
const answer = ref({});
const feedback = ref("");
const showSubmitModal = ref(false);

// Maps each question_id (DB PK) → its 1-based sequential number across all headers.
// The teacherTagalogTranslations object is keyed 1–34 by order, not by DB id.
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

const isStudent = computed(() => props.type === "student");

const currentUser = computed(() => userData.value || JSON.parse(localStorage.getItem("userData") || "{}"));
const userName = computed(() => currentUser.value.fullname || currentUser.value.firstname || "User");
const userId = computed(() => currentUser.value.id);

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
      { value: 3, label: "Sometimes Evident", desc: "Paminsan-minsang Nakikita" },
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
    const sections = document.querySelectorAll(".relative");
    if (sections[targetIdx + 2]) { // Offset for info/scale cards
      sections[targetIdx + 2].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  showToast("Please complete the prior category first!", "warning");
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
    showToast("You have already submitted an evaluation for this teacher.", "error");
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
    showToast("Please answer all questions before submitting.", "error");
    return;
  }
  showSubmitModal.value = true;
}

async function submitEval() {
  showSubmitModal.value = false;
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
    showToast("Evaluation submitted successfully!", "success");
    setTimeout(() => {
      router.replace(isStudent.value ? "/student" : "/teacher");
    }, 1500);
  } else {
    showToast(result.error || result.message || "Failed to submit evaluation", "error");
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

const studentEnglishTranslations = {
  1: "(The teacher discusses each lesson clearly.)",
  2: "(The teacher discusses the lesson in an organized manner.)",
  3: "(The teacher provides appropriate and specific examples for the lesson.)",
  4: "(The teacher appropriately relates lessons to real-life situations.)",
  5: "(The teacher effectively imparts new or modern knowledge.)",
  6: "(The teacher's voice is loud and clear during lesson discussions.)",
  7: "(The instructions given by the teacher are clear, easy to understand, and organized.)",
  8: "(The teacher uses appropriate words and displays proper behavior when communicating.)",
  9: "(The teacher asks effective questions to stimulate critical and creative thinking.)",
  10: "(The teacher guides students in answering difficult questions.)",
  11: "(The teacher emphasizes the important points of the lesson.)",
  12: "(Demonstrates proficiency and appropriateness in using modern technology.)",
  13: "(The teacher uses various strategies and methodologies that demonstrate student understanding.)",
  14: "(The teacher enriches the self-esteem and values of the students.)",
  15: "(Encourages students to think independently and make their own decisions.)",
  16: "(Encourages students to research and learn.)",
  17: "(Encourages students to use their appropriate skills or multiple intelligences.)",
  18: "(The teacher gives all students the opportunity to participate and share in classroom activities.)",
  19: "(The teacher establishes and implements conditions and experiences for learning.)",
  20: "(The teacher creates a conducive teaching-learning context.)",
  21: "(The teacher uses both traditional and modern instructional materials.)",
  22: "(The teacher uses instructional materials effectively and systematically.)",
  23: "(The teacher uses different teaching modalities effectively and systematically.)",
  24: "(The teacher has sufficient knowledge in using various applications.)",
  25: "(The teacher clearly explains the importance of using different modalities to students.)",
  26: "(The teacher clearly explains the appropriate use of various applications.)",
  27: "(The teacher arrives and leaves the classroom on time.)",
  28: "(The teacher prepares the whole classroom before class starts.)",
  29: "(The teacher checks attendance at the start of the class.)",
  30: "(The teacher maintains classroom cleanliness throughout the period.)",
  31: "(The teacher treats students fairly and well.)",
  32: "(The teacher establishes a positive, peaceful, and caring environment among everyone.)",
  33: "(The teacher returns activities, projects, notebooks, and graded tests to students.)",
  34: "(The teacher communicates effectively with students and their parents.)",
  35: "(The teacher shares important necessary information.)",
  36: "(The teacher sets aside time to check on the well-being of the students every day.)"
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
