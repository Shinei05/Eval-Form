<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Bar } from "vue-chartjs";
import {
	Chart as ChartJS,
	Title,
	Tooltip,
	Legend,
	BarElement,
	CategoryScale,
	LinearScale,
} from "chart.js";

ChartJS.register(
	Title,
	Tooltip,
	Legend,
	BarElement,
	CategoryScale,
	LinearScale,
);

import API from "../../utils/api";
import { useApi } from "../../composables/useApi";
import { ArrowLeft, BarChart2, CheckCircle2 } from "@lucide/vue";

/* ── props ────────────────────────────────────────────── */
const props = defineProps({
	type: {
		type: String,
		required: true,
		validator: (v) => ["student", "teacher"].includes(v),
	},
});

const route = useRoute();
const { request } = useApi();

/* ── Score color ranges ───────────────────────────────── */
const scoreRanges = [
	{ label: "Excellent (4.5–5.0)", min: 4.5, max: 5.01, color: "#16a34a", bg: "#16a34a", border: "#16a34a" },
	{ label: "Good (3.5–4.4)",      min: 3.5, max: 4.5,  color: "#2563eb", bg: "#2563eb",  border: "#2563eb" },
	{ label: "Fair (2.5–3.4)",      min: 2.5, max: 3.5,  color: "#d97706", bg: "#d97706",  border: "#d97706" },
	{ label: "Poor (1.0–2.4)",      min: 1.0, max: 2.5,  color: "#dc2626", bg: "#dc2626",  border: "#dc2626" },
];

function getColor(avg, key) {
	const range = scoreRanges.find(r => avg >= r.min && avg < r.max);
	return range ? range[key] : scoreRanges[1][key];
}

function getGradeText(avg) {
	const range = scoreRanges.find(r => avg >= r.min && avg < r.max);
	return range ? range.label.split(' ')[0] : scoreRanges[1].label.split(' ')[0];
}

/* ── state ────────────────────────────────────────────── */
const isLoading = ref(true);
const averages = ref([]);

const chartData = reactive({
	labels: [],
	datasets: [],
});

const chartOptions = {
	responsive: true,
	maintainAspectRatio: true,
	aspectRatio: 2.5,
	plugins: {
		legend: { display: false },
		tooltip: {
			backgroundColor: "#0f172a",
			padding: 12,
			cornerRadius: 8,
			titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: "bold" },
			bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
			callbacks: {
				title: (items) => {
					if (!items.length) return "";
					const idx = items[0].dataIndex;
					const item = averages.value[idx];
					return item ? `Section ${idx + 1}: ${item.section}` : items[0].label;
				},
				label: (ctx) => {
					const val = ctx.raw;
					const range = scoreRanges.find(r => val >= r.min && val < r.max) || scoreRanges[1];
					const grade = range.label.split(' ')[0];
					return ` Average Rating: ${val.toFixed(2)} / 5.00 (${grade})`;
				},
			},
		},
	},
	scales: {
		x: {
			display: true,
			grid: { display: false },
			title: {
				display: true,
				text: "Question Section",
				color: "#64748b",
				font: { size: 12 },
			},
		},
		y: {
			beginAtZero: true,
			max: 5,
			ticks: {
				stepSize: 1,
				callback: function (value) {
					if (value === 5) return 'Excellent (5.0)';
					if (value === 4) return 'Good (4.0)';
					if (value === 3) return 'Fair (3.0)';
					if (value === 2) return 'Poor (2.0)';
					if (value === 1) return 'Poor (1.0)';
					return value;
				},
			},
			title: {
				display: true,
				text: "Grade",
				color: "#64748b",
				font: { size: 12 },
			},
		},
	},
};

/* ── endpoint map ─────────────────────────────────────── */
const chartUrl =
	props.type === "student" ? API.evalChartStudent : API.evalChartTeacher;
const chartAction =
	props.type === "student" ? "getChartData" : "getChartDataT";

/* ── data fetching ────────────────────────────────────── */
async function fetchChartData() {
	const res = await request(chartUrl, {
		body: { action: chartAction, tcr_id: route.params.id },
	});
	if (res?.success && res.average?.length) {
		averages.value = res.average;
		chartData.labels = res.average.map(
			(a, i) => `Section ${i + 1}`,
		);
		const scores = res.average.map((a) => Number(Number(a.average).toFixed(2)));
		chartData.datasets = [
			{
				label: "Average Rating",
				data: scores,
				backgroundColor: scores.map((v) => getColor(v, "bg")),
				borderColor: scores.map((v) => getColor(v, "border")),
				borderWidth: 1,
				borderRadius: 6,
			},
		];
	}
}

onMounted(async () => {
	isLoading.value = true;
	await fetchChartData();
	isLoading.value = false;
});
</script>

<template>
	<div class="perf-page">
		<!-- Skeleton Loading State (Matches 2-Column Graph & Breakdown Layout) -->
		<div v-if="isLoading" class="perf-skeleton-wrapper">
			<div class="toolbar">
				<div class="sk-pill sk-w-28"></div>
				<div class="sk-pill sk-w-48"></div>
			</div>
			<div class="graph-container">
				<div class="perf-grid">
					<div class="card sk-card">
						<div class="sk-line sk-w-48 sk-h-6 mb-4"></div>
						<div class="summary-row">
							<div class="sk-chip"></div>
							<div class="sk-chip"></div>
							<div class="sk-chip"></div>
							<div class="sk-chip"></div>
						</div>
						<div class="sk-chart-box"></div>
					</div>
					<div class="card sk-card">
						<div class="sk-line sk-w-56 sk-h-6 mb-4"></div>
						<div class="category-grid">
							<div class="sk-cat-item"></div>
							<div class="sk-cat-item"></div>
							<div class="sk-cat-item"></div>
							<div class="sk-cat-item"></div>
							<div class="sk-cat-item"></div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Back link -->
		<div class="toolbar">
			<button type="button" @click="$router.back()" class="btn-back"
				>← Back</button
			>
			<span class="page-label">
				Performance —
				{{ type === "student" ? "Student Evaluations" : "Teacher Evaluations" }}
			</span>
		</div>

		<div class="graph-container">
			<div class="perf-grid">
				<!-- Left Card: Overall Performance Graph -->
				<div class="card perf-graph-card">
					<h2 class="card-title">Overall Performance Graph</h2>

					<!-- Summary chips -->
					<div v-if="!isLoading && averages.length" class="summary-row">
						<div class="summary-chip">
							<span class="chip-label">Overall Avg</span>
							<span class="chip-value">
								{{ getGradeText(averages.reduce((s, a) => s + Number(a.average), 0) / averages.length) }}
								({{ (averages.reduce((s, a) => s + Number(a.average), 0) / averages.length).toFixed(2) }})
							</span>
						</div>
						<div class="summary-chip">
							<span class="chip-label">Sections</span>
							<span class="chip-value">{{ averages.length }}</span>
						</div>
						<div class="summary-chip">
							<span class="chip-label">Highest</span>
							<span class="chip-value">
								{{ getGradeText(Math.max(...averages.map((a) => Number(a.average)))) }}
								({{ Math.max(...averages.map((a) => Number(a.average))).toFixed(2) }})
							</span>
						</div>
						<div class="summary-chip">
							<span class="chip-label">Lowest</span>
							<span class="chip-value">
								{{ getGradeText(Math.min(...averages.map((a) => Number(a.average)))) }}
								({{ Math.min(...averages.map((a) => Number(a.average))).toFixed(2) }})
							</span>
						</div>
					</div>

					<!-- Chart -->
					<div class="chart-wrap">
						<Bar
							v-if="chartData.datasets.length"
							:data="chartData"
							:options="chartOptions"
						/>
						<div v-else-if="!isLoading" class="empty-state">
							<span class="material-icons">bar_chart</span>
							<p>No chart data available for this teacher.</p>
						</div>
					</div>

					<!-- Custom color legend -->
					<div v-if="chartData.datasets.length" class="legend">
						<div
							v-for="range in scoreRanges"
							:key="range.label"
							class="legend-item"
						>
							<span class="legend-dot" :style="{ background: range.color }"></span>
							<span class="legend-label">{{ range.label }}</span>
						</div>
					</div>
				</div>

				<!-- Right Card: Category Average Breakdown -->
				<div v-if="!isLoading && averages.length" class="card perf-breakdown-card">
					<h2 class="card-title flex-title">
						<BarChart2 class="title-icon" /> Category Averages Breakdown
					</h2>
					<div class="category-grid">
						<div
							v-for="(item, idx) in averages"
							:key="item.section || idx"
							class="category-item-card"
							:style="{ borderLeftColor: getColor(item.average, 'color') }"
						>
							<div class="cat-card-header">
								<div class="cat-meta">
									<span class="cat-badge">Section {{ idx + 1 }}</span>
									<span class="cat-name">{{ item.section }}</span>
								</div>
								<div
									class="cat-score-badge"
									:style="{
										backgroundColor: getColor(item.average, 'bg') + '15',
										color: getColor(item.average, 'color'),
										borderColor: getColor(item.average, 'border') + '50'
									}"
								>
									<strong>{{ Number(item.average).toFixed(2) }}</strong> / 5.00
									<span class="cat-grade-tag">({{ getGradeText(item.average) }})</span>
								</div>
							</div>
							<div class="cat-bar-track">
								<div
									class="cat-bar-fill"
									:style="{
										width: (Number(item.average) / 5 * 100) + '%',
										backgroundColor: getColor(item.average, 'color')
									}"
								></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.perf-page {
	min-height: 100vh;
	background: #f4f6fa;
	padding: 1.5rem;
	font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
	color: #0f172a;
}

.toolbar {
	max-width: 1400px;
	margin: 0 auto 1.25rem;
	display: flex;
	align-items: center;
	gap: 1rem;
}

.btn-back {
	font-size: 0.875rem;
	color: #4f46e5;
	text-decoration: none;
	font-weight: 600;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	padding: 0.4rem 0.85rem;
	border-radius: 8px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	transition: all 0.15s ease;
}

.btn-back:hover {
	background: #f8fafc;
	color: #4338ca;
}

.page-label {
	font-size: 0.8rem;
	color: var(--color-text-secondary, #6b7280);
}

.graph-container {
	max-width: 1400px;
	margin: 0 auto;
}

.perf-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.5rem;
}

@media (min-width: 1024px) {
	.perf-grid {
		grid-template-columns: 1.15fr 0.85fr;
		align-items: start;
	}
}

.card {
	background: #fff;
	border: 1px solid var(--color-border, #e5e7eb);
	border-radius: 12px;
	padding: 1rem;
	box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.06));
}

@media (min-width: 640px) {
	.card {
		padding: 1.5rem;
	}
}

.card-title {
	font-size: 1.1rem;
	font-weight: 700;
	margin-bottom: 1rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px solid var(--color-border, #e5e7eb);
	color: var(--color-text, #111827);
}

.flex-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

/* Summary chips */
.summary-row {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
	flex-wrap: wrap;
}

.summary-chip {
	flex: 1 1 calc(50% - 0.5rem);
	min-width: 110px;
	background: var(--color-bg-page, #f8fafc);
	border: 1px solid var(--color-border, #e5e7eb);
	border-radius: 10px;
	padding: 0.6rem 0.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	text-align: center;
}

.chip-label {
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-text-muted, #94a3b8);
}

.chip-value {
	font-size: 1rem;
	font-weight: 800;
	color: var(--color-primary, #4f46e5);
}

/* Chart */
.chart-wrap {
	min-height: 260px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow-x: auto;
	max-width: 100%;
}

/* Custom legend */
.legend {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5rem 1.25rem;
	margin-top: 1.25rem;
	padding-top: 1rem;
	border-top: 1px solid var(--color-border, #e5e7eb);
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.legend-dot {
	width: 12px;
	height: 12px;
	border-radius: 3px;
	flex-shrink: 0;
}

.legend-label {
	font-size: 0.8rem;
	color: var(--color-text-secondary, #374151);
	font-weight: 500;
}

/* Empty */
.empty-state {
	text-align: center;
	padding: 3rem 0;
	color: var(--color-text-muted, #94a3b8);
}

.empty-state .material-icons {
	font-size: 3rem;
	margin-bottom: 0.75rem;
	display: block;
}

.empty-state p {
	font-size: 0.875rem;
}

/* Spinner */
.loading-overlay {
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
	border: 3px solid #e5e7eb;
	border-top-color: var(--color-primary, #4f46e5);
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
	width: 2.5rem;
	height: 2.5rem;
	margin-bottom: 0.75rem;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

/* Category Breakdown Cards */
.category-breakdown-section {
	margin-top: 1.75rem;
	padding-top: 1.5rem;
	border-top: 1px solid #e2e8f0;
}

.breakdown-title {
	font-size: 1rem;
	font-weight: 800;
	color: #0f172a;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	letter-spacing: -0.01em;
}

.title-icon {
	width: 1.1rem;
	height: 1.1rem;
	color: #4f46e5;
}

.category-grid {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.category-item-card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-left-width: 4px;
	border-radius: 10px;
	padding: 0.85rem 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.cat-card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.cat-meta {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex: 1;
	min-width: 0;
}

.cat-badge {
	font-size: 0.7rem;
	font-weight: 800;
	color: #475569;
	background: #f1f5f9;
	padding: 0.2rem 0.5rem;
	border-radius: 6px;
	letter-spacing: 0.4px;
	flex-shrink: 0;
}

.cat-name {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.35;
	word-break: break-word;
}

.cat-score-badge {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.8rem;
	padding: 0.25rem 0.65rem;
	border-radius: 6px;
	border: 1px solid transparent;
	flex-shrink: 0;
	white-space: nowrap;
}

.cat-grade-tag {
	font-size: 0.725rem;
	font-weight: 600;
	opacity: 0.85;
	margin-left: 0.25rem;
}

.cat-bar-track {
	height: 6px;
	background: #f1f5f9;
	border-radius: 3px;
	overflow: hidden;
	width: 100%;
}

.cat-bar-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.3s ease;
}

/* ── Skeleton Loaders ────────────────────────── */
@keyframes shimmer {
	0% { opacity: 0.45; }
	50% { opacity: 0.85; }
	100% { opacity: 0.45; }
}

.perf-skeleton-wrapper {
	width: 100%;
	animation: shimmer 1.5s ease-in-out infinite;
}

.sk-pill {
	height: 1.5rem;
	background: #e2e8f0;
	border-radius: 999px;
}
.sk-w-28 { width: 7rem; }
.sk-w-48 { width: 12rem; }
.sk-w-56 { width: 14rem; }

.sk-line {
	background: #e2e8f0;
	border-radius: 4px;
}
.sk-h-6 { height: 1.5rem; }

.sk-chip {
	flex: 1 1 calc(50% - 0.5rem);
	min-width: 110px;
	height: 3.5rem;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
}

.sk-chart-box {
	height: 240px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	margin-top: 1rem;
}

.sk-cat-item {
	height: 4rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
}
</style>
