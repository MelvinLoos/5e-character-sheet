<script setup lang="ts">
import { ref, computed } from 'vue';
import feather from 'feather-icons';
import BaseModal from '@/components/ui/BaseModal.vue';
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
</script>

<template>
  <div class="inline-flex items-center align-middle ml-2">
    <!-- Trigger: small glyph with an enlarged invisible hit area -->
    <button
      type="button"
      @click.stop="isOpen = true"
      class="relative rounded-full text-on-surface-variant transition-all duration-200 ease-out select-none hover:text-tertiary hover:scale-110 active:scale-95 after:absolute after:-inset-3 after:content-['']"
      :aria-label="rule?.title ? `More information: ${rule.title}` : 'More information'"
      aria-haspopup="dialog"
      v-html="helpIcon"
    ></button>

    <BaseModal :open="isOpen" :title="rule?.title" size="sm" @close="isOpen = false">
      <div class="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
        {{ rule?.content }}
      </div>
    </BaseModal>
  </div>
</template>
