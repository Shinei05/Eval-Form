<script setup>
import { ref, watch } from "vue";

const props = defineProps({
	message: { type: String, default: "" },
	type: {
		type: String,
		default: "success",
		validator: (v) => ["success", "error", "info", "warning"].includes(v),
	},
	duration: { type: Number, default: 4000 },
	visible: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const show = ref(false);

watch(
	() => props.visible,
	(val) => {
		if (val) {
			show.value = true;
			if (props.duration > 0) {
				setTimeout(() => {
					show.value = false;
					emit("close");
				}, props.duration);
			}
		} else {
			show.value = false;
		}
	},
);

const titles = {
	success: "Success",
	error: "Error",
	warning: "Warning",
	info: "Information",
};

const icons = {
	success: "check_circle",
	error: "error",
	warning: "warning",
	info: "info",
};
</script>

<template>
	<Transition name="toast">
		<div v-if="show" :class="['toast', `toast-${type}`]">
			<div class="toast-body">
				<span class="material-icons toast-icon">{{ icons[type] }}</span>
				<div class="toast-content">
					<div class="toast-title">{{ titles[type] }}</div>
					<div class="toast-message">{{ message }}</div>
				</div>
			</div>
			<button
				class="toast-close"
				@click="
					show = false;
					$emit('close');
				"
			>
				<span class="material-icons">close</span>
			</button>
			<div
				class="toast-progress"
				:style="{ animationDuration: duration + 'ms' }"
			></div>
		</div>
	</Transition>
</template>

<style scoped>
.toast {
	position: fixed;
	top: 1.25rem;
	right: 1.25rem;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem 1.25rem;
	border-radius: var(--radius-lg);
	z-index: 10000;
	box-shadow: var(--shadow-lg);
	overflow: hidden;
	max-width: 420px;
	min-width: 280px;
}

.toast-body {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	flex: 1;
}

.toast-content {
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
	text-align: left;
}

.toast-title {
	font-size: 0.8125rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.75px;
	line-height: 1.2;
	opacity: 0.9;
}

.toast-message {
	font-size: 0.875rem;
	font-weight: 600;
	line-height: 1.4;
}

.toast-success {
	background: var(--color-success);
	color: #fff;
}

.toast-error {
	background: var(--color-danger);
	color: #fff;
}

.toast-info {
	background: var(--color-primary);
	color: #fff;
}

.toast-warning {
	background: #ea580c;
	color: #fff;
}

.toast-icon {
	font-size: 1.35rem;
	flex-shrink: 0;
	margin-top: 1px;
}

.toast-close {
	background: none;
	border: none;
	color: rgba(255, 255, 255, 0.8);
	cursor: pointer;
	padding: 2px;
	display: flex;
	flex-shrink: 0;
	align-self: flex-start;
	margin-top: -2px;
}

.toast-close:hover {
	color: #fff;
}

.toast-close .material-icons {
	font-size: 1.125rem;
}

.toast-progress {
	position: absolute;
	bottom: 0;
	left: 0;
	height: 3px;
	background: rgba(255, 255, 255, 0.4);
	animation: shrink linear forwards;
	width: 100%;
}

@keyframes shrink {
	from {
		width: 100%;
	}
	to {
		width: 0;
	}
}

.toast-enter-active {
	animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
	animation: slideOutRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInRight {
	from {
		opacity: 0;
		transform: translateX(100%);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes slideOutRight {
	from {
		opacity: 1;
		transform: translateX(0);
	}
	to {
		opacity: 0;
		transform: translateX(100%);
	}
}

@media (max-width: 768px) {
	.toast {
		top: 0 !important;
		right: 0 !important;
		left: 0 !important;
		width: 100% !important;
		max-width: 100% !important;
		border-radius: 0 !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
	}
}
</style>
