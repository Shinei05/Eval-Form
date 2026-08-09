<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";
import {
	ChevronLeft, ChevronRight, Plus, CalendarDays, Info,
	Pencil, Trash2, Save, X, AlertTriangle, ChevronDown, ChevronUp,
	Clock, CalendarCheck
} from "@lucide/vue";

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
		return { code: "unscheduled", label: "Unscheduled" };
	}
	try {
		const now = new Date();
		const start = new Date(`${period.date_start}T${period.time_start || "00:00:00"}`);
		const end = new Date(`${period.date_end}T${period.time_end || "00:00:00"}`);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return { code: "scheduled", label: "Scheduled" };
		}

		if (now < start) {
			return { code: "upcoming", label: "Upcoming" };
		} else if (now > end) {
			return { code: "completed", label: "Completed" };
		} else {
			return { code: "live", label: "Live Now" };
		}
	} catch (e) {
		return { code: "scheduled", label: "Scheduled" };
	}
}

// Period color classes for Tailwind
const periodColors = [
	{ bg: "bg-indigo-50", text: "text-indigo-600", border: "border-l-indigo-500", dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
	{ bg: "bg-emerald-50", text: "text-emerald-600", border: "border-l-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
	{ bg: "bg-amber-50", text: "text-amber-600", border: "border-l-amber-500", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
	{ bg: "bg-pink-50", text: "text-pink-600", border: "border-l-pink-500", dot: "bg-pink-500", badge: "bg-pink-100 text-pink-700" },
];

watch(selectedPeriod, () => {
	loadSelectedPeriod();
});

// showOverview is now a modal — no scroll watcher needed

// Watch modal states to lock body scrolling
watch(showFormModal, (val) => {
	if (val) {
		document.body.style.overflow = "hidden";
	} else {
		if (!confirmModal.value.visible && !showOverview.value) {
			document.body.style.overflow = "";
		}
	}
});

watch(() => confirmModal.value.visible, (val) => {
	if (val) {
		document.body.style.overflow = "hidden";
	} else {
		if (!showFormModal.value && !showOverview.value) {
			document.body.style.overflow = "";
		}
	}
});

watch(showOverview, (val) => {
	document.body.style.overflow = val ? "hidden" : "";
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
				v-if="confirmModal.visible"
				class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
				@click.self="onCancelConfirm"
			>
				<Transition
					enter-active-class="transition duration-200 ease-out"
					enter-from-class="opacity-0 scale-95 translate-y-2"
					enter-to-class="opacity-100 scale-100 translate-y-0"
					leave-active-class="transition duration-150 ease-in"
					leave-from-class="opacity-100 scale-100 translate-y-0"
					leave-to-class="opacity-0 scale-95 translate-y-2"
				>
					<div
						v-if="confirmModal.visible"
						class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl p-8 text-center"
					>
						<div
							class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
							:class="confirmModal.confirmClass === 'btn-danger' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'"
						>
							<AlertTriangle class="h-7 w-7" />
						</div>
						<h3 class="text-lg font-bold text-slate-900 mb-2">{{ confirmModal.title }}</h3>
						<p class="text-sm text-slate-500 leading-relaxed mb-6">{{ confirmModal.message }}</p>
						<div class="flex gap-3">
							<button
								@click="onCancelConfirm"
								class="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								@click="onConfirm"
								class="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors"
								:class="confirmModal.confirmClass === 'btn-danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
							>
								{{ confirmModal.confirmLabel }}
							</button>
						</div>
					</div>
				</Transition>
			</div>
		</Transition>
	</Teleport>

	<!-- Schedule Form Modal -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="showFormModal"
				class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 backdrop-blur-sm p-4 sm:p-6"
				@click.self="showFormModal = false"
			>
				<div class="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
					<!-- Modal Header -->
					<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
								<CalendarDays class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-base font-bold text-slate-900">
									{{ isPeriodSet ? "Edit Period Schedule" : "Set Period Schedule" }}
								</h3>
								<p class="text-xs text-slate-500">Define start and end times for the evaluation period.</p>
							</div>
						</div>
						<button
							@click="showFormModal = false"
							class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<!-- Modal Body -->
					<form @submit.prevent="trySaveSchedule" class="p-6">
						<div class="space-y-5">
							<!-- Period & School Year -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">Target Period</label>
									<select
										v-model.number="selectedPeriod"
										@change="loadSelectedPeriod"
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									>
										<option v-for="(label, idx) in periodLabels" :key="label" :value="idx + 1">
											{{ label }} Period
										</option>
									</select>
								</div>
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">School Year</label>
									<input
										type="text"
										v-model="form.school_year"
										placeholder="e.g. 2024-2025"
										required
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									/>
								</div>
							</div>

							<!-- Start Date & Time -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">Start Date</label>
									<input
										type="date"
										v-model="form.date_start"
										:disabled="isDateLocked"
										:readonly="isDateLocked"
										required
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
									/>
								</div>
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">Start Time</label>
									<input
										type="time"
										v-model="form.time_start"
										required
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									/>
								</div>
							</div>

							<!-- End Date & Time -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">End Date</label>
									<input
										type="date"
										v-model="form.date_end"
										required
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									/>
								</div>
								<div>
									<label class="mb-1.5 block text-sm font-semibold text-slate-700">End Time</label>
									<input
										type="time"
										v-model="form.time_end"
										required
										class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
									/>
								</div>
							</div>

							<!-- Overwrite Warning -->
							<div
								v-if="isPeriodSet"
								class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
							>
								<AlertTriangle class="mt-0.5 h-4 w-4 flex-none text-amber-600" />
								<span>Saving will overwrite the existing dates for this period.</span>
							</div>
						</div>

						<!-- Actions -->
						<div class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
							<button
								type="button"
								@click="showFormModal = false"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:w-auto"
							>
								<Save class="h-4 w-4" />
								Save Schedule
							</button>
						</div>
					</form>
				</div>
			</div>
		</Transition>
	</Teleport>

	<!-- Main Page -->
	<div class="animate-fade-up space-y-6">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
				<CalendarDays class="h-6 w-6" />
			</div>
			<div>
				<h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Schedule Management</h2>
				<p class="mt-1 text-sm text-slate-500">
					Set and manage evaluation periods for the school
				</p>
			</div>
		</div>

		<!-- Two-column layout: Calendar + Details -->
		<div class="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

			<!-- ── Calendar Card ── -->
			<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<!-- Calendar Toolbar -->
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
					<div class="flex items-center gap-2">
						<button
							@click="prevMonth"
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
						>
							<ChevronLeft class="h-4 w-4" />
						</button>
						<h3 class="min-w-[160px] text-center text-base font-bold text-slate-900">{{ currentMonthName }}</h3>
						<button
							@click="nextMonth"
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
						>
							<ChevronRight class="h-4 w-4" />
						</button>
					</div>
					<div class="flex items-center gap-2">
						<button
							@click="selectToday"
							class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
						>
							Today
						</button>
						<button
							@click="openAddModal('')"
							class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
						>
							<Plus class="h-3.5 w-3.5" />
							Add Schedule
						</button>
					</div>
				</div>

				<!-- Weekday headers -->
				<div class="grid grid-cols-7 border-b border-slate-100 px-1">
					<div
						v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
						:key="day"
						class="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
					>
						{{ day }}
					</div>
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 border-collapse">
					<div
						v-for="day in calendarDays"
						:key="day.dateString"
						@click="selectDate(day.dateString)"
						class="group relative min-h-[80px] cursor-pointer border-b border-r border-slate-100 p-2 transition-colors last:border-r-0"
						:class="{
							'bg-white hover:bg-slate-50': day.isCurrentMonth && day.dateString !== selectedDateStr,
							'bg-slate-50/60 opacity-50': !day.isCurrentMonth,
							'bg-indigo-50': day.isCurrentMonth && day.dateString === todayStr && day.dateString !== selectedDateStr,
							'bg-indigo-600/10 ring-1 ring-inset ring-indigo-500': day.dateString === selectedDateStr,
						}"
					>
						<!-- Day number + quick add -->
						<div class="mb-1 flex items-center justify-between">
							<span
								class="flex h-6 w-6 items-center justify-center text-xs font-semibold"
								:class="{
									'rounded-full bg-indigo-600 text-white': day.dateString === todayStr,
									'text-slate-400': !day.isCurrentMonth,
									'text-slate-700': day.isCurrentMonth && day.dateString !== todayStr,
								}"
							>
								{{ day.day }}
							</span>
							<button
								class="hidden h-5 w-5 items-center justify-center rounded-full text-indigo-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-indigo-100 group-hover:flex"
								@click.stop="openAddModal(day.dateString)"
								title="Add schedule"
							>
								<Plus class="h-3 w-3" />
							</button>
						</div>
						<!-- Period event bars -->
						<div class="flex flex-col gap-0.5">
							<div
								v-for="evt in getPeriodsForDate(day.dateString)"
								:key="evt.index"
								class="truncate rounded px-1 py-0.5 text-[10px] font-bold leading-tight"
								:class="periodColors[evt.index - 1]?.bg + ' ' + periodColors[evt.index - 1]?.text"
								:title="evt.label + ' S.Y. ' + evt.school_year"
							>
								{{ evt.label }}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- ── Details Panel ── -->
			<div class="flex flex-col gap-4">
				<!-- Selected Date Card -->
				<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div class="mb-4 flex items-center gap-2">
						<Info class="h-4 w-4 text-slate-400" />
						<h3 class="text-sm font-bold text-slate-900">Schedule Details</h3>
					</div>

					<!-- Selected Date Banner -->
					<div class="mb-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
						<CalendarDays class="h-5 w-5 flex-none text-indigo-500" />
						<div>
							<p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Date</p>
							<p class="text-sm font-bold text-slate-800">{{ formatDateLabel(selectedDateStr) || "—" }}</p>
						</div>
					</div>

					<!-- Active periods on selected date -->
					<p class="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
						Active on selected date
					</p>

					<div class="space-y-3">
						<div
							v-for="evt in getPeriodsForDate(selectedDateStr)"
							:key="evt.index"
							class="rounded-xl border border-slate-200 bg-white p-3"
							:class="'border-l-4 ' + periodColors[evt.index - 1]?.border"
						>
							<div class="flex items-center justify-between mb-2">
								<h4 class="text-sm font-bold text-slate-800">{{ evt.label }} Period</h4>
								<span class="text-[10px] font-semibold text-slate-400">S.Y. {{ evt.school_year }}</span>
							</div>
							<div class="space-y-1 mb-3">
								<div class="flex justify-between text-xs">
									<span class="text-slate-400 font-medium">Starts:</span>
									<span class="font-semibold text-slate-600">{{ formatDateTime(evt.data.date_start, evt.data.time_start) }}</span>
								</div>
								<div class="flex justify-between text-xs">
									<span class="text-slate-400 font-medium">Ends:</span>
									<span class="font-semibold text-slate-600">{{ formatDateTime(evt.data.date_end, evt.data.time_end) }}</span>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									@click="openEditModal(evt.index)"
									class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
								>
									<Pencil class="h-3 w-3" />
									Edit
								</button>
								<button
									@click="tryClearPeriod(evt.index - 1)"
									class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100"
								>
									<Trash2 class="h-3 w-3" />
									Clear
								</button>
							</div>
						</div>

						<!-- No schedules empty state -->
						<div
							v-if="getPeriodsForDate(selectedDateStr).length === 0"
							class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center"
						>
							<CalendarCheck class="h-6 w-6 text-slate-300" />
							<p class="text-xs text-slate-400">No active evaluation periods on this date.</p>
							<button
								@click="openAddModal(selectedDateStr)"
								class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
							>
								<Plus class="h-3 w-3" />
								Add Schedule
							</button>
						</div>
					</div>
				</div>

				<!-- Full Period Overview Button -->
				<button
					@click="showOverview = true"
					class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:bg-slate-50"
				>
					<div class="flex items-center gap-2">
						<CalendarDays class="h-4 w-4 text-indigo-500" />
						<span class="text-sm font-bold text-slate-900">Full Period Overview</span>
					</div>
					<ChevronRight class="h-4 w-4 text-slate-400" />
				</button>
			</div>
		</div>
	</div>
	<!-- Full Period Overview Modal -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="showOverview"
				class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 sm:p-6"
				@click.self="showOverview = false"
			>
				<Transition
					enter-active-class="transition duration-200 ease-out"
					enter-from-class="opacity-0 scale-95 translate-y-2"
					enter-to-class="opacity-100 scale-100 translate-y-0"
					leave-active-class="transition duration-150 ease-in"
					leave-from-class="opacity-100 scale-100 translate-y-0"
					leave-to-class="opacity-0 scale-95 translate-y-2"
				>
					<div v-if="showOverview" class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
						<!-- Modal Header -->
						<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
									<CalendarDays class="h-5 w-5" />
								</div>
								<div>
									<h3 class="text-base font-bold text-slate-900">Full Period Overview</h3>
									<p class="text-xs text-slate-500">All evaluation periods and their status</p>
								</div>
							</div>
							<button
								@click="showOverview = false"
								class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
							>
								<X class="h-5 w-5" />
							</button>
						</div>

						<!-- Modal Body -->
						<div class="max-h-[70vh] overflow-y-auto p-6">
							<div class="space-y-3">
								<div
									v-for="(period, idx) in schedule"
									:key="period.label"
									class="rounded-xl border p-4 transition-all"
									:class="getPeriodStatus(period).code === 'live' ? 'border-emerald-200 bg-emerald-50/30 shadow-sm' : 'border-slate-200 bg-white'"
								>
									<div class="flex items-center justify-between mb-3">
										<div class="flex items-center gap-2">
											<div class="h-2.5 w-2.5 rounded-full" :class="periodColors[idx]?.dot"></div>
											<span class="text-sm font-bold text-slate-900">{{ period.label }} Period</span>
											<span v-if="period.school_year" class="text-xs text-slate-400">S.Y. {{ period.school_year }}</span>
										</div>
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
											:class="{
												'bg-emerald-100 text-emerald-700': getPeriodStatus(period).code === 'live',
												'bg-indigo-100 text-indigo-700': getPeriodStatus(period).code === 'upcoming',
												'bg-slate-100 text-slate-500': getPeriodStatus(period).code === 'completed',
												'bg-slate-100 text-slate-400': getPeriodStatus(period).code === 'unscheduled',
											}"
										>
											{{ getPeriodStatus(period).label }}
										</span>
									</div>
									<div v-if="period.date_start" class="space-y-1 mb-3">
										<div class="flex justify-between text-xs">
											<span class="text-slate-400 font-medium">Starts:</span>
											<span class="font-semibold text-slate-600">{{ formatDateTime(period.date_start, period.time_start) }}</span>
										</div>
										<div class="flex justify-between text-xs">
											<span class="text-slate-400 font-medium">Ends:</span>
											<span class="font-semibold text-slate-600">{{ formatDateTime(period.date_end, period.time_end) }}</span>
										</div>
									</div>
									<p v-else class="mb-3 text-xs italic text-slate-400">Not scheduled yet</p>
									<div class="flex justify-end gap-2">
										<button
											v-if="period.date_start"
											@click="showOverview = false; openEditModal(idx + 1)"
											class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
										>
											<Pencil class="h-3 w-3" />
											Edit
										</button>
										<button
											v-else
											@click="showOverview = false; openEditModal(idx + 1)"
											class="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100"
										>
											<Plus class="h-3 w-3" />
											Configure
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Transition>
			</div>
		</Transition>
	</Teleport>
</template>
