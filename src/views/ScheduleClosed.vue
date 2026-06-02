<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

function goBack() {
    router.replace("/login");
}
</script>

<template>
    <div class="closed-page">
        <div class="closed-card">
            <span class="material-icons-outlined closed-icon">event_busy</span>
            <h2>Evaluations are currently closed</h2>
            <p>The administration has not opened the evaluation period yet, or the scheduled time has already ended.</p>
            <button class="btn-back" @click="goBack">Return to Login</button>
        </div>
    </div>
</template>

<style scoped>
.closed-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    padding: var(--space-4);
}

.closed-card {
    background: #fff;
    max-width: 480px;
    width: 100%;
    padding: var(--space-8);
    border-radius: var(--radius-xl);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    text-align: center;
    border-top: 5px solid #dc2626;
}

.closed-icon {
    font-size: 4rem;
    color: #ef4444;
    margin-bottom: var(--space-4);
    background: #fef2f2;
    padding: var(--space-4);
    border-radius: 50%;
}

.closed-card h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: var(--space-3);
}

.closed-card p {
    color: #64748b;
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: var(--space-6);
}

.btn-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background: #4f46e5;
    color: #fff;
    font-weight: 600;
    font-size: 0.875rem;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.2s;
}

.btn-back:hover {
    background: #4338ca;
}
</style>
