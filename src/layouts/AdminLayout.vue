<script setup>

import { ref, computed, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useApi } from "../composables/useApi";
import API from "../utils/api";
import ConfirmModal from "../components/ConfirmModal.vue";
import AppToast from "../components/AppToast.vue";
import TopBar from "../components/common/TopBar.vue";
import { LayoutDashboard, Settings, HelpCircle, ChevronDown, LogOut, X, Menu, Megaphone } from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const { logout } = useAuth();
const { request } = useApi();

const sidebarOpen = ref(false);

const navItems = [
	{
		label: "Dashboard",
		icon: LayoutDashboard,
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
		icon: Settings,
		children: [
			{ label: "Manage Accounts", route: "/principal", query: "manage" },
			{ label: "Archived Teachers", route: "/principal", query: "archived" },
			{ label: "Announcements", route: "/principal/announcements" },
			{ label: "Schedule", route: "/principal/scheduler" },
			{ label: "Upload CSV", route: "/principal/file-upload" },
		],
	},
	{
		label: "Questions",
		icon: HelpCircle,
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
	<div class="flex min-h-screen bg-slate-50 font-sans">
		<!-- Mobile overlay -->
		<Transition
			enter-active-class="transition-opacity ease-linear duration-300"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity ease-linear duration-300"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="sidebarOpen"
				class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
				@click="sidebarOpen = false"
			></div>
		</Transition>

		<!-- Sidebar -->
		<aside
			:class="[
				'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white/90 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
				sidebarOpen ? 'translate-x-0' : '-translate-x-full'
			]"
		>
			<div class="flex h-16 items-center justify-between border-b border-slate-100 px-6 sm:h-20">
				<div class="flex items-center gap-3">
					<img src="../assets/logo2.png" alt="EduRate Logo" class="h-10 w-10 rounded-full object-contain shadow-sm" />
					<div class="flex flex-col">
						<h2 class="text-lg font-extrabold leading-tight text-slate-900">EduRate</h2>
						<span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Admin Panel</span>
					</div>
				</div>
				<button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden" @click="sidebarOpen = false">
					<X class="h-5 w-5" />
				</button>
			</div>

			<nav class="flex-1 overflow-y-auto p-4 space-y-2">
				<div v-for="group in navItems" :key="group.label" class="space-y-1">
					<button
						@click="toggleGroup(group.label)"
						class="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
					>
						<div class="flex items-center gap-3">
							<component :is="group.icon" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-500" />
							<span>{{ group.label }}</span>
						</div>
						<ChevronDown
							:class="[
								'h-4 w-4 text-slate-400 transition-transform duration-200',
								expandedGroups.has(group.label) ? 'rotate-180 text-indigo-500' : ''
							]"
						/>
					</button>

					<Transition
						enter-active-class="transition-all duration-300 ease-in-out"
						enter-from-class="max-h-0 opacity-0"
						enter-to-class="max-h-96 opacity-100"
						leave-active-class="transition-all duration-200 ease-in-out"
						leave-from-class="max-h-96 opacity-100"
						leave-to-class="max-h-0 opacity-0"
					>
						<div v-show="expandedGroups.has(group.label)" class="overflow-hidden px-4 py-1">
							<button
								v-for="child in group.children"
								:key="child.label"
								@click="navigate(child)"
								:class="[
									'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
									isActive(child) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
								]"
							>
								<div :class="['h-1.5 w-1.5 rounded-full transition-colors', isActive(child) ? 'bg-indigo-500 ring-4 ring-indigo-100' : 'bg-slate-300']"></div>
								{{ child.label }}
							</button>
						</div>
					</Transition>
				</div>
			</nav>
		</aside>

		<!-- Main content -->
		<div class="flex w-0 flex-1 flex-col overflow-hidden">
			<!-- Topbar -->
			<TopBar :title="pageTitle">
				<template #left>
					<button class="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden" @click="sidebarOpen = true">
						<Menu class="h-5 w-5" />
					</button>
				</template>
			</TopBar>

			<!-- Page content -->
			<main class="flex-1 overflow-y-auto bg-slate-50 bg-[url('/assets/background.png')] bg-cover bg-fixed bg-center p-3 sm:p-6 lg:p-8">
				<div class="mx-auto max-w-6xl">
					<router-view />
				</div>
			</main>
		</div>
	</div>
</template>
