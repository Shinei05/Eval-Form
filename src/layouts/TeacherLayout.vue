<template>
  <div class="min-h-screen w-full bg-canvas font-sans flex flex-col">
    <!-- Modern Sticky Header -->
    <TopBar :title="pageTitle" />

    <!-- Main Content Container -->
    <main class="flex-1 w-full mx-auto max-w-6xl px-3 py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- App Toast -->
    <AppToast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="toast.visible = false"
    />
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '../components/common/TopBar.vue'
import AppToast from '../components/AppToast.vue'

const route = useRoute()
const toast = reactive({ visible: false, message: '', type: 'success' })

const pageTitle = computed(() => {
  if (route.name === 'TeacherSettings') return 'Profile Settings'
  return route.meta?.title || 'Teacher Dashboard'
})
</script>
