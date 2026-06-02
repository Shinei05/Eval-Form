<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useAuth } from "../composables/useAuth";
import { useApi } from "../composables/useApi";
import API from "../utils/api";
import ConfirmModal from "../components/ConfirmModal.vue";
import AppToast from "../components/AppToast.vue";
import ProfileDropdown from "../components/ProfileDropdown.vue";

const { logout } = useAuth();
const { request } = useApi();
const user = ref({ firstname: "", lastname: "" });
const showLogoutModal = ref(false);

const toast = reactive({ visible: false, message: "", type: "success" });

function handleLogout() {
	toast.message = "Logged out successfully!";
	toast.visible = true;
	setTimeout(() => {
		logout();
	}, 1000);
}

onMounted(() => {
	loadProfile();
});

const initials = computed(() => {
	const f = user.value.firstname?.charAt(0) || "T";
	const l = user.value.lastname?.charAt(0) || "R";
	return (f + l).toUpperCase();
});

const fullName = computed(() => {
	const first = (user.value.firstname || "").trim();
	const last = (user.value.lastname || "").trim();
	const name = `${first} ${last}`.trim();
	return name || "Teacher";
});

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		user.value = {
			firstname: profile.firstname || "",
			lastname: profile.lastname || "",
		};
	}
}
</script>

<template>
	<AppToast
		:visible="toast.visible"
		:message="toast.message"
		:type="toast.type"
		@close="toast.visible = false"
	/>
	<div class="dashboard-wrapper">
		<header class="dash-header">
			<div class="header-left">
				<h1>EduRate</h1>
			</div>
			<div class="header-right">
				<ProfileDropdown
					:initials="initials"
					:display-name="fullName"
					role="Teacher"
					@logout="showLogoutModal = true"
					@settings="$router.push('/teacher/settings')"
				/>
			</div>
		</header>

		<main class="dash-main">
			<router-view />
		</main>

		<!-- Confirm Logout Modal -->
		<ConfirmModal
			v-model:visible="showLogoutModal"
			title="Sign Out"
			message="Are you sure you want to sign out?"
			confirmText="Sign Out"
			cancelText="Cancel"
			confirmBtnClass="btn-danger"
			icon="logout"
			iconColor="var(--color-danger)"
			@confirm="handleLogout"
		/>
	</div>
</template>

<style scoped>
.dashboard-wrapper {
	min-height: 100vh;
	background: var(--color-bg-page);
	display: flex;
	flex-direction: column;
}

.dash-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4) var(--space-6);
	background: rgba(255, 255, 255, 0.85); /* Glassmorphic */
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	border-bottom: 1px solid rgba(226, 232, 240, 0.8);
	position: sticky;
	top: 0;
	z-index: 50;
	box-shadow: var(--shadow-sm);
}

.header-left h1 {
	font-size: 1.25rem;
	font-weight: 800;
	color: var(--color-primary);
	margin: 0;
}

.header-right {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.greeting {
	font-size: 0.875rem;
	color: var(--color-text-secondary);
	font-weight: 500;
}
.dash-main {
	flex: 1;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
	padding: var(--space-6);
}

@media (max-width: 768px) {
	.dash-main {
		padding: var(--space-4);
	}
	.hidden-mobile {
		display: none !important;
	}
}
</style>
