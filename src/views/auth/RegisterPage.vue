<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "../../composables/useApi";
import { useToast } from "../../composables/useToast";
import LoadingOverlay from "../../components/LoadingOverlay.vue";
import API from "../../utils/api";

const router = useRouter();
const { request, isLoading } = useApi();
const { showToast } = useToast();
const form = reactive({
	firstname: "",
	middlename: "",
	lastname: "",
	email: "",
	student_id: "",
	password: "",
	confirmPassword: "",
});

async function handleRegister() {
	if (form.password !== form.confirmPassword) {
		toast.message = "Passwords do not match!";
		toast.type = "error";
		toast.visible = true;
		return;
	}

	const result = await request(API.register, {
		body: {
			action: "register",
			firstname: form.firstname,
			middlename: form.middlename,
			lastname: form.lastname,
			email: form.email,
			student_id: form.student_id,
			password: form.password,
			confirmPassword: form.confirmPassword,
		},
		auth: false,
	});

	if (result.success) {
		showToast("Registration successful! You can now login.", "success");
		setTimeout(() => router.push("/"), 2000);
	} else {
		showToast(
			result.error || "Registration failed. Please try again.",
			"error",
		);
	}
}
</script>

<template>
	<LoadingOverlay v-if="isLoading" />

	<div class="w-full h-full flex items-center justify-center">
		<div class="register-card card hover-lift">
			<div class="register-header">
				<router-link to="/" class="back-link">
					<span class="material-icons">arrow_back</span>
					Back to login
				</router-link>
				<h1>Create Account</h1>
				<p>Register as a new student</p>
			</div>

			<form @submit.prevent="handleRegister">
				<div class="form-row">
					<div class="form-group">
						<label for="firstname">First Name</label>
						<input
							id="firstname"
							v-model="form.firstname"
							type="text"
							placeholder="Juan"
							required
						/>
					</div>
					<div class="form-group">
						<label for="middlename">Middle Name</label>
						<input
							id="middlename"
							v-model="form.middlename"
							type="text"
							placeholder="Santos"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="lastname">Last Name</label>
						<input
							id="lastname"
							v-model="form.lastname"
							type="text"
							placeholder="Dela Cruz"
							required
						/>
					</div>
					<div class="form-group">
						<label for="student_id">Student ID</label>
						<input
							id="student_id"
							v-model="form.student_id"
							type="text"
							placeholder="2024-00001"
							required
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="email">Email Address</label>
					<input
						id="email"
						v-model="form.email"
						type="email"
						placeholder="juan@email.com"
						required
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="password">Password</label>
						<input
							id="password"
							v-model="form.password"
							type="password"
							placeholder="Min 8 characters"
							required
						/>
					</div>
					<div class="form-group">
						<label for="confirmPassword">Confirm Password</label>
						<input
							id="confirmPassword"
							v-model="form.confirmPassword"
							type="password"
							placeholder="Re-enter password"
							required
						/>
					</div>
				</div>

				<button
					type="submit"
					class="btn btn-primary btn-block btn-lg"
					:disabled="isLoading"
				>
					Create Account
				</button>

				<p class="footer-text">
					Already have an account?
					<router-link to="/">Sign in</router-link>
				</p>
			</form>
		</div>
	</div>
</template>

<style scoped>
.register-card {
	width: 100%;
	max-width: 600px;
	padding: var(--space-8);
}

@media (max-width: 480px) {
	.register-card {
		padding: 1.25rem 1rem;
	}
}

.register-header {
	margin-bottom: var(--space-6);
}

.back-link {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text-muted);
	margin-bottom: var(--space-4);
}

.back-link:hover {
	color: var(--color-primary);
}

.back-link .material-icons {
	font-size: 1.125rem;
}

.register-header h1 {
	margin-bottom: var(--space-2);
}

.register-header p {
	color: var(--color-text-muted);
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.form-group {
	margin-bottom: var(--space-5);
}

.footer-text {
	text-align: center;
	font-size: 0.875rem;
	color: var(--color-text-muted);
	margin-top: var(--space-5);
}

@media (max-width: 640px) {
	.register-card {
		padding: var(--space-6);
	}
	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
