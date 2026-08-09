const fs = require('fs');

const path = 'src/components/ManageAccounts.vue';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Shield,')) {
    content = content.replace('import { Search,', 'import { Search, Shield, BookType,');
}

const newModal = `		<!-- Create/Edit Modal -->
		<Teleport to="body">
		<Transition
			enter-active-class="transition-opacity duration-300 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div v-if="showCreateForm || isEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md sm:p-6">
				<div class="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 md:flex-row" @click.stop>
					
					<!-- Left Sidebar (Desktop only or top on mobile) -->
					<div class="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white md:w-2/5 shrink-0">
						<!-- Decorative circles -->
						<div class="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
						<div class="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
						
						<div class="relative z-10">
							<div class="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner ring-1 ring-white/30">
								<component :is="isEditing ? Edit2 : UserPlus" class="h-7 w-7 text-white" />
							</div>
							<h3 class="text-3xl font-extrabold tracking-tight">
								{{ isEditing ? "Edit Teacher" : "Add Teacher" }}
							</h3>
							<p class="mt-4 text-indigo-100 text-sm leading-relaxed max-w-sm">
								{{ isEditing ? "Update the academic details, personal information, and credentials for this faculty member." : "Create a new faculty account. They will receive credentials to access the evaluation portal." }}
							</p>
						</div>

						<div class="relative z-10 mt-12 hidden md:block">
							<div class="space-y-6 text-sm font-semibold text-indigo-200/80">
								<div class="flex items-center gap-4">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
										<Users class="h-4 w-4 text-white" />
									</div>
									<span class="text-indigo-100">Basic Information</span>
								</div>
								<div class="flex items-center gap-4">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
										<BookType class="h-4 w-4 text-white" />
									</div>
									<span class="text-indigo-100">Academic Details</span>
								</div>
								<div v-if="!isEditing" class="flex items-center gap-4">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
										<Shield class="h-4 w-4 text-white" />
									</div>
									<span class="text-indigo-100">Security Setup</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Form Content -->
					<div class="relative flex-1 overflow-y-auto bg-slate-50/50 p-6 sm:p-10 custom-scrollbar">
						<div class="flex items-center justify-end md:hidden mb-6">
							<button @click="isEditing ? cancelEdit() : (showCreateForm = false)" class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
								<X class="h-5 w-5" />
							</button>
						</div>
						
						<!-- Desktop Close Button -->
						<button @click="isEditing ? cancelEdit() : (showCreateForm = false)" class="absolute top-6 right-6 hidden md:flex items-center justify-center rounded-full bg-slate-100 p-2.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors z-10">
							<X class="h-5 w-5" />
						</button>

						<form @submit.prevent="isEditing ? saveEdit() : createTeacher()" class="space-y-10 max-w-2xl mx-auto">
							
							<!-- Basic Info Section -->
							<div class="space-y-6">
								<div class="flex items-center gap-3 border-b border-slate-200 pb-3">
									<Users class="h-5 w-5 text-indigo-500" />
									<h4 class="font-bold text-slate-800 text-lg">Basic Information</h4>
								</div>
								
								<div class="grid gap-6 sm:grid-cols-2">
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
										<input v-model="(isEditing ? editForm : teacherForm).fn" type="text" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
									</div>
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
										<input v-model="(isEditing ? editForm : teacherForm).ln" type="text" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
									</div>
									<div class="group space-y-2 sm:col-span-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
										<input v-model="(isEditing ? editForm : teacherForm).email" type="email" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
									</div>
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</label>
										<input v-model="(isEditing ? editForm : teacherForm).id" type="text" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
									</div>
								</div>
							</div>

							<!-- Academic Details Section -->
							<div class="space-y-6">
								<div class="flex items-center gap-3 border-b border-slate-200 pb-3">
									<BookType class="h-5 w-5 text-indigo-500" />
									<h4 class="font-bold text-slate-800 text-lg">Academic Details</h4>
								</div>
								
								<div class="grid gap-6 sm:grid-cols-2">
									<div class="group space-y-2 sm:col-span-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Department / Subject</label>
										<select v-model="(isEditing ? editForm : teacherForm).sub" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300">
											<option disabled value="">Select Subject</option>
											<option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
										</select>
									</div>
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter</label>
										<select v-model="(isEditing ? editForm : teacherForm).qrt" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300">
											<option value="1">1st Quarter</option>
											<option value="2">2nd Quarter</option>
											<option value="3">3rd Quarter</option>
											<option value="4">4th Quarter</option>
										</select>
									</div>
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">School Year</label>
										<input v-model="(isEditing ? editForm : teacherForm).yr" type="number" placeholder="YYYY" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
									</div>
								</div>
							</div>

							<!-- Security Section -->
							<div v-if="!isEditing" class="space-y-6">
								<div class="flex items-center gap-3 border-b border-slate-200 pb-3">
									<Shield class="h-5 w-5 text-indigo-500" />
									<h4 class="font-bold text-slate-800 text-lg">Security Setup</h4>
								</div>
								
								<div class="grid gap-6 sm:grid-cols-2">
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
										<div class="relative">
											<input v-model="teacherForm.ps" :type="showPassword ? 'text' : 'password'" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 pr-10 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
											<button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-indigo-600">
												<component :is="showPassword ? EyeOff : Eye" class="h-5 w-5" />
											</button>
										</div>
									</div>
									<div class="group space-y-2">
										<label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
										<div class="relative">
											<input v-model="teacherForm.cpas" :type="showPassword ? 'text' : 'password'" required class="block w-full rounded-xl border-0 bg-white shadow-sm ring-1 ring-inset ring-slate-200 px-4 py-3 pr-10 text-sm transition-all focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-slate-300" />
										</div>
									</div>
								</div>
							</div>

							<!-- Actions -->
							<div class="mt-10 flex items-center gap-4 pt-6">
								<button type="button" @click="isEditing ? cancelEdit() : (showCreateForm = false)" class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200">
									Cancel
								</button>
								<button type="submit" class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
									<Save class="h-5 w-5" />
									{{ isEditing ? "Save Changes" : "Create Account" }}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}
</style>`;

const startRegex = /<!-- Create\/Edit Modal -->[\s\S]*?<Teleport to="body">[\s\S]*?<Transition[\s\S]*?>[\s\S]*?<div v-if="showCreateForm \|\| isEditing"[^>]*>[\s\S]*?<div class="w-full max-w-3xl/m;
const startIndex = content.search(startRegex);

if (startIndex === -1) {
    console.error("Could not find start index");
    process.exit(1);
}

const endStr = `</Transition>\n\t\t</Teleport>\n\t</div>\n</template>`;
const endIndex = content.lastIndexOf(endStr);

if (endIndex === -1) {
    console.error("Could not find end index");
    process.exit(1);
}

// And also replace fetchSubjects properly
content = content.replace(
    /async function fetchSubjects\(\) {[\s\S]*?subjects\.value = result\.subjects \|\| \[\];\n\t\}\n\}/,
    `async function fetchSubjects() {
	const result = await request(API.subjects, { body: { action: "getSubjects" } });
	if (result.success) {
		subjects.value = (result.subjects || []).map(s => ({
			id: s.id,
			name: s.subjects || s.name
		}));
	}
}`
);

const finalContent = content.substring(0, startIndex) + newModal;
fs.writeFileSync(path, finalContent);
console.log("Successfully replaced modal and fetchSubjects.");
