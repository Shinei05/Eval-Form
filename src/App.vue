<script setup>
import AppToast from "./components/AppToast.vue";
import { useToast } from "./composables/useToast";

const { toast, hideToast } = useToast();
</script>

<template>
  <AppToast
    :visible="toast.visible"
    :message="toast.message"
    :type="toast.type"
    @close="hideToast"
  />
  <router-view />
</template>

<style scoped></style>
