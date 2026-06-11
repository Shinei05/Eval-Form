<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
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

// Calendar State
const currentDate = ref(new Date());
const selectedDateStr = ref("");
const showFormModal = ref(false);
const showOverview = ref(false);
const isDateLocked = ref(false);
const lockedDateStr = ref("");

// Confirmation modal state
const confirmModal = ref({
	visible: false,
	title: "",
	message: "",
	confirmLabel: "",
	confirmClass: "btn-primary",
	action: null,
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

// ── Save ────────────────────────────────────────────────────
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
		showFormModal.value = false;
		fetchSchedule();
	} else {
		notify(result.message || "Failed to save schedule", "error");
	}
}

// ── Clear period ───────────────────────────────────────────
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

// ── Form sync and navigation helpers ───────────────────────
function loadSelectedPeriod() {
	const current = schedule.value[selectedPeriod.value - 1];
	form.value = {
		school_year: current?.school_year || schedule.value[0]?.school_year || "",
		date_start: isDateLocked.value ? lockedDateStr.value : (current?.date_start || ""),
		time_start: current?.time_start || "08:00",
		date_end: isDateLocked.value ? (current?.date_end || lockedDateStr.value) : (current?.date_end || ""),
		time_end: current?.time_end || "17:00",
	};
}

function openAddModal(dateStr) {
	selectedPeriod.value = 1;
	isDateLocked.value = !!dateStr;
	lockedDateStr.value = dateStr || "";
	form.value = {
		school_year: schedule.value[0]?.school_year || "",
		date_start: dateStr || "",
		time_start: "08:00",
		date_end: dateStr || "",
		time_end: "17:00",
	};
	showFormModal.value = true;
}

function openEditModal(periodNum) {
	selectedPeriod.value = periodNum;
	isDateLocked.value = false;
	lockedDateStr.value = "";
	loadSelectedPeriod();
	showFormModal.value = true;
}

// ── Month date logic ────────────────────────────────────────
const currentMonthName = computed(() => {
	return currentDate.value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
});

const todayStr = computed(() => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});

const calendarDays = computed(() => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();

	const firstDay = new Date(year, month, 1);
	const startDayOfWeek = firstDay.getDay();

	const totalDays = new Date(year, month + 1, 0).getDate();

	const prevMonthTotalDays = new Date(year, month, 0).getDate();
	const prevMonthDays = [];
	for (let i = startDayOfWeek - 1; i >= 0; i--) {
		const d = prevMonthTotalDays - i;
		const m = month === 0 ? 11 : month - 1;
		const y = month === 0 ? year - 1 : year;
		prevMonthDays.push({
			day: d,
			dateString: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
			isCurrentMonth: false,
		});
	}

	const currentDays = [];
	for (let d = 1; d <= totalDays; d++) {
		currentDays.push({
			day: d,
			dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
			isCurrentMonth: true,
		});
	}

	const nextMonthDays = [];
	const remainingCells = 42 - (prevMonthDays.length + currentDays.length);
	for (let d = 1; d <= remainingCells; d++) {
		const m = month === 11 ? 0 : month + 1;
		const y = month === 11 ? year + 1 : year;
		nextMonthDays.push({
			day: d,
			dateString: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
			isCurrentMonth: false,
		});
	}

	return [...prevMonthDays, ...currentDays, ...nextMonthDays];
});

function prevMonth() {
	currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
}

function nextMonth() {
	currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
}

function selectToday() {
	currentDate.value = new Date();
	selectedDateStr.value = todayStr.value;
}

function selectDate(dateStr) {
	selectedDateStr.value = dateStr;
}

// ── Overlap & formatting helpers ────────────────────────────
function getPeriodsForDate(dStr) {
	if (!dStr || !schedule.value || schedule.value.length === 0) return [];
	const d = new Date(`${dStr}T00:00:00`);
	const active = [];
	schedule.value.forEach((period, idx) => {
		if (!period.date_start || !period.date_end) return;
		const start = new Date(`${period.date_start}T00:00:00`);
		const end = new Date(`${period.date_end}T23:59:59`);
		if (d >= start && d <= end) {
			active.push({
				index: idx + 1,
				label: period.label,
				school_year: period.school_year,
				colorClass: `period-color-${idx + 1}`,
				data: period
			});
		}
	});
	return active;
}

function formatDateTime(dateStr, timeStr) {
	if (!dateStr) return "—";
	try {
		const dateObj = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
		if (isNaN(dateObj.getTime())) return `${dateStr} ${timeStr || ""}`;
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true
		});
	} catch (e) {
		return `${dateStr} ${timeStr || ""}`;
	}
}

function formatDateLabel(dStr) {
	if (!dStr) return "";
	try {
		const dateObj = new Date(`${dStr}T00:00:00`);
		if (isNaN(dateObj.getTime())) return dStr;
		return dateObj.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric"
		});
	} catch (e) {
		return dStr;
	}
}

function getPeriodStatus(period) {
	if (!period.date_start) {
		return { code: "unscheduled", label: "Unscheduled", class: "status-unscheduled" };
	}
	try {
		const now = new Date();
		const start = new Date(`${period.date_start}T${period.time_start || "00:00:00"}`);
		const end = new Date(`${period.date_end}T${period.time_end || "00:00:00"}`);
		
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return { code: "scheduled", label: "Scheduled", class: "status-scheduled" };
		}
		
		if (now < start) {
			return { code: "upcoming", label: "Upcoming", class: "status-upcoming" };
		} else if (now > end) {
			return { code: "completed", label: "Completed", class: "status-completed" };
		} else {
			return { code: "live", label: "Live Now", class: "status-live" };
		}
	} catch (e) {
		return { code: "scheduled", label: "Scheduled", class: "status-scheduled" };
	}
}

watch(selectedPeriod, () => {
	loadSelectedPeriod();
});

watch(showOverview, (newVal) => {
	if (newVal) {
		nextTick(() => {
			const el = document.querySelector(".all-periods-overview");
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "nearest" });
			}
		});
	}
});

// Watch modal states to lock body scrolling
watch(showFormModal, (val) => {
	if (val) {
		document.body.style.overflow = "hidden";
	} else {
		if (!confirmModal.value.visible) {
			document.body.style.overflow = "";
		}
	}
});

watch(() => confirmModal.value.visible, (val) => {
	if (val) {
		document.body.style.overflow = "hidden";
	} else {
		if (!showFormModal.value) {
			document.body.style.overflow = "";
		}
	}
});

onUnmounted(() => {
	document.body.style.overflow = "";
});

onMounted(() => {
	if (!requireAuth()) return;
	selectedDateStr.value = todayStr.value;
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
					<div class="confirm-icon-wrap" :class="confirmModal.confirmClass">
						<span class="material-icons confirm-icon">
							{{ confirmModal.confirmClass.includes('danger') ? 'warning' : 'info' }}
						</span>
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

	<!-- Schedule Configurator Modal -->
	<Transition name="fade">
		<div v-if="showFormModal" class="modal-backdrop" @click.self="showFormModal = false">
			<Transition name="modal">
				<div class="modal-card" v-if="showFormModal">
					<div class="modal-header">
						<span class="material-icons modal-icon" style="color: var(--color-primary)">
							edit_calendar
						</span>
						<h2>{{ isPeriodSet ? "Edit Period Schedule" : "Set Period Schedule" }}</h2>
						<p>Define start and end times for the evaluation period.</p>
					</div>

					<form @submit.prevent="trySaveSchedule" class="modal-body form-layout">
						<div class="form-section">
							<div class="form-row">
								<div class="form-group">
									<label>Target Period</label>
									<div class="select-wrapper">
										<select v-model.number="selectedPeriod" class="period-select" @change="loadSelectedPeriod">
											<option v-for="(label, idx) in periodLabels" :key="label" :value="idx + 1">
												{{ label }} Period
											</option>
										</select>
									</div>
								</div>
								<div class="form-group">
									<label>School Year</label>
									<input type="text" v-model="form.school_year" placeholder="e.g. 2024-2025" required />
								</div>
							</div>
							
							<div class="form-row">
								<div class="form-group">
									<label>Start Date</label>
									<input 
										type="date" 
										v-model="form.date_start" 
										:disabled="isDateLocked"
										:readonly="isDateLocked"
										:class="{ 'input-locked': isDateLocked }"
										required 
									/>
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

							<p v-if="isPeriodSet" class="period-warning-alert">
								<span class="material-icons">info</span>
								<span>Saving will overwrite the existing dates for this period.</span>
							</p>
						</div>

						<div class="modal-actions">
							<button type="button" class="btn btn-ghost" @click="showFormModal = false">
								Cancel
							</button>
							<button type="submit" class="btn btn-primary">
								<span class="material-icons">save</span>
								Save Schedule
							</button>
						</div>
					</form>
				</div>
			</Transition>
		</div>
	</Transition>

	<div class="scheduler-page">
		<div class="page-header">
			<h2 class="page-title">Schedule Management</h2>
			<p class="page-desc">
				Set and manage evaluation periods for the school
			</p>
		</div>

		<div class="schedule-layout">
			<!-- Calendar Panel -->
			<div class="calendar-card card">
				<div class="calendar-header">
					<div class="calendar-nav">
						<button class="btn-nav-arrow" @click="prevMonth" title="Previous month">
							<span class="material-icons">chevron_left</span>
						</button>
						<h3 class="current-month">{{ currentMonthName }}</h3>
						<button class="btn-nav-arrow" @click="nextMonth" title="Next month">
							<span class="material-icons">chevron_right</span>
						</button>
					</div>
					<div class="calendar-actions-top">
						<button class="btn btn-secondary btn-sm" @click="selectToday">Today</button>
						<button class="btn btn-primary btn-sm" @click="openAddModal('')">
							<span class="material-icons" style="font-size: 1rem;">add</span>
							Add Schedule
						</button>
					</div>
				</div>

				<div class="calendar-weekdays">
					<div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="weekday">
						{{ day }}
					</div>
				</div>

				<div class="calendar-grid">
					<div 
						v-for="day in calendarDays" 
						:key="day.dateString" 
						class="day-cell"
						:class="{ 
							'outside-month': !day.isCurrentMonth,
							'is-today': day.dateString === todayStr,
							'is-selected': day.dateString === selectedDateStr
						}"
						@click="selectDate(day.dateString)"
					>
						<div class="day-cell-header">
							<span class="day-number">{{ day.day }}</span>
							<!-- Add Quick Plus Icon on Hover -->
							<button 
								class="btn-quick-add"
								@click.stop="openAddModal(day.dateString)"
								title="Add schedule on this day"
							>
								<span class="material-icons">add</span>
							</button>
						</div>

						<div class="event-container">
							<div 
								v-for="evt in getPeriodsForDate(day.dateString)" 
								:key="evt.index" 
								class="event-bar"
								:class="evt.colorClass"
								:title="evt.label + ' S.Y. ' + evt.school_year"
							>
								<span class="event-text">{{ evt.label }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Schedule Details Side Panel -->
			<div class="details-card card">
				<div class="card-header-area">
					<span class="material-icons header-icon">info</span>
					<h3>Schedule Details</h3>
				</div>

				<div class="selected-date-banner">
					<span class="material-icons date-banner-icon">event</span>
					<div class="date-banner-info">
						<span class="date-banner-label">Selected Date</span>
						<span class="date-banner-value">{{ formatDateLabel(selectedDateStr) }}</span>
					</div>
				</div>

				<!-- Active schedules list for selected date -->
				<div class="section-title-bar">
					Active on selected date
				</div>
				
				<div class="active-periods-list">
					<div 
						v-for="evt in getPeriodsForDate(selectedDateStr)" 
						:key="evt.index" 
						class="active-period-item"
						:class="'period-border-' + evt.index"
					>
						<div class="active-item-header">
							<h4 class="active-item-title">{{ evt.label }} Period</h4>
							<span class="active-item-sy">S.Y. {{ evt.school_year }}</span>
						</div>
						<div class="active-item-details">
							<div class="active-detail-row">
								<span class="detail-label">Starts:</span>
								<span class="detail-value">{{ formatDateTime(evt.data.date_start, evt.data.time_start) }}</span>
							</div>
							<div class="active-detail-row">
								<span class="detail-label">Ends:</span>
								<span class="detail-value">{{ formatDateTime(evt.data.date_end, evt.data.time_end) }}</span>
							</div>
						</div>
						<div class="active-item-actions">
							<button class="btn btn-secondary btn-sm" @click="openEditModal(evt.index)">
								<span class="material-icons" style="font-size: 0.875rem;">edit</span>
								Edit
							</button>
							<button class="btn btn-ghost btn-sm danger" @click="tryClearPeriod(evt.index - 1)">
								<span class="material-icons" style="font-size: 0.875rem;">delete_outline</span>
								Clear
							</button>
						</div>
					</div>
					
					<div v-if="getPeriodsForDate(selectedDateStr).length === 0" class="no-schedules-banner">
						<p>No active evaluation periods on this date.</p>
						<button class="btn btn-secondary btn-sm" @click="openAddModal(selectedDateStr)">
							<span class="material-icons" style="font-size: 1rem;">add</span>
							Add Schedule
						</button>
					</div>
				</div>

				<!-- Full overview of all periods -->
				<div 
					class="section-title-bar collapsible-title" 
					style="margin-top: var(--space-5); cursor: pointer;"
					@click="showOverview = !showOverview"
				>
					<span>Full Period Overview</span>
					<span class="material-icons title-chevron">
						{{ showOverview ? 'expand_less' : 'expand_more' }}
					</span>
				</div>
				
				<Transition name="expand">
					<div v-if="showOverview" class="all-periods-overview">
						<div 
							v-for="(period, idx) in schedule" 
							:key="period.label" 
							class="overview-item"
							:class="[getPeriodStatus(period).class, { 'highlighted': getPeriodStatus(period).code === 'live' }]"
						>
							<div class="overview-item-top">
								<span class="overview-title">{{ period.label }} Period</span>
								<span class="overview-badge" :class="getPeriodStatus(period).class">
									{{ getPeriodStatus(period).label }}
								</span>
							</div>
							<div class="overview-item-middle" v-if="period.date_start">
								<span class="overview-range">
									{{ formatDateTime(period.date_start, period.time_start) }}
									to
									{{ formatDateTime(period.date_end, period.time_end) }}
								</span>
							</div>
							<div class="overview-item-middle" v-else>
								<span class="overview-range unscheduled">Not scheduled yet</span>
							</div>
							<div class="overview-item-bottom">
								<button 
									v-if="period.date_start"
									class="btn btn-ghost btn-sm"
									@click="openEditModal(idx + 1)"
								>
									Edit
								</button>
								<button 
									v-else
									class="btn btn-secondary btn-sm"
									@click="openEditModal(idx + 1)"
								>
									Configure
								</button>
							</div>
						</div>
					</div>
				</Transition>
			</div>
		</div>
	</div>
</template>

<style scoped>
.scheduler-page {
	animation: fadeIn 0.3s ease;
}

.page-header {
	margin-bottom: var(--space-6);
}

.page-title {
	font-size: 1.25rem;
	margin-bottom: var(--space-1);
}

.page-desc {
	color: var(--color-text-muted);
	font-size: 0.875rem;
}

.schedule-layout {
	display: grid;
	grid-template-columns: 1.25fr 0.75fr;
	gap: var(--space-6);
	align-items: start;
}

.calendar-card {
	padding: var(--space-5);
}

.calendar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: var(--space-4);
	flex-wrap: wrap;
	gap: var(--space-3);
}

.calendar-nav {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.btn-nav-arrow {
	background: var(--color-bg);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: var(--color-text-secondary);
	transition: all var(--transition-fast);
}

.btn-nav-arrow:hover {
	background: var(--color-bg-subtle);
	color: var(--color-text);
	border-color: var(--color-border-strong);
}

.current-month {
	font-size: 1.125rem;
	font-weight: 700;
	margin: 0;
	min-width: 140px;
	text-align: center;
}

.calendar-actions-top {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

/* Weekdays */
.calendar-weekdays {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	text-align: center;
	border-bottom: 1px solid var(--color-border);
	padding-bottom: var(--space-2);
	margin-bottom: var(--space-2);
}

.weekday {
	font-size: 0.8125rem;
	font-weight: 700;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

/* Calendar Grid */
.calendar-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	grid-auto-rows: minmax(90px, 1fr);
	gap: 1px;
	background: var(--color-border);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	overflow: hidden;
}

.day-cell {
	background: var(--color-bg);
	padding: var(--space-2);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	cursor: pointer;
	position: relative;
	transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.day-cell:hover {
	background: var(--color-bg-page);
}

.day-cell.outside-month {
	background: #f8fafc;
	opacity: 0.5;
}

.day-cell.is-today {
	background: var(--color-primary-50);
}

.day-cell.is-today .day-number {
	background: var(--color-primary);
	color: #fff;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
}

.day-cell.is-selected {
	box-shadow: inset 0 0 0 2px var(--color-primary);
	z-index: 10;
}

.day-cell-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-2);
}

.day-number {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text-secondary);
}

.btn-quick-add {
	background: transparent;
	border: none;
	cursor: pointer;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	color: var(--color-primary);
	transition: all var(--transition-fast);
}

.day-cell:hover .btn-quick-add {
	opacity: 1;
	background: var(--color-primary-light);
}

.btn-quick-add .material-icons {
	font-size: 0.875rem;
}

/* Event container and bars */
.event-container {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	justify-content: flex-end;
}

.event-bar {
	height: 18px;
	font-size: 0.6875rem;
	font-weight: 700;
	border-radius: 3px;
	padding: 0 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	display: flex;
	align-items: center;
	line-height: 1;
}

.period-color-1 { background: #e0e7ff; color: #4f46e5; }
.period-color-2 { background: #ecfdf5; color: #059669; }
.period-color-3 { background: #fffbeb; color: #d97706; }
.period-color-4 { background: #fdf2f8; color: #db2777; }

/* Side details card */
.details-card {
	padding: var(--space-5);
}

.card-header-area {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
}

.card-header-area h3 {
	margin: 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--color-text);
}

.header-icon {
	color: var(--color-text-secondary);
	font-size: 1.25rem;
}

.selected-date-banner {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	padding: var(--space-3) var(--space-4);
	border-radius: var(--radius-lg);
	margin-bottom: var(--space-4);
}

.date-banner-icon {
	color: var(--color-primary);
	font-size: 1.5rem;
}

.date-banner-info {
	display: flex;
	flex-direction: column;
}

.date-banner-label {
	font-size: 0.75rem;
	color: var(--color-text-muted);
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.date-banner-value {
	font-size: 0.9375rem;
	font-weight: 700;
	color: var(--color-text);
}

.section-title-bar {
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	border-bottom: 1px solid var(--color-border);
	padding-bottom: var(--space-1);
	margin-bottom: var(--space-3);
}

/* Active periods on selected date list */
.active-periods-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.active-period-item {
	background: var(--color-bg);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.period-border-1 { border-left: 3px solid #4f46e5; }
.period-border-2 { border-left: 3px solid #059669; }
.period-border-3 { border-left: 3px solid #d97706; }
.period-border-4 { border-left: 3px solid #db2777; }

.active-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.active-item-title {
	font-size: 0.875rem;
	font-weight: 700;
	margin: 0;
	color: var(--color-text);
}

.active-item-sy {
	font-size: 0.75rem;
	color: var(--color-text-muted);
	font-weight: 500;
}

.active-item-details {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.active-detail-row {
	display: flex;
	justify-content: space-between;
	font-size: 0.8125rem;
}

.detail-label {
	color: var(--color-text-muted);
}

.detail-value {
	font-weight: 600;
	color: var(--color-text-secondary);
}

.active-item-actions {
	display: flex;
	gap: var(--space-2);
	justify-content: flex-end;
	margin-top: 4px;
}

.active-item-actions .btn {
	padding: 0.25rem 0.625rem;
}

.btn-ghost.danger {
	color: var(--color-danger);
}
.btn-ghost.danger:hover {
	background: var(--color-danger-light);
	color: var(--color-danger);
}

.no-schedules-banner {
	text-align: center;
	padding: var(--space-4) 0;
	color: var(--color-text-muted);
	font-size: 0.8125rem;
}

.no-schedules-banner p {
	margin-bottom: var(--space-2);
}

/* Full Period Overview */
.all-periods-overview {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.overview-item {
	padding: var(--space-3);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	display: flex;
	flex-direction: column;
	gap: 6px;
	background: var(--color-bg);
	transition: border-color var(--transition-fast);
}

.overview-item.highlighted {
	border-color: var(--color-success);
	box-shadow: var(--shadow-sm);
}

.overview-item-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.overview-title {
	font-size: 0.875rem;
	font-weight: 700;
	color: var(--color-text);
}

.overview-badge {
	font-size: 0.6875rem;
	font-weight: 700;
	padding: 1px 6px;
	border-radius: var(--radius-full);
}

.overview-badge.status-live { background: var(--color-success-light); color: var(--color-success); }
.overview-badge.status-upcoming { background: var(--color-primary-light); color: var(--color-primary); }
.overview-badge.status-completed { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.overview-badge.status-unscheduled { background: var(--color-bg-muted); color: var(--color-text-secondary); }

.overview-item-middle {
	font-size: 0.75rem;
	color: var(--color-text-secondary);
}

.overview-range.unscheduled {
	color: var(--color-text-muted);
	font-style: italic;
}

.overview-item-bottom {
	display: flex;
	justify-content: flex-end;
	margin-top: 2px;
}

.overview-item-bottom .btn {
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
}

/* Modals */
.modal-backdrop,
.confirm-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.35);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--space-4);
}

.modal-card,
.confirm-card {
	background: var(--color-bg);
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-2xl);
	width: 100%;
	max-width: 480px;
	padding: var(--space-6);
	position: relative;
	box-shadow: var(--shadow-xl);
}

.modal-header {
	margin-bottom: var(--space-4);
	text-align: center;
}

.modal-icon {
	font-size: 2.5rem;
	margin-bottom: var(--space-2);
}

.modal-header h2 {
	margin-bottom: var(--space-1);
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--color-text);
}

.modal-header p {
	font-size: 0.875rem;
	color: var(--color-text-muted);
	line-height: 1.5;
}

.modal-body {
	margin-bottom: var(--space-5);
}

.form-layout {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.form-section {
	background: var(--color-bg-page);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--space-5);
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
	margin-bottom: var(--space-3);
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.form-group label {
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--color-text-secondary);
}

/* Custom Select Dropdown Arrow */
.select-wrapper {
	position: relative;
	width: 100%;
}

.period-select {
	font-family: var(--font-sans);
	font-size: 0.9375rem;
	padding: 0.625rem 2rem 0.625rem 0.875rem;
	border: 1px solid var(--color-border-strong);
	border-radius: var(--radius-lg);
	background: var(--color-bg) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1.25rem;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	cursor: pointer;
	outline: none;
	transition: all var(--transition-fast);
	width: 100%;
}

.period-select:focus {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 3px var(--color-primary-light);
}

.period-warning-alert {
	margin-top: var(--space-3);
	font-size: 0.8125rem;
	color: var(--color-warning);
	background: var(--color-warning-light);
	border: 1px solid #fcd34d;
	border-radius: var(--radius-md);
	padding: var(--space-2) var(--space-3);
	display: flex;
	align-items: flex-start;
	gap: var(--space-2);
}

.period-warning-alert .material-icons {
	font-size: 1rem;
	flex-shrink: 0;
	margin-top: 1px;
}

.modal-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: flex-end;
}

.modal-actions .btn {
	min-width: 100px;
}

/* ── Confirmation Modal ── */
.confirm-card {
	max-width: 400px;
	padding: var(--space-8);
	text-align: center;
}

.confirm-icon-wrap {
	width: 56px;
	height: 56px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto var(--space-4);
}

.confirm-icon-wrap.btn-danger {
	background: var(--color-danger-light);
	border: 2px solid var(--color-danger-border);
	color: var(--color-danger);
}

.confirm-icon-wrap.btn-primary {
	background: var(--color-primary-50);
	border: 2px solid var(--color-primary-light);
	color: var(--color-primary);
}

.confirm-icon {
	font-size: 1.75rem;
	color: inherit;
}

.confirm-title {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--color-text);
	margin-bottom: var(--space-2);
}

.confirm-message {
	font-size: 0.875rem;
	color: var(--color-text-muted);
	line-height: 1.5;
	margin-bottom: var(--space-6);
}

.confirm-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: center;
}

.confirm-actions .btn {
	flex: 1;
	border: 1px solid #cbd5e1;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.modal-enter-active {
	animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
	animation: slideUp 0.2s ease reverse;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@media (max-width: 1100px) {
	.schedule-layout {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.event-bar {
		height: 6px;
		padding: 0;
		text-indent: -9999px;
		border-radius: 50%;
		width: 6px;
		display: inline-block;
		margin: 2px;
	}
	.event-container {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
	}
}

@media (max-width: 640px) {
	.form-row {
		grid-template-columns: 1fr;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}
	.calendar-grid {
		grid-auto-rows: minmax(70px, 1fr);
	}
}

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(5px); }
	to { opacity: 1; transform: translateY(0); }
}

/* Collapsible Section Header */
.collapsible-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	user-select: none;
}

.title-chevron {
	font-size: 1.125rem;
	color: var(--color-text-placeholder);
	transition: color var(--transition-fast);
}

.collapsible-title:hover .title-chevron {
	color: var(--color-text-secondary);
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
	transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
	overflow: hidden;
	max-height: 600px;
}
.expand-enter-from,
.expand-leave-to {
	opacity: 0;
	max-height: 0;
}

/* Locked Date Inputs */
.input-locked {
	background-color: var(--color-bg-subtle) !important;
	border-color: var(--color-border) !important;
	cursor: not-allowed !important;
	color: var(--color-text-muted) !important;
	opacity: 0.8;
}
</style>
