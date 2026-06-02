<script setup>
import { ref, reactive, nextTick, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useAuth } from "../../composables/useAuth";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import AppToast from "../../components/AppToast.vue";
import API from "../../utils/api";

const router = useRouter();
const { request, isLoading } = useApi();
const { login } = useAuth();

// Modal state
const activeModal = ref("");
const activeTab = ref("login");
const errorMsg = ref("");

// Toast state
const toast = reactive({ visible: false, message: "", type: "error" });

// Scroll & Backdrop states for Terms and Privacy modals
const hasScrolledToBottom = ref(false);
const agreed = ref(false);

function handleScroll(e) {
	const target = e.target;
	if (target.scrollHeight - target.scrollTop <= target.clientHeight + 8) {
		hasScrolledToBottom.value = true;
	}
}

function handleBackdropClick() {
	if (activeModal.value === "terms" || activeModal.value === "privacy") {
		return;
	}
	closeModal();
}

function showToast(message, type = "error") {
	toast.message = message;
	toast.type = type;
	toast.visible = true;
}

// Form data
const studentForm = reactive({ id: "", ps: "" });
const teacherForm = reactive({ id: "", ps: "" });
const adminForm = reactive({ id: "", ps: "" });
const forgotForm = reactive({
	email: "",
	code: "",
	newPassword: "",
	confirmPassword: "",
});

const showStudentPassword = ref(false);
const showTeacherPassword = ref(false);
const showAdminPassword = ref(false);

// Login handler
async function handleLogin(role) {
	errorMsg.value = "";
	let url, body;

	if (role === "student") {
		url = API.login;
		body = { action: "login", id: studentForm.id, ps: studentForm.ps };
	} else if (role === "teacher") {
		url = API.loginTeacher;
		body = { action: "login", id: teacherForm.id, ps: teacherForm.ps };
	} else {
		url = API.loginAdmin;
		body = { action: "login", id: adminForm.id, ps: adminForm.ps };
	}

	const result = await request(url, { body, auth: false });

	if (result.success) {
		if (result.scheduleClosed) {
			closeModal();
			router.push('/closed');
			return;
		}

		showToast("Login Successful! Redirecting...", "success");
		login(result.token, result.userData);
		const redirectMap = {
			student: "/student",
			teacher: "/teacher",
			admin: "/principal",
		};
		setTimeout(() => {
			router.replace(redirectMap[role]);
		}, 1000); // Small delay to let the toast display
	} else {
		errorMsg.value = "Invalid Credentials";
		showToast(errorMsg.value, "error");
	}
}

// Forgot password flow
async function sendResetCode() {
	const result = await request(API.resetPassword, {
		body: { action: "forgot", email: forgotForm.email },
		auth: false,
	});
	if (result.success) {
		activeModal.value = "code";
		showToast("Reset code sent to your email!", "success");
	} else {
		showToast(result.error || "Failed to send reset code.");
	}
}

async function verifyCode() {
	const result = await request(API.verifyResetCode, {
		body: {
			action: "code",
			code: forgotForm.code,
			email: forgotForm.email,
		},
		auth: false,
	});
	if (result.success) {
		activeModal.value = "newpassword";
	} else {
		showToast(result.error || "Invalid code. Please try again.");
	}
}

async function resetPassword() {
	if (forgotForm.newPassword !== forgotForm.confirmPassword) {
		showToast("Passwords do not match!");
		return;
	}

	const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*_\-+=<>?]).{8,}$/;
	if (!passwordRegex.test(forgotForm.newPassword)) {
		showToast("Password must be at least 8 characters long and include numbers and symbols.");
		return;
	}
	const result = await request(API.changePassword, {
		body: {
			action: "password",
			passwordss: forgotForm.newPassword,
			conpassword: forgotForm.confirmPassword,
			email: forgotForm.email,
		},
		auth: false,
	});
	if (result.success) {
		showToast("Password reset successful! Please login.", "success");
		closeModal();
	} else {
		showToast(result.error || "Password reset failed.");
	}
}

function openModal(role) {
	activeModal.value = role;
	hasScrolledToBottom.value = false;
	agreed.value = false;
	activeTab.value = "login";
	errorMsg.value = "";
	Object.assign(studentForm, { id: "", ps: "" });
	Object.assign(teacherForm, { id: "", ps: "" });
	Object.assign(adminForm, { id: "", ps: "" });
	Object.assign(forgotForm, {
		email: "",
		code: "",
		newPassword: "",
		confirmPassword: "",
	});
	showStudentPassword.value = false;
	showTeacherPassword.value = false;
	showAdminPassword.value = false;

	if (role === "terms" || role === "privacy") {
		nextTick(() => {
			const container = document.querySelector(".modal-body-scroll");
			if (container) {
				if (container.scrollHeight <= container.clientHeight) {
					hasScrolledToBottom.value = true;
				}
			}
		});
	}
}

function closeModal() {
	activeModal.value = "";
	errorMsg.value = "";
}

const roles = [
	{
		key: "student",
		title: "Student",
		desc: "Evaluate your teachers and earn points for participating.",
		icon: "school",
		color: "#4f46e5",
	},
	{
		key: "teacher",
		title: "Teacher",
		desc: "Evaluate your peers and view your performance results.",
		icon: "person",
		color: "#059669",
	},
	{
		key: "admin",
		title: "Administrator",
		desc: "Manage evaluations, accounts, and system settings.",
		icon: "admin_panel_settings",
		color: "#dc2626",
	},
];
watch(activeModal, (newVal) => {
	if (newVal) {
		document.body.style.overflow = "hidden";
	} else {
		const activeBackdrops = document.querySelectorAll(".modal-backdrop");
		if (activeBackdrops.length <= 1) {
			document.body.style.overflow = "";
		}
	}
});

onUnmounted(() => {
	const activeBackdrops = document.querySelectorAll(".modal-backdrop");
	if (activeBackdrops.length === 0) {
		document.body.style.overflow = "";
	}
});
</script>

<template>
	<LoadingOverlay v-if="isLoading" />
	<AppToast
		:visible="toast.visible"
		:message="toast.message"
		:type="toast.type"
		@close="toast.visible = false"
	/>

	<div class="login-page">
			<div class="login-header">
				<div class="logos-container">
					<div class="logo-mark">
						<img src="../../assets/DepEd-Logo.png" alt="DepEd Logo" class="logo-img" />
					</div>
					<div class="logo-mark">
						<img src="../../assets/image.png" alt="EduRate Logo" class="logo-img" />
					</div>
					<div class="logo-mark">
						<img src="../../assets/logo.png" alt="Secondary Logo" class="logo-img" />
					</div>
				</div>
				<h1>EduRate</h1>
				<p class="login-sub">Teacher Performance Evaluation System</p>
			</div>

		<div class="role-grid">
			<button
				v-for="role in roles"
				:key="role.key"
				class="role-card"
				@click="openModal(role.key)"
			>
				<div
					class="role-icon"
					:style="{ backgroundColor: role.color + '15', color: role.color }"
				>
					<span class="material-icons">{{ role.icon }}</span>
				</div>
				<div class="role-info">
					<h3>{{ role.title }}</h3>
					<p>{{ role.desc }}</p>
				</div>
				<span class="role-arrow material-icons" :style="{ color: role.color }">arrow_forward</span>
			</button>
		</div>

		<div class="login-footer">
			<a href="#" @click.prevent="openModal('terms')">Terms and Conditions</a>
			<span class="footer-separator">•</span>
			<a href="#" @click.prevent="openModal('privacy')">Privacy Policy</a>
		</div>

		<!-- Modal Backdrop -->
		<Transition name="fade">
			<div v-if="activeModal" class="modal-backdrop" @click.self="handleBackdropClick">
				<Transition name="modal">
					<div class="modal-card" v-if="activeModal">
						<button v-if="activeModal !== 'terms' && activeModal !== 'privacy'" class="modal-close" @click="closeModal">
							<span class="material-icons">close</span>
						</button>

						<template v-if="activeModal === 'student'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#4f46e5">school</span>
								<h2>Student Sign In</h2>
								<p>Enter your student credentials</p>
							</div>
							<form @submit.prevent="handleLogin('student')">
								<div class="form-group">
									<label for="s-id">Email</label>
									<input id="s-id" v-model="studentForm.id" type="email" placeholder="your@email.com" required />
								</div>
								<div class="form-group">
									<label for="s-ps">Password</label>
									<div class="password-wrap">
										<input id="s-ps" v-model="studentForm.ps" :type="showStudentPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required />
										<button type="button" class="password-toggle" @click="showStudentPassword = !showStudentPassword">
											<span class="material-icons">{{ showStudentPassword ? 'visibility_off' : 'visibility' }}</span>
										</button>
									</div>
								</div>
								<div class="form-links">
									<a href="#" @click.prevent="activeModal = 'forgot'">Forgot password?</a>
								</div>
								<button type="submit" class="submit-btn" :disabled="isLoading">Sign In</button>
							</form>
						</template>

						<template v-if="activeModal === 'teacher'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#059669">person</span>
								<h2>Teacher Sign In</h2>
								<p>Enter your teacher credentials</p>
							</div>
							<form @submit.prevent="handleLogin('teacher')">
								<div class="form-group">
									<label for="t-id">Email</label>
									<input id="t-id" v-model="teacherForm.id" type="text" placeholder="your@email.com" required />
								</div>
								<div class="form-group">
									<label for="t-ps">Password</label>
									<div class="password-wrap">
										<input id="t-ps" v-model="teacherForm.ps" :type="showTeacherPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required />
										<button type="button" class="password-toggle" @click="showTeacherPassword = !showTeacherPassword">
											<span class="material-icons">{{ showTeacherPassword ? 'visibility_off' : 'visibility' }}</span>
										</button>
									</div>
								</div>
								<div class="form-links">
									<a href="#" @click.prevent="activeModal = 'forgot'">Forgot password?</a>
								</div>
								<button type="submit" class="submit-btn btn-green" :disabled="isLoading">Sign In</button>
							</form>
						</template>

						<template v-if="activeModal === 'admin'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#dc2626">admin_panel_settings</span>
								<h2>Admin Sign In</h2>
								<p>Enter your administrator credentials</p>
							</div>
							<form @submit.prevent="handleLogin('admin')">
								<div class="form-group">
									<label for="a-id">Admin ID</label>
									<input id="a-id" v-model="adminForm.id" type="text" placeholder="Enter your admin ID" required />
								</div>
								<div class="form-group">
									<label for="a-ps">Password</label>
									<div class="password-wrap">
										<input id="a-ps" v-model="adminForm.ps" :type="showAdminPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required />
										<button type="button" class="password-toggle" @click="showAdminPassword = !showAdminPassword">
											<span class="material-icons">{{ showAdminPassword ? 'visibility_off' : 'visibility' }}</span>
										</button>
									</div>
								</div>
								<div class="form-links">
									<a href="#" @click.prevent="activeModal = 'forgot'">Forgot password?</a>
								</div>
								<button type="submit" class="submit-btn btn-red" :disabled="isLoading">Sign In</button>
							</form>
						</template>

						<template v-if="activeModal === 'forgot'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#64748b">lock_reset</span>
								<h2>Forgot Password</h2>
								<p>Enter your email to receive a reset code</p>
							</div>
							<form @submit.prevent="sendResetCode">
								<div class="form-group">
									<label for="f-email">Email Address</label>
									<input id="f-email" v-model="forgotForm.email" type="email" placeholder="your@email.com" required />
								</div>
								<button type="submit" class="submit-btn" :disabled="isLoading">Send Reset Code</button>
								<p class="form-foot"><a href="#" @click.prevent="activeModal = 'student'">Back to login</a></p>
							</form>
						</template>

						<template v-if="activeModal === 'code'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#6366f1">pin</span>
								<h2>Enter Reset Code</h2>
								<p>Check your email for the verification code</p>
							</div>
							<form @submit.prevent="verifyCode">
								<div class="form-group">
									<label for="f-code">Verification Code</label>
									<input id="f-code" v-model="forgotForm.code" type="text" placeholder="Enter 6-digit code" required />
								</div>
								<button type="submit" class="submit-btn" :disabled="isLoading">Verify Code</button>
							</form>
						</template>

						<template v-if="activeModal === 'newpassword'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#16a34a">vpn_key</span>
								<h2>New Password</h2>
								<p>Create your new password</p>
							</div>
							<form @submit.prevent="resetPassword">
								<div class="form-group">
									<label for="f-new">New Password</label>
									<input id="f-new" v-model="forgotForm.newPassword" type="password" placeholder="Enter new password" required />
								</div>
								<div class="form-group">
									<label for="f-confirm">Confirm Password</label>
									<input id="f-confirm" v-model="forgotForm.confirmPassword" type="password" placeholder="Confirm new password" required />
								</div>
								<button type="submit" class="submit-btn" :disabled="isLoading">Reset Password</button>
							</form>
						</template>

						<template v-if="activeModal === 'terms'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#4f46e5">gavel</span>
								<h2>Terms & Conditions</h2>
								<p>Please scroll down and read our terms of service</p>
							</div>
							<div class="modal-body-scroll text-content" @scroll="handleScroll">
								<h3>1. Acceptance of Terms</h3>
								<p>By accessing or using the EduRate platform, you agree to comply with and be bound by these Terms and Conditions. This system is designed solely for performance evaluation purposes within the educational institution.</p>
								
								<h3>2. User Responsibilities</h3>
								<p>Users must provide honest, constructive, and respectful feedback. Any form of abuse, harassment, or deliberately misleading evaluation submissions is strictly prohibited and may result in disciplinary action.</p>
								
								<h3>3. Anonymity and Integrity</h3>
								<p>To preserve evaluation integrity, student-to-teacher evaluations are anonymous. However, any attempt to bypass system security, inject malicious code, or compromise the platform's stability is a violation of the institution's IT guidelines.</p>
								
								<h3>4. System Modifications</h3>
								<p>The administration reserves the right to modify features, questions, or access levels to optimize the evaluation system at any time.</p>
							</div>
							<label class="agree-checkbox">
								<input type="checkbox" v-model="agreed" />
								<span>I Agree to the Terms & Conditions</span>
							</label>
							<button class="submit-btn" style="margin-top: var(--space-4);" :disabled="!hasScrolledToBottom || !agreed" @click="closeModal">I Agree</button>
						</template>

						<template v-if="activeModal === 'privacy'">
							<div class="modal-header">
								<span class="material-icons modal-icon" style="color:#059669">security</span>
								<h2>Privacy Policy</h2>
								<p>Please scroll down and read our privacy policy</p>
							</div>
							<div class="modal-body-scroll text-content" @scroll="handleScroll">
								<h3>1. Information We Collect</h3>
								<p>We collect essential academic identifiers (such as student/teacher email and names) to assign evaluations. Evaluation scores and comments are securely recorded in our database.</p>
								
								<h3>2. Confidentiality & Anonymity</h3>
								<p>Student feedback is anonymous. Teachers can view aggregated statistics and qualitative comments, but cannot trace submissions back to individual student identifiers. Peer-to-peer evaluations are processed confidentially according to institutional guidelines.</p>
								
								<h3>3. Data Security</h3>
								<p>All transmitted information is secured using SSL/TLS encryption. Access to raw database records is limited strictly to authorized administrators for audit and maintenance purposes.</p>
								
								<h3>4. Cookie Policy</h3>
								<p>This application uses local storage and cookies exclusively to maintain user login sessions and system state. No third-party tracking or advertising analytics are utilized.</p>
							</div>
							<label class="agree-checkbox">
								<input type="checkbox" v-model="agreed" />
								<span>I Agree to the Privacy Policy</span>
							</label>
							<button class="submit-btn btn-green" style="margin-top: var(--space-4);" :disabled="!hasScrolledToBottom || !agreed" @click="closeModal">I Agree</button>
						</template>
					</div>
				</Transition>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.login-page {
	max-width: 1000px;
	width: 100%;
	margin: 0 auto;
	padding: var(--space-8) var(--space-4);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-10);
	position: relative;
	z-index: 1;
}

/* Header */
.login-header {
	text-align: center;
}

.logos-container {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-6);
	margin-bottom: var(--space-4);
}

.logo-mark {
	width: 120px;
	height: 120px;
	background-color: #ffffff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.logo-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transform: scale(1.05); /* Slight scale to ensure no edge gaps, if image has built-in padding */
}

.login-header h1 {
	font-size: 2.25rem;
	font-weight: 800;
	color: #ffffff;
	margin-bottom: var(--space-1);
	text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.login-sub {
	font-size: 1rem;
	color: #e2e8f0;
	text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}

/* Role Grid */
.role-grid {
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	gap: var(--space-4);
	width: 100%;
	max-width: 640px;
}

/* Login Footer Links */
.login-footer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-3);
	margin-top: var(--space-4);
	font-size: 0.8125rem;
}

.login-footer a {
	color: #cbd5e1;
	text-decoration: none;
	font-weight: 500;
	transition: color 0.15s ease;
	text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.login-footer a:hover {
	color: #ffffff;
	text-decoration: underline;
}

.login-footer .footer-separator {
	color: #cbd5e1;
	user-select: none;
	opacity: 0.6;
}

/* Scrollable Modals */
.modal-body-scroll {
	max-height: 280px;
	overflow-y: auto;
	padding-right: var(--space-2);
	margin-bottom: var(--space-2);
	text-align: left;
}

.modal-body-scroll::-webkit-scrollbar {
	width: 6px;
}
.modal-body-scroll::-webkit-scrollbar-track {
	background: #f1f5f9;
	border-radius: var(--radius-sm);
}
.modal-body-scroll::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: var(--radius-sm);
}

.text-content h3 {
	font-size: 0.9375rem;
	font-weight: 700;
	color: #1e293b;
	margin: var(--space-4) 0 var(--space-2);
}

.text-content p {
	font-size: 0.8125rem;
	line-height: 1.5;
	color: #475569;
	margin: 0 0 var(--space-3);
}

.role-card {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	padding: var(--space-5) var(--space-6);
	background: #fff;
	border: 1px solid #e2e8f0;
	border-radius: var(--radius-lg);
	cursor: pointer;
	text-align: left;
	transition: border-color 0.2s, box-shadow 0.2s;
	width: 100%;
	min-width: 0;
}
.role-card:hover {
	border-color: #cbd5e1;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.role-icon {
	width: 56px;
	height: 56px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.role-icon .material-icons {
	font-size: 1.5rem;
}

.role-info {
	flex: 1;
	min-width: 0;
}

.role-info h3 {
	font-size: 1.0625rem;
	font-weight: 700;
	color: #0f172a;
	margin: 0 0 2px;
}

.role-info p {
	font-size: 0.8125rem;
	color: #64748b;
	margin: 0;
	line-height: 1.4;
}

.role-arrow {
	font-size: 1.25rem;
	flex-shrink: 0;
	transition: transform 0.2s;
}
.role-card:hover .role-arrow {
	transform: translateX(4px);
}

/* Modal */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.6);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--space-4);
	overflow-y: auto;
}

.modal-card {
	background: #fff;
	border-radius: var(--radius-xl);
	width: 100%;
	max-width: 420px;
	padding: var(--space-8);
	position: relative;
	max-height: 90vh;
	overflow-y: auto;
}

.modal-close {
	position: absolute;
	top: var(--space-4);
	right: var(--space-4);
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: var(--radius-md);
	color: #64748b;
	cursor: pointer;
	transition: all 0.15s;
}
.modal-close:hover {
	background: #f1f5f9;
	color: #0f172a;
}

.modal-header {
	text-align: center;
	margin-bottom: var(--space-6);
}

.modal-icon {
	font-size: 2.25rem;
	margin-bottom: var(--space-3);
}

.modal-header h2 {
	font-size: 1.375rem;
	font-weight: 700;
	color: #0f172a;
	margin-bottom: var(--space-1);
}

.modal-header p {
	font-size: 0.875rem;
	color: #64748b;
}

/* Forms */
.form-group {
	margin-bottom: var(--space-4);
}

.form-group label {
	display: block;
	font-size: 0.8125rem;
	font-weight: 600;
	color: #475569;
	margin-bottom: var(--space-1);
}

.form-group input {
	width: 100%;
	padding: 0.5625rem 0.875rem;
	border: 1px solid #cbd5e1;
	border-radius: var(--radius-md);
	font-size: 0.875rem;
	color: #0f172a;
	outline: none;
	transition: border-color 0.15s;
	box-sizing: border-box;
}
.form-group input:focus {
	border-color: #6366f1;
}

.form-error {
	padding: var(--space-2) var(--space-3);
	background: #fef2f2;
	border: 1px solid #fecaca;
	color: #dc2626;
	border-radius: var(--radius-md);
	font-size: 0.8125rem;
	margin-bottom: var(--space-4);
}

.password-wrap {
	position: relative;
}

.password-wrap input {
	padding-right: 2.75rem;
}

.password-toggle {
	position: absolute;
	right: 0.375rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	padding: 0.25rem;
	cursor: pointer;
	color: #94a3b8;
	display: flex;
	border-radius: var(--radius-md);
	transition: color 0.15s, background 0.15s;
}
.password-toggle:hover {
	color: #475569;
	background: #f1f5f9;
}
.password-toggle .material-icons {
	font-size: 1.25rem;
}

.form-links {
	display: flex;
	justify-content: flex-end;
	margin-bottom: var(--space-5);
}

.form-links a {
	font-size: 0.8125rem;
	font-weight: 500;
	color: #6366f1;
	text-decoration: none;
}
.form-links a:hover {
	text-decoration: underline;
}

.submit-btn {
	width: 100%;
	padding: 0.625rem 1rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #fff;
	background: #4f46e5;
	border: none;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: background-color 0.15s;
}
.submit-btn:hover:not(:disabled) {
	background: #4338ca;
}
.submit-btn:disabled {
	background: #cbd5e1 !important;
	color: #94a3b8 !important;
	border-color: #cbd5e1 !important;
	opacity: 0.8;
	cursor: not-allowed;
}

.agree-checkbox {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: var(--space-4);
	padding: 0.5rem;
	cursor: pointer;
	font-size: 0.875rem;
	color: var(--text-color, #333);
	user-select: none;
}
.agree-checkbox input[type="checkbox"] {
	width: 1rem;
	height: 1rem;
	cursor: pointer;
	accent-color: #4f46e5;
}

.btn-green {
	background: #059669;
}
.btn-green:hover:not(:disabled) {
	background: #047857;
}

.btn-red {
	background: #dc2626;
}
.btn-red:hover:not(:disabled) {
	background: #b91c1c;
}

.form-foot {
	text-align: center;
	font-size: 0.8125rem;
	color: #64748b;
	margin-top: var(--space-5);
}

.form-foot a {
	color: #6366f1;
	font-weight: 500;
	text-decoration: none;
}
.form-foot a:hover {
	text-decoration: underline;
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
	animation: slideUp 0.25s ease;
}
.modal-leave-active {
	animation: slideUp 0.2s ease reverse;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(16px) scale(0.97);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

/* Responsive */
@media (max-width: 640px) {
	.login-page {
		padding: var(--space-6) var(--space-4);
		gap: var(--space-6);
	}

	.logos-container {
		gap: var(--space-4);
	}

	.logo-mark {
		width: 80px;
		height: 80px;
	}

	.login-header h1 {
		font-size: 1.85rem;
	}

	.role-card {
		padding: var(--space-4) var(--space-5);
		gap: var(--space-4);
	}

	.modal-card {
		padding: var(--space-6);
	}
}

@media (max-width: 425px) {
	.login-page {
		padding: var(--space-6) var(--space-3);
		gap: var(--space-5);
	}

	.logos-container {
		gap: var(--space-3);
	}

	.logo-mark {
		width: 80px;
		height: 80px;
	}

	.login-header h1 {
		font-size: 1.65rem;
	}

	.role-card {
		padding: var(--space-4);
		gap: var(--space-3);
	}

	.role-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
	}

	.role-icon .material-icons {
		font-size: 1.25rem;
	}

	.role-info h3 {
		font-size: 0.95rem;
		margin-bottom: 1px;
	}
}
</style>
