<script setup>
import { ref, onMounted, computed } from "vue";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import ConfirmModal from "../../components/ConfirmModal.vue";
import API from "../../utils/api";
import { 
	Megaphone, Trash2, Send, Clock, Plus, Loader2, MoreHorizontal, Pencil, X, Pin
} from "@lucide/vue";

const { request, isLoading } = useApi();
const { requireAuth, userData } = useAuth();
const { showToast } = useToast();

const announcements = ref([]);
const newTitle = ref("");
const newContent = ref("");
const newCategory = ref("GENERAL");
const newIsPinned = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);
const activeDropdown = ref(null);

const showDeleteModal = ref(false);
const announcementToDelete = ref(null);

const currentUser = computed(() => userData.value || JSON.parse(localStorage.getItem("userData") || "{}"));
const authorId = computed(() => currentUser.value.id || "admin");

async function fetchAnnouncements() {
	const result = await request(API.announcements, { method: "GET" });
	if (result.success) {
		announcements.value = result.announcements || [];
	} else {
		showToast("Failed to load announcements", "error");
	}
}

async function saveAnnouncement() {
	if (!newTitle.value.trim() || !newContent.value.trim()) {
		showToast("Please fill in both title and content.", "warning");
		return;
	}

	isSubmitting.value = true;
	const isEditing = !!editingId.value;
	const url = isEditing ? `${API.announcements}/${editingId.value}` : API.announcements;
	
	const result = await request(url, {
		method: isEditing ? "PUT" : "POST",
		body: {
			title: newTitle.value.trim(),
			content: newContent.value.trim(),
			category: newCategory.value,
			is_pinned: newIsPinned.value,
			author_id: authorId.value,
		}
	});

	if (result.success) {
		showToast(`Announcement ${isEditing ? 'updated' : 'posted'} successfully!`, "success");
		cancelEdit();
		await fetchAnnouncements();
	} else {
		showToast(result.error || `Failed to ${isEditing ? 'update' : 'post'} announcement`, "error");
	}
	isSubmitting.value = false;
}

function startEdit(post) {
	editingId.value = post.id;
	newTitle.value = post.title;
	newContent.value = post.content;
	newCategory.value = post.category || "GENERAL";
	newIsPinned.value = post.is_pinned || false;
	activeDropdown.value = null;
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
	editingId.value = null;
	newTitle.value = "";
	newContent.value = "";
	newCategory.value = "GENERAL";
	newIsPinned.value = false;
}

function toggleDropdown(id) {
	if (activeDropdown.value === id) {
		activeDropdown.value = null;
	} else {
		activeDropdown.value = id;
	}
}

// Close dropdown when clicking outside
onMounted(() => {
	document.addEventListener('click', (e) => {
		if (!e.target.closest('.dropdown-container')) {
			activeDropdown.value = null;
		}
	});
});

function confirmDelete(id) {
	announcementToDelete.value = id;
	showDeleteModal.value = true;
}

async function executeDelete() {
	if (!announcementToDelete.value) return;
	
	const id = announcementToDelete.value;
	const result = await request(`${API.announcements}/${id}`, {
		method: "DELETE"
	});

	if (result.success) {
		showToast("Announcement deleted", "success");
		announcements.value = announcements.value.filter(a => a.id !== id);
	} else {
		showToast(result.error || "Failed to delete announcement", "error");
	}
	showDeleteModal.value = false;
	announcementToDelete.value = null;
}

function formatDate(dateStr) {
	const d = new Date(dateStr);
	return d.toLocaleString("en-US", { 
		month: "short", 
		day: "numeric", 
		year: "numeric", 
		hour: "numeric", 
		minute: "2-digit" 
	});
}

onMounted(() => {
	if (requireAuth()) {
		fetchAnnouncements();
	}
});
</script>

<template>
	<div class="animate-fade-up space-y-8">
		<!-- Page Header -->
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
				<Megaphone class="h-6 w-6" />
			</div>
			<div>
				<h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
					Announcements
				</h2>
				<p class="mt-1 text-sm text-slate-500">
					Post updates and important information for teachers and students.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
			<!-- Compose Announcement -->
			<div class="lg:col-span-1 space-y-4">
				<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300" :class="editingId ? 'ring-2 ring-indigo-500 shadow-md' : ''">
					<div class="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex justify-between items-center">
						<h3 class="flex items-center gap-2 text-base font-bold text-slate-900">
							<Pencil v-if="editingId" class="h-4 w-4 text-indigo-500" />
							<Plus v-else class="h-4 w-4 text-indigo-500" /> 
							{{ editingId ? 'Edit Announcement' : 'Compose' }}
						</h3>
						<button v-if="editingId" @click="cancelEdit" class="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors">
							<X class="h-4 w-4" />
						</button>
					</div>
					<div class="p-5 space-y-4">
						<div>
							<label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
							<input
								v-model="newTitle"
								type="text"
								placeholder="e.g. Schedule Update"
								class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Message Content</label>
							<textarea
								v-model="newContent"
								rows="5"
								placeholder="Write your announcement here..."
								class="block w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
							></textarea>
						</div>
						<div class="flex items-center gap-4">
							<div class="flex-1">
								<label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
								<select
									v-model="newCategory"
									class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none"
								>
									<option value="GENERAL">General</option>
									<option value="EVALUATION">Evaluation</option>
									<option value="SYSTEM">System</option>
									<option value="REMINDER">Reminder</option>
									<option value="EVENT">Event</option>
								</select>
							</div>
							<div class="flex items-center pt-5">
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" v-model="newIsPinned" class="sr-only peer">
									<div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
									<span class="ml-3 text-sm font-bold text-slate-700 flex items-center gap-1.5"><Pin class="h-4 w-4" /> Pin</span>
								</label>
							</div>
						</div>
						<button
							@click="saveAnnouncement"
							:disabled="isSubmitting || !newTitle.trim() || !newContent.trim()"
							class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
							:class="editingId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
						>
							<Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
							<Send v-else class="h-4 w-4" />
							{{ editingId ? 'Save Changes' : 'Post Announcement' }}
						</button>
						<button
							v-if="editingId"
							@click="cancelEdit"
							class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
						>
							Cancel Edit
						</button>
					</div>
				</div>
			</div>

			<!-- Announcement Feed -->
			<div class="lg:col-span-2 space-y-4">
				<div v-if="isLoading" class="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
					<Loader2 class="h-8 w-8 animate-spin text-indigo-500 mb-4" />
					<p class="text-sm font-medium text-slate-500">Loading announcements...</p>
				</div>
				
				<template v-else>
					<div v-if="announcements.length === 0" class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
						<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
							<Megaphone class="h-7 w-7" />
						</div>
						<h3 class="text-sm font-bold text-slate-900">No announcements yet</h3>
						<p class="mt-1 text-sm text-slate-500">
							When you post an announcement, it will appear here.
						</p>
					</div>

					<div v-else class="space-y-4">
						<div
							v-for="post in announcements"
							:key="post.id"
							class="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-1">
									<h3 class="text-lg font-bold text-slate-900">{{ post.title }}</h3>
									<div class="flex items-center gap-2 text-xs font-medium text-slate-500">
										<Clock class="h-3.5 w-3.5" />
										{{ formatDate(post.created_at) }}
									</div>
								</div>
								<div class="relative dropdown-container">
									<button
										@click.stop="toggleDropdown(post.id)"
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
										title="Options"
									>
										<MoreHorizontal class="h-5 w-5" />
									</button>
									
									<Transition
										enter-active-class="transition duration-100 ease-out"
										enter-from-class="transform scale-95 opacity-0"
										enter-to-class="transform scale-100 opacity-100"
										leave-active-class="transition duration-75 ease-in"
										leave-from-class="transform scale-100 opacity-100"
										leave-to-class="transform scale-95 opacity-0"
									>
										<div v-if="activeDropdown === post.id" class="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg z-50">
											<button
												@click="startEdit(post)"
												class="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
											>
												<Pencil class="h-4 w-4" />
												Edit
											</button>
											<div class="h-px bg-slate-100"></div>
											<button
												@click="confirmDelete(post.id)"
												class="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
											>
												<Trash2 class="h-4 w-4" />
												Delete
											</button>
										</div>
									</Transition>
								</div>
							</div>
							<div class="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
								{{ post.content }}
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		<ConfirmModal
			v-model:visible="showDeleteModal"
			title="Delete Announcement"
			message="Are you sure you want to delete this announcement? This action cannot be undone."
			confirmText="Delete"
			cancelText="Cancel"
			:danger="true"
			icon="trash"
			@confirm="executeDelete"
		/>
	</div>
</template>
