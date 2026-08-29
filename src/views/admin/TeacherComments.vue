<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import API from "../../utils/api";
import {
	ArrowLeft,
	MessageSquare,
	Users,
	GraduationCap,
	Search,
	Filter,
	Calendar,
	BookOpen,
	Clock,
	Quote,
	RefreshCw,
	Sparkles,
	SlidersHorizontal,
	UserCheck,
	CheckCircle2,
	AlertCircle
} from "@lucide/vue";

const route = useRoute();
const router = useRouter();
const { request, isLoading, error } = useApi();
const { requireAuth } = useAuth();

const teacherId = computed(() => route.params.tcrid);
const initialType = computed(() => route.query.type || "all");

const teacher = ref({});
const studentEvals = ref([]);
const peerEvals = ref([]);
const stats = ref({
	studentCount: 0,
	peerCount: 0,
	totalCount: 0,
	studentAvg: 0,
	peerAvg: 0,
	combinedAvg: 0
});

// Active tab: 'all' | 'student' | 'peer'
const activeTab = ref(
	initialType.value === "student" ? "student" : initialType.value === "teacher" ? "peer" : "all"
);

// Filters & Search
const searchQuery = ref("");
const selectedSentiment = ref("all"); // 'all' | 'positive' | 'neutral' | 'negative'
const sortBy = ref("newest"); // 'newest' | 'oldest' | 'highest' | 'lowest'
const onlyWithText = ref(true);

async function fetchData() {
	if (!teacherId.value) return;
	const res = await request(API.teacherReportData, {
		body: { tcr_id: Number(teacherId.value) }
	});
	if (res.success) {
		teacher.value = res.teacher || {};
		studentEvals.value = res.studentEvals || [];
		peerEvals.value = res.peerEvals || [];
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

// Normalized comment list
const allComments = computed(() => {
	const list = [];
	(studentEvals.value || []).forEach((e, idx) => {
		list.push({
			id: `student-${idx}`,
			type: "student",
			typeLabel: "Student Evaluation",
			avg: Number(e.avg) || 0,
			sentiment: e.sentiment || "Average",
			feedback: (e.feedback || "").trim(),
			created_at: e.created_at,
		});
	});

	(peerEvals.value || []).forEach((e, idx) => {
		list.push({
			id: `peer-${idx}`,
			type: "peer",
			typeLabel: "Peer Evaluation",
			avg: Number(e.avg) || 0,
			sentiment: e.sentiment || "Average",
			feedback: (e.feedback || "").trim(),
			created_at: e.created_at,
		});
	});

	return list;
});

// Counts
const studentCommentsCount = computed(() => {
	return allComments.value.filter((c) => c.type === "student" && (!onlyWithText.value || c.feedback.length > 0)).length;
});

const peerCommentsCount = computed(() => {
	return allComments.value.filter((c) => c.type === "peer" && (!onlyWithText.value || c.feedback.length > 0)).length;
});

const totalMatchingCount = computed(() => {
	return allComments.value.filter((c) => !onlyWithText.value || c.feedback.length > 0).length;
});

// Filtered and sorted comments list
const filteredComments = computed(() => {
	let list = [...allComments.value];

	// Filter by active tab
	if (activeTab.value === "student") {
		list = list.filter((c) => c.type === "student");
	} else if (activeTab.value === "peer") {
		list = list.filter((c) => c.type === "peer");
	}

	// Filter only with text
	if (onlyWithText.value) {
		list = list.filter((c) => c.feedback && c.feedback.length > 0);
	}

	// Filter by search query
	const q = searchQuery.value.trim().toLowerCase();
	if (q) {
		list = list.filter((c) => {
			const feedbackMatch = c.feedback.toLowerCase().includes(q);
			const sentimentMatch = c.sentiment.toLowerCase().includes(q);
			const typeMatch = c.typeLabel.toLowerCase().includes(q);
			return feedbackMatch || sentimentMatch || typeMatch;
		});
	}

	// Filter by sentiment
	if (selectedSentiment.value !== "all") {
		list = list.filter((c) => {
			const s = (c.sentiment || "").toLowerCase();
			if (selectedSentiment.value === "positive") {
				return s.includes("good") || s.includes("positive");
			}
			if (selectedSentiment.value === "neutral") {
				return s.includes("average") || s.includes("neutral");
			}
			if (selectedSentiment.value === "negative") {
				return s.includes("poor") || s.includes("negative");
			}
			return true;
		});
	}

	// Sort
	if (sortBy.value === "newest") {
		list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	} else if (sortBy.value === "oldest") {
		list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
	} else if (sortBy.value === "highest") {
		list.sort((a, b) => b.avg - a.avg);
	} else if (sortBy.value === "lowest") {
		list.sort((a, b) => a.avg - b.avg);
	}

	return list;
});

function formatDate(iso) {
	if (!iso) return "N/A";
	try {
		const d = new Date(iso);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	} catch (e) {
		return iso;
	}
}

function getSentimentBadgeClass(sentiment) {
	const s = (sentiment || "").toLowerCase();
	if (s.includes("very good") || s.includes("positive")) {
		return "bg-emerald-50 text-emerald-700 border-emerald-200";
	}
	if (s.includes("good")) {
		return "bg-blue-50 text-blue-700 border-blue-200";
	}
	if (s.includes("average") || s.includes("neutral")) {
		return "bg-amber-50 text-amber-700 border-amber-200";
	}
	if (s.includes("poor") || s.includes("negative")) {
		return "bg-rose-50 text-rose-700 border-rose-200";
	}
	return "bg-slate-50 text-slate-700 border-slate-200";
}

function getScoreBadgeClass(avg) {
	if (avg >= 4.5) return "text-emerald-700 bg-emerald-50 border-emerald-200";
	if (avg >= 3.5) return "text-blue-700 bg-blue-50 border-blue-200";
	if (avg >= 2.5) return "text-amber-700 bg-amber-50 border-amber-200";
	return "text-rose-700 bg-rose-50 border-rose-200";
}

onMounted(() => {
	if (!requireAuth()) return;
	fetchData();
});
</script>

<template>
	<div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
		<div class="mx-auto max-w-6xl space-y-6">
			<!-- Back Navigation -->
			<div class="flex items-center justify-between">
				<button
					type="button"
					@click="router.back()"
					class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to Dashboard
				</button>

				<div class="flex items-center gap-2">
					<button
						type="button"
						@click="fetchData"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
					>
						<RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isLoading }" />
						Refresh
					</button>
				</div>
			</div>

			<!-- Loading Skeleton -->
			<div v-if="isLoading" class="animate-pulse space-y-6">
				<div class="h-36 rounded-2xl bg-slate-200"></div>
				<div class="grid gap-4 sm:grid-cols-4">
					<div class="h-24 rounded-2xl bg-slate-200"></div>
					<div class="h-24 rounded-2xl bg-slate-200"></div>
					<div class="h-24 rounded-2xl bg-slate-200"></div>
					<div class="h-24 rounded-2xl bg-slate-200"></div>
				</div>
				<div class="h-16 rounded-2xl bg-slate-200"></div>
				<div class="space-y-4">
					<div class="h-40 rounded-2xl bg-slate-200"></div>
					<div class="h-40 rounded-2xl bg-slate-200"></div>
					<div class="h-40 rounded-2xl bg-slate-200"></div>
				</div>
			</div>

			<!-- Main Content -->
			<template v-else>
				<!-- Teacher Header Banner Card -->
				<section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
					<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-5">
							<div class="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-white text-2xl shadow-md shadow-indigo-600/20">
								{{ (teacher.firstname?.charAt(0) || '').toUpperCase() + (teacher.lastname?.charAt(0) || '').toUpperCase() }}
							</div>
							<div>
								<div class="flex flex-wrap items-center gap-2.5">
									<h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
										{{ teacher.firstname }} {{ teacher.lastname }}
									</h1>
									<span class="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700">
										Evaluation Comments
									</span>
								</div>
								<p class="mt-1 text-sm font-medium text-slate-500">{{ teacher.email }}</p>
								<div class="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
									<span class="flex items-center gap-1.5">
										<BookOpen class="h-4 w-4 text-indigo-500" />
										{{ teacher.subject_name || 'General' }}
									</span>
									<span class="flex items-center gap-1.5">
										<Clock class="h-4 w-4 text-indigo-500" />
										Quarter {{ teacher.quarter || '1' }}
									</span>
									<span class="flex items-center gap-1.5">
										<Calendar class="h-4 w-4 text-indigo-500" />
										Year {{ teacher.year || '2026' }}
									</span>
								</div>
							</div>
						</div>

						<div class="flex flex-col items-start sm:items-end gap-1.5 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
							<span class="text-xs font-bold uppercase tracking-wider text-slate-400">Combined Rating</span>
							<div class="flex items-baseline gap-2">
								<span class="text-3xl font-black text-indigo-600">{{ stats.combinedAvg ? stats.combinedAvg.toFixed(2) : '0.00' }}</span>
								<span class="text-xs font-bold text-slate-400">/ 5.00</span>
							</div>
							<span class="text-xs font-medium text-slate-500">
								{{ stats.totalCount || 0 }} total evaluator{{ stats.totalCount === 1 ? '' : 's' }}
							</span>
						</div>
					</div>
				</section>

				<!-- Summary Stats Grid -->
				<section class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Notes</span>
							<MessageSquare class="h-4 w-4 text-slate-400" />
						</div>
						<span class="mt-2 text-2xl font-black text-slate-900">{{ totalMatchingCount }}</span>
						<span class="mt-1 text-[11px] font-medium text-slate-500">Comments received</span>
					</div>

					<div class="flex flex-col rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold uppercase tracking-wider text-indigo-700">Student Notes</span>
							<GraduationCap class="h-4 w-4 text-indigo-600" />
						</div>
						<span class="mt-2 text-2xl font-black text-indigo-900">{{ studentCommentsCount }}</span>
						<span class="mt-1 text-[11px] font-medium text-indigo-600/80">From learners</span>
					</div>

					<div class="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold uppercase tracking-wider text-emerald-700">Peer Notes</span>
							<Users class="h-4 w-4 text-emerald-600" />
						</div>
						<span class="mt-2 text-2xl font-black text-emerald-900">{{ peerCommentsCount }}</span>
						<span class="mt-1 text-[11px] font-medium text-emerald-600/80">From colleagues</span>
					</div>

					<div class="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold uppercase tracking-wider text-slate-500">Student Avg</span>
							<UserCheck class="h-4 w-4 text-slate-400" />
						</div>
						<span class="mt-2 text-2xl font-black text-slate-900">{{ stats.studentAvg ? stats.studentAvg.toFixed(2) : '0.00' }}</span>
						<span class="mt-1 text-[11px] font-medium text-slate-500">Peer Avg: {{ stats.peerAvg ? stats.peerAvg.toFixed(2) : '0.00' }}</span>
					</div>
				</section>

				<!-- Category Tab Navigation -->
				<div class="flex border-b border-slate-200">
					<nav class="-mb-px flex space-x-6 sm:space-x-8" aria-label="Comment Tabs">
						<button
							type="button"
							@click="activeTab = 'all'"
							:class="[
								'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all',
								activeTab === 'all'
									? 'border-indigo-600 text-indigo-600'
									: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
							]"
						>
							<MessageSquare class="h-4 w-4" />
							All Comments
							<span
								:class="[
									'ml-1.5 rounded-full py-0.5 px-2 text-xs font-black',
									activeTab === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
								]"
							>
								{{ totalMatchingCount }}
							</span>
						</button>

						<button
							type="button"
							@click="activeTab = 'student'"
							:class="[
								'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all',
								activeTab === 'student'
									? 'border-indigo-600 text-indigo-600'
									: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
							]"
						>
							<GraduationCap class="h-4 w-4" />
							Student Evaluations
							<span
								:class="[
									'ml-1.5 rounded-full py-0.5 px-2 text-xs font-black',
									activeTab === 'student' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
								]"
							>
								{{ studentCommentsCount }}
							</span>
						</button>

						<button
							type="button"
							@click="activeTab = 'peer'"
							:class="[
								'flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all',
								activeTab === 'peer'
									? 'border-emerald-600 text-emerald-600'
									: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
							]"
						>
							<Users class="h-4 w-4" />
							Peer Evaluations
							<span
								:class="[
									'ml-1.5 rounded-full py-0.5 px-2 text-xs font-black',
									activeTab === 'peer' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
								]"
							>
								{{ peerCommentsCount }}
							</span>
						</button>
					</nav>
				</div>

				<!-- Search, Sentiment Filter & Sort Bar -->
				<section class="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
					<!-- Search Box -->
					<div class="relative flex-1">
						<Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							v-model="searchQuery"
							placeholder="Search comments and keywords..."
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>

					<!-- Filter Controls -->
					<div class="flex flex-wrap items-center gap-2.5">
						<!-- Sentiment Filter -->
						<div class="flex items-center gap-1.5">
							<select
								v-model="selectedSentiment"
								class="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							>
								<option value="all">All Sentiments</option>
								<option value="positive">Good / Very Good</option>
								<option value="neutral">Average / Neutral</option>
								<option value="negative">Poor / Very Poor</option>
							</select>
						</div>

						<!-- Sort Selector -->
						<div class="flex items-center gap-1.5">
							<select
								v-model="sortBy"
								class="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
								<option value="highest">Highest Rating</option>
								<option value="lowest">Lowest Rating</option>
							</select>
						</div>

						<!-- Only with text checkbox -->
						<label class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 select-none shadow-xs hover:bg-slate-50">
							<input
								type="checkbox"
								v-model="onlyWithText"
								class="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<span>Only with written text</span>
						</label>
					</div>
				</section>

				<!-- Comments Feed List -->
				<div v-if="filteredComments.length === 0" class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
						<MessageSquare class="h-7 w-7" />
					</div>
					<h3 class="text-base font-bold text-slate-900">No Comments Found</h3>
					<p class="mt-1 max-w-sm text-sm text-slate-500">
						{{ searchQuery ? 'No comments match your search criteria. Try a different keyword or filter.' : 'No evaluation comments have been recorded for this section yet.' }}
					</p>
					<button
						v-if="searchQuery || selectedSentiment !== 'all' || !onlyWithText"
						@click="searchQuery = ''; selectedSentiment = 'all'; onlyWithText = true;"
						class="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
					>
						Reset Filters
					</button>
				</div>

				<div v-else class="space-y-4">
					<article
						v-for="comment in filteredComments"
						:key="comment.id"
						class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md"
					>
						<!-- Card Top Details -->
						<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
							<div class="flex items-center gap-3">
								<span
									:class="[
										'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
										comment.type === 'student'
											? 'bg-indigo-50 text-indigo-700 border-indigo-200'
											: 'bg-emerald-50 text-emerald-700 border-emerald-200'
									]"
								>
									<component :is="comment.type === 'student' ? GraduationCap : Users" class="h-3.5 w-3.5" />
									{{ comment.typeLabel }}
								</span>

								<span
									:class="[
										'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border',
										getSentimentBadgeClass(comment.sentiment)
									]"
								>
									{{ comment.sentiment }}
								</span>
							</div>

							<div class="flex items-center gap-3">
								<span class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-extrabold" :class="getScoreBadgeClass(comment.avg)">
									★ {{ comment.avg.toFixed(2) }}
								</span>
								<span class="text-xs font-medium text-slate-400">
									{{ formatDate(comment.created_at) }}
								</span>
							</div>
						</div>

						<!-- Card Comment Body -->
						<div class="mt-4 flex items-start gap-3.5">
							<div class="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-400">
								<Quote class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<p v-if="comment.feedback" class="text-[15px] leading-relaxed text-slate-800 font-normal whitespace-pre-line">
									"{{ comment.feedback }}"
								</p>
								<p v-else class="text-xs italic text-slate-400">
									(No written remarks provided for this submission.)
								</p>
							</div>
						</div>
					</article>
				</div>
			</template>
		</div>
	</div>
</template>
