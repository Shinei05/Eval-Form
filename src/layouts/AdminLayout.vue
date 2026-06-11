<script setup>
import { ref, computed, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useApi } from "../composables/useApi";
import API from "../utils/api";
import ConfirmModal from "../components/ConfirmModal.vue";
import AppToast from "../components/AppToast.vue";
import ProfileDropdown from "../components/ProfileDropdown.vue";

const router = useRouter();
const route = useRoute();
const { logout } = useAuth();
const { request } = useApi();

const sidebarOpen = ref(false);
const showLogoutModal = ref(false);

const toast = reactive({ visible: false, message: "", type: "success" });

function handleLogout() {
	toast.message = "Logged out successfully!";
	toast.visible = true;
	setTimeout(() => {
		logout();
	}, 1000);
}

const navItems = [
	{
		label: "Dashboard",
		icon: "dashboard",
		children: [
			{
				label: "Student Evaluations",
				route: "/principal",
				query: "student",
			},
			{
				label: "Teacher Evaluations",
				route: "/principal",
				query: "teacher",
			},
			{
				label: "Evaluate Teachers",
				route: "/principal",
				query: "evaluate",
			},
		],
	},
	{
		label: "Management",
		icon: "settings",
		children: [
			{ label: "Manage Accounts", route: "/principal", query: "manage" },
			{ label: "Archived Teachers", route: "/principal", query: "archived" },
			{ label: "Schedule", route: "/principal/scheduler" },
			{ label: "Upload CSV", route: "/principal/file-upload" },
		],
	},
	{
		label: "Questions",
		icon: "quiz",
		children: [
			{
				label: "Student Questions",
				route: "/principal/questions-student",
			},
			{
				label: "Teacher Questions",
				route: "/principal/questions-teacher",
			},
		],
	},
];

const expandedGroups = ref(new Set(["Dashboard", "Management", "Questions"]));

function toggleGroup(label) {
	if (expandedGroups.value.has(label)) {
		expandedGroups.value.delete(label);
	} else {
		expandedGroups.value.add(label);
	}
}

function navigate(item) {
	if (item.query) {
		router.push({ path: item.route, query: { tab: item.query } });
	} else {
		router.push(item.route);
	}
	sidebarOpen.value = false;
}

function isActive(item) {
	if (item.query) {
		return route.path === item.route && route.query.tab === item.query;
	}
	return route.path === item.route;
}

const pageTitle = computed(() => route.meta?.title || "Admin");
const adminInitials = ref("AD");
const adminFullName = ref("Admin");

function buildInitials(displayName, firstname, lastname) {
	const safeName = displayName || "Admin";
	const parts = safeName.trim().split(/\s+/);
	const firstInitial = (firstname || parts[0] || "A").charAt(0);
	const lastInitial = (lastname || parts[1] || "D").charAt(0);
	return `${firstInitial}${lastInitial}`.toUpperCase();
}

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		const displayName = (profile.fullname || "").trim() || `${profile.firstname || ""} ${profile.lastname || ""}`.trim();
		adminFullName.value = displayName || "Admin";
		adminInitials.value = buildInitials(displayName, profile.firstname, profile.lastname);
	}
}

onMounted(() => {
	loadProfile();
});
</script>

<template>
	<AppToast
		:visible="toast.visible"
		:message="toast.message"
		:type="toast.type"
		@close="toast.visible = false"
	/>
	<div class="admin-layout">
		<!-- Mobile overlay -->
		<Transition name="fade">
			<div
				v-if="sidebarOpen"
				class="sidebar-overlay"
				@click="sidebarOpen = false"
			></div>
		</Transition>

		<!-- Sidebar -->
		<aside class="sidebar" :class="{ open: sidebarOpen }">
			<div class="sidebar-header">
				<div class="logo-wrap">
					<img src="../assets/logo2.png" alt="EduRate Logo" class="app-logo" />
					<div class="logo-text">
						<h2 class="sidebar-logo">EduRate</h2>
						<span class="logo-sub">Admin Panel</span>
					</div>
				</div>
				<button class="sidebar-close" @click="sidebarOpen = false">
					<span class="material-icons">close</span>
				</button>
			</div>

			<nav class="sidebar-nav">
				<div
					v-for="group in navItems"
					:key="group.label"
					class="nav-group"
				>
					<button
						class="nav-group-btn"
						@click="toggleGroup(group.label)"
						:aria-expanded="expandedGroups.has(group.label)"
					>
						<span class="material-icons nav-icon" aria-hidden="true">{{
							group.icon
						}}</span>
						<span class="nav-label">{{ group.label }}</span>
						<span
							class="material-icons chevron"
							aria-hidden="true"
							:class="{
								expanded: expandedGroups.has(group.label),
							}"
						>
							expand_more
						</span>
					</button>

					<Transition name="expand">
						<div
							v-if="expandedGroups.has(group.label)"
							class="nav-children"
						>
							<button
								v-for="child in group.children"
								:key="child.label"
								class="nav-item"
								:class="{ active: isActive(child) }"
								:aria-current="isActive(child) ? 'page' : null"
								@click="navigate(child)"
							>
								<span class="nav-dot"></span>
								{{ child.label }}
							</button>
						</div>
					</Transition>
				</div>
			</nav>

			<div class="sidebar-footer">
				<div class="footer-divider"></div>
				<button class="sidebar-logout" @click="showLogoutModal = true">
					<span class="material-icons-outlined" aria-hidden="true">logout</span>
					Sign Out
				</button>
			</div>
		</aside>

		<!-- Main content -->
		<div class="main-wrapper">
			<!-- Topbar -->
			<header class="topbar">
				<div class="topbar-left">
					<button class="menu-btn" @click="sidebarOpen = true">
						<span class="material-icons">menu</span>
					</button>
					<span class="page-title">{{ pageTitle }}</span>
				</div>
				<div class="topbar-right">
					<ProfileDropdown
						:initials="adminInitials"
						:display-name="adminFullName"
						role="Admin"
						@logout="showLogoutModal = true"
						@settings="$router.push('/principal/settings')"
					/>
				</div>
			</header>

			<!-- Page content -->
			<main class="main-content">
				<router-view />
			</main>
		</div>

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
.admin-layout {
	display: flex;
	min-height: 100vh;
}

/* --- Sidebar --- */
.sidebar {
	position: fixed;
	top: 0;
	left: 0;
	width: var(--sidebar-width);
	height: 100vh;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-right: 1px solid rgba(226, 232, 240, 0.8);
	display: flex;
	flex-direction: column;
	z-index: 200;
	transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 80px;
	padding: 0 var(--space-5) 0 var(--space-6);
	border-bottom: 1px solid var(--color-border);
}

.logo-wrap {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.app-logo {
	width: 40px;
	height: 40px;
	object-fit: contain;
	border-radius: 50%;
}

.logo-text {
	display: flex;
	flex-direction: column;
}

.sidebar-logo {
	font-size: 1.125rem;
	font-weight: 800;
	color: var(--color-text);
	margin: 0;
	line-height: 1.2;
}

.logo-sub {
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.sidebar-close {
	display: none;
	background: none;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	padding: 0.25rem;
	cursor: pointer;
	color: var(--color-text-muted);
}

.sidebar-nav {
	flex: 1;
	overflow-y: auto;
	padding: var(--space-3) var(--space-3) var(--space-3) var(--space-3);
}

.sidebar-nav::-webkit-scrollbar {
	width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
	background: var(--color-bg-muted);
	border-radius: var(--radius-full);
}

.nav-group {
	margin-bottom: var(--space-1);
}

.nav-group-btn {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	width: 100%;
	padding: 0.625rem var(--space-4);
	background: none;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text);
	transition: all var(--transition-fast);
	border-radius: var(--radius-lg);
}

.nav-group-btn:hover {
	color: var(--color-text);
	background: var(--color-bg-subtle);
}

.nav-icon {
	font-size: 1.25rem;
	color: var(--color-text-secondary);
	transition: color var(--transition-fast);
}

.nav-group-btn:hover .nav-icon {
	color: var(--color-primary);
}

.nav-label {
	flex: 1;
	text-align: left;
}

.chevron {
	font-size: 1.125rem;
	color: var(--color-text-placeholder);
	transition: transform 0.25s ease, color var(--transition-fast);
}

.nav-group-btn:hover .chevron {
	color: var(--color-text-muted);
}

.chevron.expanded {
	transform: rotate(180deg);
	color: var(--color-primary);
}

.nav-children {
	padding: var(--space-1) 0 var(--space-1) var(--space-4);
}

.nav-item {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	width: 100%;
	padding: 0.5rem var(--space-4) 0.5rem var(--space-4);
	background: none;
	border: none;
	border-radius: var(--radius-lg);
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text-secondary);
	text-align: left;
	transition: all var(--transition-fast);
	position: relative;
}

.nav-item:hover {
	background: var(--color-bg-subtle);
	color: var(--color-text);
}

.nav-item.active {
	background: var(--color-primary-light);
	color: var(--color-primary);
	font-weight: 600;
}

.nav-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--color-text-placeholder);
	flex-shrink: 0;
	transition: all var(--transition-fast);
}

.nav-item:hover .nav-dot {
	background: var(--color-text-muted);
}

.nav-item.active .nav-dot {
	background: var(--color-primary);
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* --- Sidebar Footer --- */
.sidebar-footer {
	padding: var(--space-3) var(--space-4);
}

.footer-divider {
	height: 1px;
	background: var(--color-border);
	margin-bottom: var(--space-3);
}

.sidebar-logout {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	width: 100%;
	padding: 0.625rem var(--space-4);
	background: none;
	border: 1px solid transparent;
	border-radius: var(--radius-lg);
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text);
	transition: all var(--transition-fast);
}

.sidebar-logout:hover {
	background: #fef2f2;
	border-color: #fecaca;
	color: #dc2626;
}

.sidebar-logout .material-icons-outlined {
	font-size: 1.25rem;
}

/* --- Topbar --- */
.topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 80px;
	padding: 0 var(--space-6);
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	border-bottom: 1px solid rgba(226, 232, 240, 0.8);
	position: sticky;
	top: 0;
	z-index: 50;
	box-shadow: var(--shadow-sm);
}

.topbar-left {
	display: flex;
	align-items: center;
	gap: var(--space-4);
}

.menu-btn {
	display: none;
	background: none;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	padding: 0.375rem;
	cursor: pointer;
	color: var(--color-text-secondary);
}

.menu-btn:hover {
	background: var(--color-bg-subtle);
}

.page-title {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--color-text);
}

.topbar-right {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.desktop-signout {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	padding: 0.375rem 0.75rem;
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--color-text-muted);
	background: none;
	border: 1px solid transparent;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all var(--transition-fast);
}

.desktop-signout:hover {
	background: #fef2f2;
	color: #dc2626;
}

.desktop-signout .material-icons-outlined {
	font-size: 1rem;
}

/* --- Main --- */
.main-wrapper {
	flex: 1;
	margin-left: var(--sidebar-width);
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.main-content {
	flex: 1;
	padding: var(--space-6);
	max-width: 1400px;
	width: 100%;
	margin: 0 auto;
}

/* --- Overlay --- */
.sidebar-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	z-index: 150;
}

/* --- Transitions --- */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
	transition: all 0.2s ease;
	overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
	opacity: 0;
	max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
	opacity: 1;
	max-height: 200px;
}

/* Focus */
.nav-group-btn:focus-visible,
.nav-item:focus-visible,
.sidebar-logout:focus-visible,
.sidebar-close:focus-visible,
.menu-btn:focus-visible,
.desktop-signout:focus-visible {
	outline: 2px solid var(--color-primary);
	outline-offset: 2px;
}

/* --- Responsive --- */
@media (max-width: 1023px) {
	.sidebar {
		transform: translateX(-100%);
	}

	.sidebar.open {
		transform: translateX(0);
		box-shadow: var(--shadow-xl);
	}

	.sidebar-close {
		display: flex;
	}

	.menu-btn {
		display: flex;
	}

	.main-wrapper {
		margin-left: 0;
	}

	.desktop-signout {
		display: none;
	}

	.main-content {
		padding: var(--space-4);
	}
}
</style>
