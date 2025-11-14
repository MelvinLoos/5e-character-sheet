<script setup lang="ts">
import feather from 'feather-icons'

type ActionType = 'Action' | 'Bonus Action' | 'Reaction' | 'Free Action' | 'Passive' | 'None'
type SizeType = 'sm' | 'md' | 'lg'

const props = defineProps({
  actionType: {
    type: String as () => ActionType,
    required: true,
    validator: (value: string): value is ActionType =>
      ['Action', 'Bonus Action', 'Reaction', 'Free Action', 'Passive', 'None'].includes(
        value as ActionType,
      ),
  },
  size: {
    type: String as () => SizeType,
    default: 'md' as SizeType,
    validator: (value: string): value is SizeType => ['sm', 'md', 'lg'].includes(value as SizeType),
  },
})

// Icon mapping based on action type
const iconConfig: Record<
  ActionType,
  {
    icon: string | null
    color: string
    bgColor: string
    label: string
  }
> = {
  Action: {
    icon: 'star',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Action',
  },
  'Bonus Action': {
    icon: 'zap',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Bonus Action',
  },
  Reaction: {
    icon: 'refresh-ccw',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Reaction',
  },
  'Free Action': {
    icon: 'feather',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Free Action',
  },
  Passive: {
    icon: 'circle',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Passive',
  },
  None: {
    icon: null,
    color: '',
    bgColor: '',
    label: '',
  },
}

// Size configurations
const sizeConfig: Record<
  SizeType,
  {
    iconSize: number
    padding: string
    text: string
  }
> = {
  sm: {
    iconSize: 16,
    padding: 'p-1.5',
    text: 'text-xs',
  },
  md: {
    iconSize: 20,
    padding: 'p-2',
    text: 'text-sm',
  },
  lg: {
    iconSize: 24,
    padding: 'p-2.5',
    text: 'text-base',
  },
}

// Get configuration for current action type
const config = iconConfig[props.actionType] || iconConfig['None']
const sizes = sizeConfig[props.size]

// Don't render anything for 'None' action type
const shouldRender = props.actionType !== 'None' && config.icon
</script>

<template>
  <div
    v-if="shouldRender"
    :class="[
      'inline-flex items-center rounded-full',
      config.bgColor,
      config.color,
      sizes.padding,
      sizes.text,
    ]"
    :title="config.label"
    role="img"
    :aria-label="`Action type: ${config.label}`"
  >
    <span
      v-html="
        config.icon
          ? (feather.icons as any)?.[config.icon]?.toSvg({
              width: sizes.iconSize,
              height: sizes.iconSize,
            })
          : ''
      "
      class="flex items-center"
    ></span>
  </div>
</template>

<style scoped>
/* Ensure icons are properly aligned and accessible */
div[role='img'] {
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

div[role='img']:hover {
  transform: scale(1.05);
}

/* Focus styles for keyboard accessibility */
div[role='img']:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  div[role='img'] {
    background-color: transparent !important;
    color: #000 !important;
  }
}
</style>
