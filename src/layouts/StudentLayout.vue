<script setup>
import { ref, reactive, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { useApi } from "../composables/useApi";
import API from "../utils/api";
import ConfirmModal from "../components/ConfirmModal.vue";
import AppToast from "../components/AppToast.vue";
import ProfileDropdown from "../components/ProfileDropdown.vue";

const { logout } = useAuth();
const { request } = useApi();
const showLogoutModal = ref(false);

const toast = reactive({ visible: false, message: "", type: "success" });

const initials = ref("ST");
const fullName = ref("Student");

function buildInitials(displayName, firstname, lastname) {
	const safeName = displayName || "Student";
	const parts = safeName.trim().split(/\s+/);
	const firstInitial = (firstname || parts[0] || "S").charAt(0);
	const lastInitial = (lastname || parts[1] || "T").charAt(0);
	return `${firstInitial}${lastInitial}`.toUpperCase();
}

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		const displayName = (profile.fullname || "").trim() || `${profile.firstname || ""} ${profile.lastname || ""}`.trim();
		fullName.value = displayName || "Student";
		initials.value = buildInitials(displayName, profile.firstname, profile.lastname);
	}
}

onMounted(() => {
	loadProfile();
});

function handleLogout() {
	toast.message = "Logged out successfully!";
	toast.visible = true;
	setTimeout(() => {
		logout();
	}, 1000);
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
				<h1>Dashboard</h1>
			</div>
			<div class="header-right">
				<ProfileDropdown
					:initials="initials"
					:display-name="fullName"
					role="Student"
					@logout="showLogoutModal = true"
					@settings="$router.push('/student/settings')"
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
	font-size: 1.125rem;
	font-weight: 500;
	color: var(--color-text);
	margin: 0;
}

.header-right {
	display: flex;
	align-items: center;
	gap: var(--space-4);
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
