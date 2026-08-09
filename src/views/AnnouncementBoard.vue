<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../composables/useApi";
import { useAuth } from "../composables/useAuth";
import { useToast } from "../composables/useToast";
import API from "../utils/api";
import { 
	Megaphone, Check, CheckCircle2, Pin, ArrowLeft
} from "@lucide/vue";

const { request, isLoading } = useApi();
const { requireAuth } = useAuth();
const { showToast } = useToast();
const router = useRouter();

const announcements = ref([]);
const activeFilter = ref("ALL");

// Map category to color classes
const categoryStyles = {
	EVALUATION: "bg-indigo-50 text-indigo-700 border-indigo-200",
	SYSTEM: "bg-slate-100 text-slate-700 border-slate-200",
	REMINDER: "bg-amber-50 text-amber-700 border-amber-200",
	EVENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
	GENERAL: "bg-blue-50 text-blue-700 border-blue-200",
};

async function fetchAnnouncements() {
	const result = await request(`${API.announcements}/feed`, { method: "GET" });
	if (result.success) {
		announcements.value = result.announcements || [];
	} else {
		showToast("Failed to load announcements", "error");
	}
}

async function markAsRead(id) {
	const result = await request(`${API.announcements}/${id}/read`, { method: "POST" });
	if (result.success) {
		const target = announcements.value.find(a => a.id === id);
		if (target) target.is_read = true;
	}
}

async function markAllAsRead() {
	const result = await request(`${API.announcements}/read-all`, { method: "POST" });
	if (result.success) {
		announcements.value.forEach(a => a.is_read = true);
		showToast("All announcements marked as read", "success");
	}
}

const unreadCount = computed(() => {
	return announcements.value.filter(a => !a.is_read).length;
});

const filteredAnnouncements = computed(() => {
	if (activeFilter.value === "ALL") return announcements.value;
	return announcements.value.filter(a => a.category === activeFilter.value);
});

const filterCounts = computed(() => {
	const counts = { ALL: announcements.value.length, EVALUATION: 0, SYSTEM: 0, REMINDER: 0, EVENT: 0 };
	announcements.value.forEach(a => {
		if (counts[a.category] !== undefined) {
			counts[a.category]++;
		}
	});
	return counts;
});

function timeAgo(dateStr) {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now - date;
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "1 day ago";
	if (diffDays < 7) return `${diffDays} days ago`;
	
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

onMounted(() => {
	if (requireAuth()) {
		fetchAnnouncements();
	}
});
</script>

<template>
	<div class="animate-fade-up space-y-6 max-w-4xl mx-auto w-full">
		<!-- Back Button -->
		<button @click="router.back()" class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
			<ArrowLeft class="h-4 w-4" />
			Back to Dashboard
		</button>

		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div>
				<h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
					Announcement Board
				</h2>
				<p class="mt-1 text-sm text-slate-500">
					{{ unreadCount }} unread updates from your school and the EduRate team.
				</p>
			</div>
			<button 
				@click="markAllAsRead"
				:disabled="unreadCount === 0"
				class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Check class="h-4 w-4" />
				Mark all as read
			</button>
		</div>

		<!-- Filters -->
		<div class="flex flex-wrap items-center gap-2">
			<button 
				v-for="(count, filter) in filterCounts" 
				:key="filter"
				@click="activeFilter = filter"
				class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
				:class="activeFilter === filter ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
			>
				{{ filter.charAt(0) + filter.slice(1).toLowerCase() }}
				<span class="inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600"
					:class="activeFilter === filter ? 'bg-indigo-100 text-indigo-700' : ''">
					{{ count }}
				</span>
			</button>
		</div>

		<!-- List -->
		<div v-if="filteredAnnouncements.length === 0" class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
				<Megaphone class="h-7 w-7" />
			</div>
			<h3 class="text-sm font-bold text-slate-900">No announcements found</h3>
			<p class="mt-1 text-sm text-slate-500">
				You're all caught up!
			</p>
		</div>

		<div v-else class="space-y-4">
			<div 
				v-for="post in filteredAnnouncements" 
				:key="post.id"
				class="rounded-2xl border bg-white p-6 transition-all"
				:class="post.is_read ? 'border-slate-200 shadow-sm' : 'border-indigo-100 shadow-md ring-1 ring-indigo-500/10'"
			>
				<div class="flex flex-wrap items-center gap-2 mb-4">
					<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" :class="categoryStyles[post.category] || categoryStyles.GENERAL">
						{{ post.category }}
					</span>
					<span v-if="post.is_pinned" class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
						<Pin class="h-3 w-3" /> Pinned
					</span>
					<span v-if="!post.is_read" class="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
						New
					</span>
				</div>
				
				<h3 class="text-lg font-bold text-slate-900 mb-2">{{ post.title }}</h3>
				<p class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mb-6">{{ post.content }}</p>
				
				<div class="flex items-center justify-between border-t border-slate-100 pt-4">
					<div class="text-xs text-slate-500">
						<span class="font-medium text-slate-700">{{ post.author_id }}</span> &middot; {{ timeAgo(post.created_at) }}
					</div>
					<button 
						v-if="!post.is_read"
						@click="markAsRead(post.id)"
						class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
					>
						<Check class="h-3.5 w-3.5" /> Mark as read
					</button>
					<div v-else class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400">
						<Check class="h-3.5 w-3.5" /> Read
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
