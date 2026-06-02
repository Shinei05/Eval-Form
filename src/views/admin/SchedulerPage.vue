<script setup>
import { ref, onMounted, watch } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";

const { request, isLoading } = useApi();
const { requireAuth } = useAuth();

const toast = ref({ visible: false, message: "", type: "info" });
function notify(msg, type = "info") {
	toast.value = { visible: true, message: msg, type };
}

const periodLabels = ["1st", "2nd", "3rd", "4th"];
const schedule = ref([]);
const selectedPeriod = ref(1);
const form = ref({
	school_year: "",
	date_start: "",
	time_start: "",
	date_end: "",
	time_end: "",
});

function buildEmptyPeriods() {
	return periodLabels.map((label) => ({
		label,
		date_start: "",
		time_start: "",
		date_end: "",
		time_end: "",
	}));
}

function mapScheduleToPeriods(times) {
	return periodLabels.map((label, idx) => {
		const i = idx + 1;
		return {
			label,
			school_year: times?.school_year || "",
			date_start: times?.[`p${i}_date_start`] || "",
			time_start: times?.[`p${i}_time_start`] || "",
			date_end: times?.[`p${i}_date_end`] || "",
			time_end: times?.[`p${i}_time_end`] || "",
		};
	});
}

schedule.value = buildEmptyPeriods();

async function fetchSchedule() {
	const result = await request(API.schedule, { body: { action: "getTime" } });
	if (result.success && result.times) {
		schedule.value = mapScheduleToPeriods(result.times);
		loadSelectedPeriod();
	}
}

async function saveSchedule() {
	const current = schedule.value[selectedPeriod.value - 1];
	if (current?.date_start || current?.time_start || current?.date_end || current?.time_end) {
		notify("Schedule already set for this period", "error");
		return;
	}

	const result = await request(API.setSchedule, {
		body: {
			action: "setTime",
			period: selectedPeriod.value,
			school_year: form.value.school_year,
			date_start: form.value.date_start,
			time_start: form.value.time_start,
			date_end: form.value.date_end,
			time_end: form.value.time_end,
		},
	});
	if (result.success) {
		notify("Schedule saved successfully", "success");
		fetchSchedule();
		form.value = { school_year: "", date_start: "", time_start: "", date_end: "", time_end: "" };
	} else {
		notify(result.message || "Failed to save schedule", "error");
	}
}

function loadSelectedPeriod() {
	const current = schedule.value[selectedPeriod.value - 1];
	form.value = {
		school_year: current?.school_year || "",
		date_start: current?.date_start || "",
		time_start: current?.time_start || "",
		date_end: current?.date_end || "",
		time_end: current?.time_end || "",
	};
}

watch(selectedPeriod, () => {
	loadSelectedPeriod();
});

onMounted(() => {
	if (!requireAuth()) return;
	fetchSchedule();
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast v-bind="toast" @update:visible="toast.visible = $event" />

	<div class="scheduler-page">
		<h2 class="page-title">Schedule Management</h2>
		<p class="page-desc">
			Set and manage evaluation periods for the school
		</p>

		<div class="schedule-layout">
			<!-- Current Schedule -->
			<div class="current-card card">
				<h3>
					<span class="material-icons">event</span>
					Current Schedule
				</h3>
				<div class="period-list">
					<div v-for="period in schedule" :key="period.label" class="period-card">
						<h4 class="period-title">{{ period.label }} Period</h4>
						<div class="schedule-grid">
							<div class="schedule-item">
								<span class="label">School Year</span>
								<span class="value">{{ period.school_year || "—" }}</span>
							</div>
							<div class="schedule-item">
								<span class="label">Start Date</span>
								<span class="value">{{ period.date_start || "—" }}</span>
							</div>
							<div class="schedule-item">
								<span class="label">Start Time</span>
								<span class="value">{{ period.time_start || "—" }}</span>
							</div>
							<div class="schedule-item">
								<span class="label">End Date</span>
								<span class="value">{{ period.date_end || "—" }}</span>
							</div>
							<div class="schedule-item">
								<span class="label">End Time</span>
								<span class="value">{{ period.time_end || "—" }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Set Schedule -->
			<div class="form-card card">
				<h3>
					<span class="material-icons">edit_calendar</span>
					Set New Schedule
				</h3>
				<p class="form-desc">
					Define the evaluation period start and end dates
				</p>

				<form @submit.prevent="saveSchedule" class="form-layout">
					<div class="form-section">
						<div class="form-section-header">
							<span class="material-icons">calendar_month</span>
							<h4>Evaluation Period</h4>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label>Period</label>
								<select v-model.number="selectedPeriod" class="period-select">
									<option v-for="(label, idx) in periodLabels" :key="label" :value="idx + 1">
										{{ label }} Period
									</option>
								</select>
							</div>
							<div class="form-group">
								<label>School Year</label>
								<input type="text" v-model="form.school_year" placeholder="2024-2025" required />
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label>Start Date</label>
								<input type="date" v-model="form.date_start" required />
							</div>
							<div class="form-group">
								<label>Start Time</label>
								<input type="time" v-model="form.time_start" required />
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label>End Date</label>
								<input type="date" v-model="form.date_end" required />
							</div>
							<div class="form-group">
								<label>End Time</label>
								<input type="time" v-model="form.time_end" required />
							</div>
						</div>
						<p v-if="schedule[selectedPeriod - 1]?.date_start" class="period-warning">
							Schedule already set for this period.
						</p>
					</div>

					<button type="submit" class="btn btn-primary" style="align-self: flex-start;">
						<span class="material-icons" style="font-size: 1.125rem">save</span>
						Save Schedule
					</button>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
.scheduler-page {
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

.schedule-layout {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-6);
	align-items: start;
}

.current-card,
.form-card {
	padding: var(--space-6);
}

.current-card h3,
.form-card h3 {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
	font-size: 1.0625rem;
}

.current-card h3 .material-icons,
.form-card h3 .material-icons {
	color: var(--color-primary);
}

.schedule-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.period-select {
	width: 100%;
	padding: 0.625rem 0.875rem;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md);
	font-size: 0.875rem;
	color: #0f172a;
	background: #fff;
}

.period-warning {
	margin-top: var(--space-3);
	font-size: 0.8125rem;
	color: #b45309;
	background: #fffbeb;
	border: 1px solid #fcd34d;
	border-radius: var(--radius-md);
	padding: 0.5rem 0.75rem;
}

.period-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.period-card {
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-4);
	background: #ffffff;
}

.period-title {
	font-size: 0.95rem;
	font-weight: 700;
	margin-bottom: var(--space-3);
}

.schedule-item {
	background: #f8fafc;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	padding: var(--space-3) var(--space-4);
}

.schedule-item .label {
	display: block;
	font-size: 0.7rem;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: var(--space-1);
}

.schedule-item .value {
	font-weight: 700;
	font-size: 1rem;
	color: var(--color-text);
}

.form-desc {
	font-size: 0.8125rem;
	color: var(--color-text-muted);
	margin-bottom: var(--space-5);
}

.form-layout {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
}

.form-section {
	background: #f8fafc;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-5);
}

.form-section-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
}

.form-section-header .material-icons {
	font-size: 1.25rem;
	color: var(--color-primary);
}

.form-section-header h4 {
	font-size: 0.9375rem;
	font-weight: 600;
	margin: 0;
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.form-row.single {
	grid-template-columns: 1fr;
}

.btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}

@media (max-width: 900px) {
	.schedule-layout {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.schedule-grid {
		grid-template-columns: 1fr;
	}
	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
