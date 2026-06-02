<script setup>
</script>

<template>
	<div class="auth-layout">
		<!-- Dynamic background orbs -->
		<div class="orb orb-1"></div>
		<div class="orb orb-2"></div>
		<div class="orb orb-3"></div>
		
		<div class="auth-content">
			<router-view />
		</div>
	</div>
</template>

<style scoped>
.auth-layout {
	min-height: 100vh;
	min-height: 100dvh;
	background: #0f172a; /* Slate 900 base */
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
}

.auth-layout::before {
	content: '';
	position: absolute;
	inset: 0;
	background-image: url('../assets/background.png');
	background-size: cover;
	background-position: center;
	opacity: 0.15;
	z-index: 0;
	pointer-events: none;
}

/* Glassmorphism Background Orbs */
.orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(100px);
	opacity: 0.6;
	animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 0;
}

.orb-1 {
	width: 500px;
	height: 500px;
	background: #6366f1; /* Indigo */
	top: -100px;
	left: -100px;
	animation-delay: 0s;
}

.orb-2 {
	width: 400px;
	height: 400px;
	background: #ec4899; /* Pink */
	bottom: -50px;
	right: -100px;
	animation-delay: -5s;
}

.orb-3 {
	width: 300px;
	height: 300px;
	background: #8b5cf6; /* Violet */
	top: 40%;
	left: 40%;
	animation-delay: -10s;
}

@keyframes float {
	0% {
		transform: translate(0, 0) scale(1);
	}
	50% {
		transform: translate(50px, 30px) scale(1.1);
	}
	100% {
		transform: translate(-30px, -50px) scale(0.9);
	}
}

.auth-content {
	position: relative;
	z-index: 10;
	width: 100%;
	display: flex;
	justify-content: center;
}

@media (max-width: 640px) {
	.auth-layout {
		align-items: flex-start;
		justify-content: center;
	}
	.orb-1 {
		width: 300px;
		height: 300px;
		filter: blur(70px);
	}
	.orb-2 {
		width: 250px;
		height: 250px;
		filter: blur(70px);
	}
}
</style>
