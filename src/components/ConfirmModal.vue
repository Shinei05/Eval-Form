<script setup>
import { ref, watch, onUnmounted } from "vue";

const props = defineProps({
	visible: { type: Boolean, default: false },
	title: { type: String, default: "Confirm Action" },
	message: { type: String, default: "Are you sure you want to proceed?" },
	confirmText: { type: String, default: "Confirm" },
	cancelText: { type: String, default: "Cancel" },
	confirmBtnClass: { type: String, default: "btn-primary" },
	icon: { type: String, default: "info" },
	iconColor: { type: String, default: "var(--color-primary)" }
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

const show = ref(props.visible);

watch(
	() => props.visible,
	(val) => {
		show.value = val;
	}
);

watch(
	show,
	(val) => {
		if (val) {
			document.body.style.overflow = "hidden";
		} else {
			// Only clear overflow if there are no other active modal backdrops in DOM
			const activeBackdrops = document.querySelectorAll(".modal-backdrop");
			if (activeBackdrops.length <= 1) {
				document.body.style.overflow = "";
			}
		}
	}
);

onUnmounted(() => {
	const activeBackdrops = document.querySelectorAll(".modal-backdrop");
	if (activeBackdrops.length === 0) {
		document.body.style.overflow = "";
	}
});

function close() {
	show.value = false;
	emit("update:visible", false);
	emit("cancel");
}

function confirm() {
	show.value = false;
	emit("update:visible", false);
	emit("confirm");
}
</script>

<template>
	<!-- Modal Backdrop -->
	<Transition name="fade">
		<div
			v-if="show"
			class="modal-backdrop"
			@click.self="close"
		>
			<Transition name="modal">
				<div class="modal-card" v-if="show">
					<div class="modal-header">
						<span
							class="material-icons modal-icon"
							:style="{ color: iconColor }"
						>{{ icon }}</span>
						<h2>{{ title }}</h2>
						<p>{{ message }}</p>
					</div>

					<div class="modal-actions">
						<button class="btn btn-ghost" @click="close">
							{{ cancelText }}
						</button>
						<button :class="['btn', confirmBtnClass]" @click="confirm">
							{{ confirmText }}
						</button>
					</div>
				</div>
			</Transition>
		</div>
	</Transition>
</template>

<style scoped>
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.3);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: var(--space-4);
}

.modal-card {
	background: var(--color-bg);
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-2xl);
	width: 100%;
	max-width: 400px;
	padding: var(--space-8);
	position: relative;
	box-shadow: var(--shadow-xl);
	text-align: center;
}

.modal-header {
	margin-bottom: var(--space-6);
}

.modal-icon {
	font-size: 2.5rem;
	margin-bottom: var(--space-3);
}

.modal-header h2 {
	margin-bottom: var(--space-2);
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--color-text);
}

.modal-header p {
	font-size: 0.9375rem;
	color: var(--color-text-muted);
	line-height: 1.5;
}

.modal-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: center;
	margin-top: var(--space-6);
}

.modal-actions .btn {
	flex: 1;
	border: 1px solid #cbd5e1;
}

/* Transitions */
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
</style>
