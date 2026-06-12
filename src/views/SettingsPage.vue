<script setup>
import { ref, reactive, onMounted } from "vue";
import { useApi } from "../composables/useApi";
import API from "../utils/api";
import AppToast from "../components/AppToast.vue";
import LoadingOverlay from "../components/LoadingOverlay.vue";

const { request, isLoading } = useApi();
const user = ref({});
const toast = reactive({ visible: false, message: "", type: "success" });

const passwordForm = reactive({
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const evaluatorsList = ref([]);
const studentEvaluations = ref([]);
const peerEvaluations = ref([]);

const scoreRanges = [
	{ label: "4.5-5.0", min: 4.5, max: 5.01, color: "#16a34a" },
	{ label: "3.5-4.4", min: 3.5, max: 4.5, color: "#2563eb" },
	{ label: "2.5-3.4", min: 2.5, max: 3.5, color: "#d97706" },
	{ label: "1.0-2.4", min: 1.0, max: 2.5, color: "#dc2626" },
];

async function loadProfile() {
	const result = await request(API.profile, { method: "GET" });
	if (result.success) {
		const profile = result.profile || {};
		user.value = {
			firstname: profile.firstname || "",
			lastname: profile.lastname || "",
			email: profile.email || "",
			role: profile.role || "",
		};
		if (user.value.role === "Teacher") {
			fetchEvaluations();
		}
	}
}

onMounted(() => {
	loadProfile();
});

async function fetchEvaluations() {
	const result = await request(API.evalMyEvaluations, { body: {} });
	if (result.success) {
		const all = result.evaluators || [];
		evaluatorsList.value = all;
		studentEvaluations.value = all.filter((e) => e.type === "student");
		peerEvaluations.value = all.filter((e) => e.type === "peer");
	}
}

async function updatePassword() {
	if (passwordForm.newPassword !== passwordForm.confirmPassword) {
		toast.message = "Passwords do not match.";
		toast.type = "error";
		toast.visible = true;
		return;
	}
	
	const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-+=<>?]).{8,}$/;
	if (!passwordRegex.test(passwordForm.newPassword)) {
		toast.message = "Password must be at least 8 characters long and include numbers and symbols.";
		toast.type = "error";
		toast.visible = true;
		return;
	}

	const result = await request(API.updatePassword, {
		body: {
			currentPassword: passwordForm.currentPassword,
			newPassword: passwordForm.newPassword,
			confirmPassword: passwordForm.confirmPassword,
			email: user.value.email,
		},
		auth: false,
	});

	if (result.success) {
		toast.message = "Password updated successfully!";
		toast.type = "success";
		toast.visible = true;
		passwordForm.currentPassword = "";
		passwordForm.newPassword = "";
		passwordForm.confirmPassword = "";
		showCurrentPassword.value = false;
		showNewPassword.value = false;
		showConfirmPassword.value = false;
	} else {
		toast.message = result.error || "Failed to update password.";
		toast.type = "error";
		toast.visible = true;
	}
}
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast
		:visible="toast.visible"
		:message="toast.message"
		:type="toast.type"
		@close="toast.visible = false"
	/>
	
	<div class="settings-page">
		<div class="page-header">
			<button class="btn-back" @click="$router.push(user.role === 'Admin' ? '/principal' : `/${user.role?.toLowerCase()}`)">
				<span class="material-icons">arrow_back</span>
				Back to Dashboard
			</button>
			<h2 class="page-title">Profile Settings</h2>
		</div>
		
		<div class="settings-grid">
			<!-- Profile Card -->
			<div class="card profile-card">
				<h3 class="card-title">Profile Information</h3>
				<div class="profile-info">
					<div class="avatar-large">
						{{ (user.firstname?.charAt(0) || '') + (user.lastname?.charAt(0) || '') }}
					</div>
					<div class="info-details">
						<h4>{{ user.firstname }} {{ user.lastname }}</h4>
						<span class="badge">{{ user.role }}</span>
						<p class="email-text">{{ user.email }}</p>
					</div>
				</div>

				<!-- Teacher Score Distribution -->
				<div v-if="user.role === 'Teacher'" class="eval-score-dist">
					<h3 class="card-title" style="margin-top: 2rem;">Student Evaluations</h3>
					<div class="eval-dist-bars">
						<div v-for="range in scoreRanges" :key="'student-' + range.label" class="eval-dist-row">
							<span class="eval-dist-range">{{ range.label }}</span>
							<div class="eval-dist-bar-wrap">
								<div class="eval-dist-bar-fill" :style="{ width: studentEvaluations.length ? (studentEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length / studentEvaluations.length * 100) + '%' : '0%', background: range.color }"></div>
							</div>
							<span class="eval-dist-count">{{ studentEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length }}</span>
						</div>
					</div>

					<h3 class="card-title" style="margin-top: 2rem;">Peer Evaluations</h3>
					<div class="eval-dist-bars">
						<div v-for="range in scoreRanges" :key="'peer-' + range.label" class="eval-dist-row">
							<span class="eval-dist-range">{{ range.label }}</span>
							<div class="eval-dist-bar-wrap">
								<div class="eval-dist-bar-fill" :style="{ width: peerEvaluations.length ? (peerEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length / peerEvaluations.length * 100) + '%' : '0%', background: range.color }"></div>
							</div>
							<span class="eval-dist-count">{{ peerEvaluations.filter(e => Number(e.avg) >= range.min && Number(e.avg) < range.max).length }}</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Security Card -->
			<div class="card security-card">
				<h3 class="card-title">Security Settings</h3>
				<form @submit.prevent="updatePassword" class="password-form">
					<div class="form-group">
						<label for="current-pw">Current Password</label>
						<div class="password-wrapper">
							<input id="current-pw" :type="showCurrentPassword ? 'text' : 'password'" v-model="passwordForm.currentPassword" placeholder="Enter current password" required />
							<span class="material-icons visibility-toggle" @click="showCurrentPassword = !showCurrentPassword">
								{{ showCurrentPassword ? 'visibility' : 'visibility_off' }}
							</span>
						</div>
					</div>
					<div class="form-group">
						<label for="new-pw">New Password</label>
						<div class="password-wrapper">
							<input id="new-pw" :type="showNewPassword ? 'text' : 'password'" v-model="passwordForm.newPassword" placeholder="Enter new password" required />
							<span class="material-icons visibility-toggle" @click="showNewPassword = !showNewPassword">
								{{ showNewPassword ? 'visibility' : 'visibility_off' }}
							</span>
						</div>
					</div>
					<div class="form-group">
						<label for="confirm-pw">Confirm Password</label>
						<div class="password-wrapper">
							<input id="confirm-pw" :type="showConfirmPassword ? 'text' : 'password'" v-model="passwordForm.confirmPassword" placeholder="Confirm new password" required />
							<span class="material-icons visibility-toggle" @click="showConfirmPassword = !showConfirmPassword">
								{{ showConfirmPassword ? 'visibility' : 'visibility_off' }}
							</span>
						</div>
					</div>
					<button type="submit" class="btn btn-primary" :disabled="isLoading">Update Password</button>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
.settings-page {
	animation: fadeIn 0.3s ease;
}

.page-header {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--space-2, 0.5rem);
	margin-bottom: var(--space-6, 1.5rem);
}

.page-title {
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--color-text, #0f172a);
	margin-bottom: 0;
}

.btn-back {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2, 0.5rem);
	background: none;
	border: none;
	color: #64748b;
	font-weight: 500;
	font-size: 0.875rem;
	padding: 0;
	cursor: pointer;
	transition: color 0.2s;
}

.btn-back:hover {
	color: #4f46e5;
}

.btn-back .material-icons {
	font-size: 1.25rem;
}

.settings-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-6, 1.5rem);
	align-items: start;
}

@media (min-width: 768px) {
	.settings-grid {
		grid-template-columns: 1fr 1fr;
	}
}

.card {
	background: #ffffff;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: var(--radius-lg, 0.5rem);
	padding: var(--space-6, 1.5rem);
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-title {
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: var(--space-5, 1.25rem);
	padding-bottom: var(--space-3, 0.75rem);
	border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.profile-info {
	display: flex;
	align-items: center;
	gap: var(--space-5, 1.25rem);
}

.avatar-large {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
	color: #4f46e5;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	font-weight: 700;
	flex-shrink: 0;
}

.info-details h4 {
	font-size: 1.25rem;
	font-weight: 700;
	color: #0f172a;
	margin: 0 0 var(--space-2, 0.5rem) 0;
}

.badge {
	display: inline-block;
	background: #f1f5f9;
	color: #475569;
	padding: 2px 8px;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	margin-bottom: var(--space-2, 0.5rem);
}

.email-text {
	color: #64748b;
	font-size: 0.875rem;
	margin: 0;
}

.password-form {
	display: flex;
	flex-direction: column;
	gap: var(--space-4, 1rem);
}

.password-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
}

.password-wrapper input {
	width: 100%;
	padding-right: 2.5rem !important;
}

.visibility-toggle {
	position: absolute;
	right: 0.875rem;
	cursor: pointer;
	color: #64748b;
	font-size: 1.25rem;
	user-select: none;
	transition: color 0.2s;
}

.visibility-toggle:hover {
	color: #4f46e5;
}

.form-group label {
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #475569;
	margin-bottom: var(--space-2, 0.5rem);
}

.form-group input {
	width: 100%;
	padding: 0.625rem 0.875rem;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md, 0.375rem);
	font-size: 0.875rem;
	color: #0f172a;
	outline: none;
	transition: border-color 0.15s;
	box-sizing: border-box;
}

.form-group input:focus {
	border-color: #4f46e5;
}

.btn-primary {
	background: #4f46e5;
	color: #ffffff;
	border: none;
	padding: 0.75rem 1rem;
	border-radius: var(--radius-md, 0.375rem);
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
	margin-top: var(--space-2, 0.5rem);
}

.btn-primary:hover:not(:disabled) {
	background: #4338ca;
}

.btn-primary:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

/* Score Distribution */
.eval-dist-bars {
	display: flex;
	flex-direction: column;
	gap: var(--space-3, 0.75rem);
}

.eval-dist-row {
	display: flex;
	align-items: center;
	gap: var(--space-4, 1rem);
}

.eval-dist-range {
	width: 60px;
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
}

.eval-dist-bar-wrap {
	flex: 1;
	height: 12px;
	background: #f1f5f9;
	border-radius: 9999px;
	overflow: hidden;
}

.eval-dist-bar-fill {
	height: 100%;
	border-radius: 9999px;
	transition: width 0.5s ease-out;
}

.eval-dist-count {
	width: 24px;
	text-align: right;
	font-size: 0.875rem;
	font-weight: 600;
	color: #0f172a;
}

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(5px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
