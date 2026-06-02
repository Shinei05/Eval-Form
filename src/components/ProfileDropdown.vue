<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
	initials: { type: String, required: true },
	role: { type: String, required: true },
	displayName: { type: String, default: "" }
});
const emit = defineEmits(['logout', 'settings']);

const isOpen = ref(false);

const toggleDropdown = () => {
	isOpen.value = !isOpen.value;
};

const closeDropdown = (e) => {
	if (!e.target.closest('.profile-dropdown-wrapper')) {
		isOpen.value = false;
	}
};

onMounted(() => document.addEventListener('click', closeDropdown));
onUnmounted(() => document.removeEventListener('click', closeDropdown));
</script>

<template>
	<div class="profile-dropdown-wrapper">
		<button class="user-pill" @click="toggleDropdown" :class="{ active: isOpen }">
			<span class="status-dot"></span>
			<span class="role-text hidden-mobile">{{ role }}</span>
			<div class="avatar-circle">{{ initials }}</div>
			<span class="material-icons dropdown-icon">expand_more</span>
		</button>
		
		<Transition name="dropdown">
			<div v-if="isOpen" class="dropdown-menu">
				<div class="dropdown-header">
					<p v-if="displayName" class="user-name">{{ displayName }}</p>
					<p class="role-label">{{ role }} Account</p>
				</div>
				<button class="dropdown-item" @click="$emit('settings'); isOpen = false">
					<span class="material-icons-outlined">person</span>
					Profile
				</button>
				<div class="dropdown-divider"></div>
				<button class="dropdown-item text-danger" @click="$emit('logout'); isOpen = false">
					<span class="material-icons-outlined">logout</span>
					Sign Out
				</button>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.profile-dropdown-wrapper {
	position: relative;
}

.user-pill {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	background: var(--color-bg-page, #f8fafc);
	padding: 4px 8px 4px 12px;
	border-radius: var(--radius-full, 9999px);
	border: 1px solid var(--color-border, #e2e8f0);
	cursor: pointer;
	transition: all 0.2s;
}

.user-pill:hover, .user-pill.active {
	background: #f1f5f9;
	border-color: #cbd5e1;
}

.status-dot {
	width: 6px;
	height: 6px;
	background: var(--color-primary, #4f46e5);
	border-radius: 50%;
}

.role-text {
	font-size: 0.8125rem;
	font-weight: 500;
	color: var(--color-primary, #4f46e5);
	margin-right: 4px;
}

.avatar-circle {
	width: 28px;
	height: 28px;
	background: #e2e8f0;
	color: #64748b;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
}

.dropdown-icon {
	font-size: 1.25rem;
	color: #94a3b8;
}

.dropdown-menu {
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	width: 200px;
	background: #ffffff;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: var(--radius-lg, 0.5rem);
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	padding: var(--space-2, 0.5rem) 0;
	z-index: 100;
}

.dropdown-header {
	padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
	border-bottom: 1px solid var(--color-border, #e2e8f0);
	margin-bottom: var(--space-2, 0.5rem);
}

.user-name {
	font-size: 0.875rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 2px 0;
}

.role-label {
	font-size: 0.75rem;
	font-weight: 600;
	color: #94a3b8;
	text-transform: uppercase;
	margin: 0;
}

.dropdown-item {
	width: 100%;
	display: flex;
	align-items: center;
	gap: var(--space-3, 0.75rem);
	padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
	font-size: 0.875rem;
	color: #475569;
	background: none;
	border: none;
	cursor: pointer;
	text-align: left;
	transition: background 0.15s;
}

.dropdown-item:hover {
	background: #f8fafc;
	color: #0f172a;
}

.dropdown-item .material-icons-outlined {
	font-size: 1.25rem;
}

.text-danger {
	color: #ef4444;
}

.text-danger:hover {
	background: #fef2f2;
	color: #dc2626;
}

.dropdown-divider {
	height: 1px;
	background: var(--color-border, #e2e8f0);
	margin: var(--space-2, 0.5rem) 0;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}
.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

@media (max-width: 768px) {
	.hidden-mobile {
		display: none;
	}
}
</style>
