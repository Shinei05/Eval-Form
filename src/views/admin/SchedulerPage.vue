<script setup>
import { ref, onMounted, watch, computed } from "vue";
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

// ── Confirmation modal state ────────────────────────────────
const confirmModal = ref({
	visible: false,
	title: "",
	message: "",
	confirmLabel: "",
	confirmClass: "btn-primary",
	action: null, // callback to run on confirm
});

function showConfirm({ title, message, confirmLabel, confirmClass = "btn-primary", action }) {
	confirmModal.value = { visible: true, title, message, confirmLabel, confirmClass, action };
}

function onConfirm() {
	const action = confirmModal.value.action;
	confirmModal.value.visible = false;
	if (action) action();
}

function onCancelConfirm() {
	confirmModal.value.visible = false;
}

// ── Schedule data ───────────────────────────────────────────
function buildEmptyPeriods() {
	return periodLabels.map((label) => ({
		label,
		school_year: "",
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

const selectedPeriodData = computed(() => schedule.value[selectedPeriod.value - 1]);
const isPeriodSet = computed(() => !!selectedPeriodData.value?.date_start);

// ── Save (with overwrite confirmation if period already set) ─
function trySaveSchedule() {
	if (isPeriodSet.value) {
		showConfirm({
			title: "Overwrite Existing Schedule?",
			message: `The ${periodLabels[selectedPeriod.value - 1]} Period already has a schedule set. Overwriting it may affect users who are currently mid-evaluation. Are you sure you want to continue?`,
			confirmLabel: "Yes, Overwrite",
			confirmClass: "btn-danger",
			action: saveSchedule,
		});
	} else {
		saveSchedule();
	}
}

async function saveSchedule() {
	const result = await request(API.setSchedule, {
		body: {
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

// ── Clear period (with confirmation) ───────────────────────
function tryClearPeriod(periodIndex) {
	const num = periodIndex + 1;
	const label = periodLabels[periodIndex];
	showConfirm({
		title: `Clear ${label} Period?`,
		message: `This will permanently remove the schedule for the ${label} Period. Any users currently logged in during this period may be affected. This action cannot be undone.`,
		confirmLabel: "Yes, Clear Period",
		confirmClass: "btn-danger",
		action: () => clearPeriod(num),
	});
}

async function clearPeriod(periodNumber) {
	const result = await request(API.resetSchedule, { body: { period: periodNumber } });
	if (result.success) {
		notify(`${periodLabels[periodNumber - 1]} Period cleared`, "success");
		fetchSchedule();
	} else {
		notify(result.message || "Failed to clear period", "error");
	}
}

// ── Form sync ───────────────────────────────────────────────
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

	<!-- Confirmation Modal -->
	<Transition name="fade">
		<div v-if="confirmModal.visible" class="confirm-backdrop" @click.self="onCancelConfirm">
			<Transition name="modal">
				<div class="confirm-card" v-if="confirmModal.visible">
					<div class="confirm-icon-wrap">
						<span class="material-icons confirm-icon">warning_amber</span>
					</div>
					<h3 class="confirm-title">{{ confirmModal.title }}</h3>
					<p class="confirm-message">{{ confirmModal.message }}</p>
					<div class="confirm-actions">
						<button class="btn btn-ghost" @click="onCancelConfirm">Cancel</button>
						<button :class="['btn', confirmModal.confirmClass]" @click="onConfirm">
							{{ confirmModal.confirmLabel }}
						</button>
					</div>
				</div>
			</Transition>
		</div>
	</Transition>

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
					<div v-for="(period, idx) in schedule" :key="period.label" class="period-card">
						<div class="period-header">
							<h4 class="period-title">{{ period.label }} Period</h4>
							<button
								v-if="period.date_start"
								class="btn-clear"
								title="Clear this period"
								@click="tryClearPeriod(idx)"
							>
								<span class="material-icons">delete_outline</span>
								Clear
							</button>
						</div>
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
					{{ isPeriodSet ? "Edit Schedule" : "Set New Schedule" }}
				</h3>
				<p class="form-desc">
					Define the evaluation period start and end dates
				</p>

				<form @submit.prevent="trySaveSchedule" class="form-layout">
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

						<p v-if="isPeriodSet" class="period-warning">
							<span class="material-icons" style="font-size:1rem;vertical-align:middle;">edit</span>
							This period already has a schedule. Saving will overwrite it.
						</p>
					</div>

					<button type="submit" class="btn btn-primary" style="align-self: flex-start;">
						<span class="material-icons" style="font-size: 1.125rem">save</span>
						{{ isPeriodSet ? "Update Schedule" : "Save Schedule" }}
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
	display: flex;
	align-items: center;
	gap: var(--space-1);
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

.period-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: var(--space-3);
}

.period-title {
	font-size: 0.95rem;
	font-weight: 700;
	margin: 0;
}

.btn-clear {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	font-size: 0.75rem;
	font-weight: 600;
	color: #dc2626;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
}

.btn-clear:hover {
	background: #fee2e2;
	border-color: #fca5a5;
}

.btn-clear .material-icons {
	font-size: 0.9rem;
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
	margin-bottom: var(--space-3);
}

.btn {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}

/* ── Confirmation Modal ──────────────────────────────────── */
.confirm-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--space-4);
}

.confirm-card {
	background: #fff;
	border-radius: var(--radius-xl);
	width: 100%;
	max-width: 420px;
	padding: var(--space-8);
	text-align: center;
	box-shadow: 0 20px 60px -10px rgba(0,0,0,0.3);
}

.confirm-icon-wrap {
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: #fffbeb;
	border: 2px solid #fcd34d;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto var(--space-4);
}

.confirm-icon {
	font-size: 2rem;
	color: #d97706;
}

.confirm-title {
	font-size: 1.125rem;
	font-weight: 700;
	color: #0f172a;
	margin-bottom: var(--space-3);
}

.confirm-message {
	font-size: 0.875rem;
	color: #64748b;
	line-height: 1.6;
	margin-bottom: var(--space-6);
}

.confirm-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: center;
}

.btn-ghost {
	background: #f1f5f9;
	color: #475569;
	border: 1px solid #e2e8f0;
	padding: 0.625rem 1.25rem;
	border-radius: var(--radius-md);
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}

.btn-ghost:hover {
	background: #e2e8f0;
}

.btn-danger {
	background: #dc2626;
	color: #fff;
	border: none;
	padding: 0.625rem 1.25rem;
	border-radius: var(--radius-md);
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s;
}

.btn-danger:hover {
	background: #b91c1c;
}

/* ── Transitions ─────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
	transform: scale(0.95);
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

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(5px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
