<script setup lang="ts">
import { ref, computed } from 'vue';
import feather from 'feather-icons';
import { RULE_GLOSSARY, type GlossaryTopic } from '@/domain/rule-glossary';

const props = defineProps<{
  /** Predefined glossary topic — mutually exclusive with title+content */
  topic?: GlossaryTopic;
  /** Custom title — used when topic is not provided */
  title?: string;
  /** Custom content — used when topic is not provided */
  content?: string;
}>();

const isOpen = ref(false);

const rule = computed(() => {
  if (props.topic) {
    return RULE_GLOSSARY[props.topic] ?? null;
  }
  if (props.title || props.content) {
    return { title: props.title ?? '', content: props.content ?? '' };
  }
  return null;
});

const helpIcon = computed(() =>
  feather.icons['help-circle']?.toSvg({ width: 16, height: 16 }),
);
const closeIcon = computed(() =>
  feather.icons['x']?.toSvg({ width: 20, height: 20 }),
);
</script>

<template>
  <div class="inline-flex items-center align-middle ml-2">
    <!-- Trigger Button -->
    <button
      type="button"
      @click.stop="isOpen = true"
      class="text-gray-400 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full select-none"
      aria-label="More information"
      v-html="helpIcon"
    ></button>

    <!-- Teleported Modal -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="isOpen = false"
          aria-hidden="true"
        ></div>
        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 ring-1 ring-black/5 overflow-hidden"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ rule?.title }}
            </h3>
            <button
              @click="isOpen = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:scale-110 active:scale-95 transition-all duration-200 ease-out rounded-full p-1 select-none"
              v-html="closeIcon"
              aria-label="Close explanation"
            ></button>
          </div>
          <div
            class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line"
          >
            {{ rule?.content }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>