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
		legend: { display: false }, // using custom HTML legend
		tooltip: {
			backgroundColor: "#1e293b",
			callbacks: {
				label: (ctx) => {
					const val = ctx.raw;
					const range = scoreRanges.find(r => val >= r.min && val < r.max) || scoreRanges[1];
					const grade = range.label.split(' ')[0];
					return ` Grade: ${grade} (${val.toFixed(2)})`;
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
		<!-- Loading -->
		<div v-if="isLoading" class="loading-overlay">
			<div class="spinner"></div>
			<p>Loading performance data…</p>
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
			<div class="card">
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
		</div>
	</div>
</template>

<style scoped>
.perf-page {
	min-height: 100vh;
	background: var(--color-bg-page, #f9fafb);
	padding: 1.5rem;
}

.toolbar {
	max-width: 900px;
	margin: 0 auto 1.25rem;
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

.page-label {
	font-size: 0.8rem;
	color: var(--color-text-secondary, #6b7280);
}

.graph-container {
	max-width: 900px;
	margin: 0 auto;
}

.card {
	background: #fff;
	border: 1px solid var(--color-border, #e5e7eb);
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.06));
}

.card-title {
	font-size: 1.1rem;
	font-weight: 600;
	margin-bottom: 1rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px solid var(--color-border, #e5e7eb);
	color: var(--color-text, #111827);
}

/* Summary chips */
.summary-row {
	display: flex;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
	flex-wrap: wrap;
}

.summary-chip {
	flex: 1;
	min-width: 100px;
	background: var(--color-bg-page, #f8fafc);
	border: 1px solid var(--color-border, #e5e7eb);
	border-radius: 10px;
	padding: 0.6rem 1rem;
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
	min-height: 300px;
	display: flex;
	align-items: center;
	justify-content: center;
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
</style>
