<script setup>
import { useRouter } from "vue-router";
import { CalendarOff, ArrowLeft } from "@lucide/vue";

const router = useRouter();

function goBack() {
    router.replace("/login");
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8 bg-[url('/assets/background.png')] bg-cover bg-center">
        <div class="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-2xl">
			<div class="h-2 w-full bg-rose-500"></div>
            <div class="px-6 py-10 sm:px-10 text-center">
                <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100/50 shadow-inner">
                    <CalendarOff class="h-10 w-10 text-rose-600" />
                </div>
                
                <h2 class="mb-3 text-2xl font-extrabold tracking-tight text-slate-900">
                    Evaluations are Closed
                </h2>
                
                <p class="mb-8 text-sm leading-relaxed text-slate-500">
                    The administration has not opened the evaluation period yet, or the scheduled time has already ended.
                </p>
                
                <button 
                    class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md" 
                    @click="goBack"
                >
                    <ArrowLeft class="h-4 w-4" />
                    Return to Login
                </button>
            </div>
        </div>
    </div>
</template>
