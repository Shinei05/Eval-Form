<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goHome() {
	router.push("/");
}
</script>

<template>
	<div class="not-found">
		<div class="content">
			<h1 class="code">404</h1>
			<p class="message">Page not found</p>
			<p class="hint">
				The page you're looking for doesn't exist or has been moved.
			</p>
			<button class="btn-home" @click="goHome">Go to Home</button>
		</div>
	</div>
</template>

<style scoped>
.not-found {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-bg-page, #f9fafb);
	padding: 2rem;
}

.content {
	text-align: center;
	max-width: 400px;
}

.code {
	font-size: 6rem;
	font-weight: 800;
	color: var(--color-primary, #4f46e5);
	line-height: 1;
	margin-bottom: 0.5rem;
}

.message {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--color-text, #111827);
	margin-bottom: 0.5rem;
}

.hint {
	font-size: 0.95rem;
	color: var(--color-text-secondary, #6b7280);
	margin-bottom: 2rem;
}

.btn-home {
	display: inline-block;
	padding: 0.65rem 1.5rem;
	background: var(--color-primary, #4f46e5);
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;
}
.btn-home:hover {
	background: var(--color-primary-dark, #4338ca);
}
</style>
