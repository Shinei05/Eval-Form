import { ref } from "vue";

// Global reactive state — shared across all components
const toast = ref({
    visible: false,
    message: "",
    type: "info",
});

/**
 * Global toast composable.
 * The toast is rendered in App.vue so it persists across route changes.
 */
export function useToast() {
    function showToast(message, type = "info") {
        toast.value = { visible: true, message, type };
    }

    function hideToast() {
        toast.value = { ...toast.value, visible: false };
    }

    return { toast, showToast, hideToast };
}
