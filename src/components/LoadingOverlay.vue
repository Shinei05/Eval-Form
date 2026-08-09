<script setup>
defineProps({
	message: { type: String, default: "Loading..." },
});
</script>

<template>
	<Teleport to="body">
	<div class="loading-overlay">
		<div class="loading-content">
			<div class="spinner"></div>
			<p>{{ message }}</p>
		</div>
	</div>
	</Teleport>
</template>

<style scoped>
.loading-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	animation: fadeIn 0.2s ease;
}

.loading-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
}

.spinner {
	width: 48px;
	height: 48px;
	border: 4px solid rgba(255, 255, 255, 0.2);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-content p {
	color: #fff;
	font-size: 1rem;
	font-weight: 500;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
