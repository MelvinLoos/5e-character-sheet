/**
 * useModals — Shared modal UI state composable.
 *
 * Extracted from the character store to reduce its interface width.
 * Uses module-level singletons so all callers share the same reactive state.
 */
import { ref } from 'vue'

// Module-level singletons — shared across all consumers
const isLoading = ref(false)
const loadingText = ref('')
const errorModal = ref<{ show: boolean; errors: string[] }>({
  show: false,
  errors: [],
})
const shareModal = ref<{ show: boolean; url: string }>({
  show: false,
  url: '',
})

export function useModals() {
  function showLoading(text: string): void {
    isLoading.value = true
    loadingText.value = text
  }

  function hideLoading(): void {
    isLoading.value = false
  }

  function showErrorModal(errors: string[]): void {
    errorModal.value.errors = errors
    errorModal.value.show = true
  }

  function clearErrorModal(): void {
    errorModal.value.show = false
    errorModal.value.errors = []
  }

  function clearShareModal(): void {
    shareModal.value.show = false
    shareModal.value.url = ''
  }

  function setShareUrl(url: string): void {
    shareModal.value.url = url
    shareModal.value.show = true
  }

  return {
    isLoading,
    loadingText,
    errorModal,
    shareModal,
    showLoading,
    hideLoading,
    showErrorModal,
    clearErrorModal,
    clearShareModal,
    setShareUrl,
  }
}