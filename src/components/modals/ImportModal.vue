<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRulesStore } from '@/stores/rulesStore'
import { capturePostHogEvent } from '@/utils/posthog'
import { mapSpells, mapFeats, type AppSpell } from '@/utils/fiveToolsAdapter'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

interface AppFeature {
  title: string
  desc: string
  source?: string
  featureType?: string
  actionType?: string
  grantsSpells?: boolean
}

const rulesStore = useRulesStore()

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const selectedFile = ref<File | null>(null)
const selectedCategory = ref<'spells' | 'feats'>('spells')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const status = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
const statusMessage = ref('')
const previewData = ref<{ count: number; items: string[] } | null>(null)
const confirmRequired = ref(true)

const categoryOptions = [
  { value: 'spells', label: 'Spells' },
  { value: 'feats', label: 'Feats' },
]

const canProcess = computed(() => {
  return selectedFile.value !== null && status.value === 'idle'
})

const canConfirm = computed(() => {
  return previewData.value !== null && confirmRequired.value
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.name.endsWith('.json')) {
      selectedFile.value = file
    } else {
      status.value = 'error'
      statusMessage.value = 'Please drop a .json file'
      setTimeout(() => {
        status.value = 'idle'
      }, 3000)
    }
  }
}

function clearFile() {
  selectedFile.value = null
  previewData.value = null
  status.value = 'idle'
  statusMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function processFile() {
  if (!selectedFile.value) return

  status.value = 'processing'
  statusMessage.value = 'Processing file...'

  try {
    const text = await selectedFile.value.text()
    const data = JSON.parse(text)

    if (selectedCategory.value === 'spells') {
      // Support both array format and object with 'spell' array
      const spellArray = Array.isArray(data) ? data : data.spell || []
      const mappedSpells = mapSpells(spellArray)

      if (mappedSpells.length === 0) {
        throw new Error('No valid spells found in file')
      }

      previewData.value = {
        count: mappedSpells.length,
        items: mappedSpells.slice(0, 5).map((s: AppSpell) => s.name),
      }

      if (!confirmRequired.value) {
        importData(mappedSpells)
      }
    } else if (selectedCategory.value === 'feats') {
      // Support both array format and object with 'feat' array
      const featArray = Array.isArray(data) ? data : data.feat || []
      const mappedFeats = mapFeats(featArray)

      if (mappedFeats.length === 0) {
        throw new Error('No valid feats found in file')
      }

      previewData.value = {
        count: mappedFeats.length,
        items: mappedFeats.slice(0, 5).map((f: AppFeature) => f.title),
      }

      if (!confirmRequired.value) {
        importData(mappedFeats)
      }
    }

    if (confirmRequired.value) {
      status.value = 'idle'
      statusMessage.value = ''
    }
  } catch (error) {
    status.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to process file. Please check the format.'
    previewData.value = null
  }
}

function importData(data: unknown[]) {
  try {
    rulesStore.importData(selectedCategory.value, data)
    status.value = 'success'
    statusMessage.value = `Successfully imported ${data.length} ${selectedCategory.value}!`
    capturePostHogEvent('rules_data_imported', {
      category: selectedCategory.value,
      item_count: data.length,
    })

    setTimeout(() => {
      close()
    }, 2000)
  } catch (error) {
    status.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Failed to import data'
  }
}

function confirmImport() {
  if (!previewData.value) return

  status.value = 'processing'
  statusMessage.value = 'Importing...'

  // Re-process the file to get the full mapped data
  processFile().then(() => {
    // The processFile will trigger importData if confirmRequired is false
    // So we need to handle the import here
    selectedFile.value?.text().then((text) => {
      const data = JSON.parse(text)
      if (selectedCategory.value === 'spells') {
        const spellArray = Array.isArray(data) ? data : data.spell || []
        const mappedSpells = mapSpells(spellArray)
        importData(mappedSpells)
      } else {
        const featArray = Array.isArray(data) ? data : data.feat || []
        const mappedFeats = mapFeats(featArray)
        importData(mappedFeats)
      }
    })
  })
}

function close() {
  clearFile()
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="show"
    title="Import 5e.tools Data"
    size="lg"
    :close-on-escape="status !== 'processing'"
    :close-on-backdrop="status !== 'processing'"
    @close="close"
  >
    <div class="space-y-4">
      <!-- Category Selection -->
      <div class="flex flex-col gap-1">
        <label for="import-category" class="font-label-md text-label-md text-on-surface-variant">
          Import Category
        </label>
        <select
          id="import-category"
          v-model="selectedCategory"
          class="min-h-11 w-full rounded border border-outline-variant bg-surface-container-high px-3 text-on-surface focus:border-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
          :disabled="status === 'processing'"
        >
          <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- File Upload Area -->
      <div
        :class="[
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-tertiary bg-tertiary/10' : 'border-outline-variant bg-surface-variant/40',
          status === 'processing' ? 'pointer-events-none opacity-50' : '',
        ]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div v-if="!selectedFile" class="space-y-3">
          <span class="material-symbols-outlined text-4xl text-tertiary" aria-hidden="true">upload_file</span>
          <p class="text-on-surface-variant">Drag &amp; drop a .json file here, or choose one to browse</p>
          <input
            ref="fileInputRef"
            id="import-file-input"
            type="file"
            accept=".json"
            class="peer sr-only"
            @change="handleFileSelect"
          />
          <label
            for="import-file-input"
            class="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-tertiary px-4 py-2 font-label-md text-on-tertiary transition-transform active:scale-95 peer-focus-visible:ring-2 peer-focus-visible:ring-tertiary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-container"
          >
            Choose File
          </label>
        </div>

        <div v-else class="space-y-3">
          <span class="material-symbols-outlined text-4xl text-tertiary" aria-hidden="true">description</span>
          <p class="font-medium">{{ selectedFile.name }}</p>
          <p class="text-sm text-on-surface-variant">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
          <PressableButton
            variant="ghost"
            size="sm"
            class="text-error"
            :disabled="status === 'processing'"
            @click="clearFile"
          >
            Remove File
          </PressableButton>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="previewData" class="rounded border border-primary/40 bg-primary/10 p-4">
        <h3 class="mb-2 font-bold">Preview</h3>
        <p class="mb-2">Found {{ previewData.count }} {{ selectedCategory }}</p>
        <p class="mb-2 text-sm text-on-surface-variant">
          First {{ Math.min(5, previewData.count) }} items:
        </p>
        <ul class="list-inside list-disc text-sm">
          <li v-for="item in previewData.items" :key="item">{{ item }}</li>
        </ul>
        <p v-if="previewData.count > 5" class="mt-2 text-xs text-on-surface-variant">
          ...and {{ previewData.count - 5 }} more
        </p>
      </div>

      <!-- Status Messages -->
      <StatusBanner
        v-if="statusMessage"
        :tone="status === 'error' ? 'error' : 'info'"
        :icon="status === 'success' ? 'check_circle' : status === 'processing' ? 'progress_activity' : undefined"
      >
        {{ statusMessage }}
      </StatusBanner>

      <!-- Warning -->
      <StatusBanner tone="warning">
        Importing will replace existing {{ selectedCategory }} data.
      </StatusBanner>
    </div>

    <template #footer>
      <PressableButton variant="ghost" :disabled="status === 'processing'" @click="close">
        Cancel
      </PressableButton>
      <PressableButton v-if="!previewData" variant="primary" :disabled="!canProcess" @click="processFile">
        Process File
      </PressableButton>
      <PressableButton v-if="canConfirm" variant="primary" @click="confirmImport">
        Confirm Import
      </PressableButton>
    </template>
  </BaseModal>
</template>
