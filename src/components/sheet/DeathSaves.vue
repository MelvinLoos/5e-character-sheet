<script setup lang="ts">
import { ref } from 'vue'

const successes = ref([false, false, false])
const failures = ref([false, false, false])

function toggleSuccess(index: number) {
  successes.value[index] = !successes.value[index]
}

function toggleFailure(index: number) {
  failures.value[index] = !failures.value[index]
}
</script>

<template>
  <div
    class="bg-surface-container-highest rounded-lg p-4 border border-outline-variant flex flex-col gap-4"
  >
    <h4
      class="font-label-md text-label-md text-tertiary uppercase tracking-widest border-b border-outline-variant pb-2"
    >
      Death Saves
    </h4>
    <div class="flex flex-col gap-3">
      <!-- Successes -->
      <div class="flex items-center justify-between">
        <span class="font-label-md text-label-md text-on-surface-variant uppercase">Successes</span>
        <div class="flex gap-2">
          <button
            v-for="i in 3"
            :key="'s' + i"
            @click="toggleSuccess(i - 1)"
            class="w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center"
            :class="
              successes[i - 1]
                ? 'border-tertiary bg-tertiary/20'
                : 'border-tertiary/30 hover:border-tertiary'
            "
          >
            <span
              class="material-symbols-outlined text-[16px] text-tertiary transition-opacity"
              :class="successes[i - 1] ? 'opacity-100' : 'opacity-0 hover:opacity-50'"
              >check</span
            >
          </button>
        </div>
      </div>
      <!-- Failures -->
      <div class="flex items-center justify-between">
        <span class="font-label-md text-label-md text-on-surface-variant uppercase">Failures</span>
        <div class="flex gap-2">
          <button
            v-for="i in 3"
            :key="'f' + i"
            @click="toggleFailure(i - 1)"
            class="w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center"
            :class="
              failures[i - 1] ? 'border-error bg-error/20' : 'border-error/30 hover:border-error'
            "
          >
            <span
              class="material-symbols-outlined text-[16px] text-error transition-opacity"
              :class="failures[i - 1] ? 'opacity-100' : 'opacity-0 hover:opacity-50'"
              >close</span
            >
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
