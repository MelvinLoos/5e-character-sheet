<script setup lang="ts">
/** Five-second undo window after a rest. Mounted once in App.vue. */
import { onBeforeUnmount, watch } from 'vue'
import { useCharacterStore } from '@/stores/character'
import PressableButton from '@/components/ui/PressableButton.vue'

const UNDO_MS = 5000
const store = useCharacterStore()
let timer: ReturnType<typeof setTimeout> | null = null

function stop(): void {
  if (timer) clearTimeout(timer)
  timer = null
}

watch(
  () => store.restUndoSnapshot,
  (snapshot) => {
    stop()
    if (snapshot) timer = setTimeout(() => store.clearRestUndo(), UNDO_MS)
  },
)

onBeforeUnmount(stop)
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="store.restUndoSnapshot"
      role="status"
      data-testid="undo-toast"
      class="fixed left-1/2 z-toast flex -translate-x-1/2 items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-high px-5 py-3 text-on-surface shadow-elevation-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 max-w-[calc(100vw-2rem)] print:hidden"
    >
      <span>{{ store.lastRestKind === 'long' ? 'Long' : 'Short' }} rest taken</span>
      <PressableButton variant="ghost" size="sm" data-testid="undo-rest" @click="store.undoRest()">
        Undo
      </PressableButton>
    </div>
  </Transition>
</template>
