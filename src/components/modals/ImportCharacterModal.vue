<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useCharacterStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const status = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
const statusMessage = ref('')
const importErrors = ref<string[]>([])

interface PreviewInfo {
  name: string
  className: string
  species: string
  background: string
  renownTier: number | null
  featureCount: number
  spellCount: number
}

const preview = ref<PreviewInfo | null>(null)

const canConfirm = computed(() => preview.value !== null && status.value === 'idle')

function reset() {
  selectedFile.value = null
  preview.value = null
  status.value = 'idle'
  statusMessage.value = ''
  importErrors.value = []
  isDragging.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function close() {
  reset()
  emit('close')
}

function isJsonFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.json')
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) acceptFile(file)
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
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  acceptFile(file)
}

function acceptFile(file: File) {
  reset()
  if (!isJsonFile(file)) {
    status.value = 'error'
    statusMessage.value = 'Please select a .json file exported from this app.'
    return
  }
  selectedFile.value = file
  void loadPreview(file)
}

/** Parse the file into a lightweight preview without mutating the store. */
async function loadPreview(file: File) {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as Record<string, unknown>

    if (!data || typeof data !== 'object' || typeof data.name !== 'string') {
      throw new Error('This file does not look like a character (missing "name").')
    }

    preview.value = {
      name: data.name,
      className: typeof data.class === 'string' ? data.class : '—',
      species: typeof data.species === 'string' ? data.species : '—',
      background: typeof data.background === 'string' ? data.background : '—',
      renownTier: typeof data.renownTier === 'number' ? data.renownTier : null,
      featureCount: Array.isArray(data.features) ? data.features.length : 0,
      spellCount: Array.isArray(data.spells) ? data.spells.length : 0,
    }
  } catch (error) {
    status.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Could not read the selected file.'
    preview.value = null
  }
}

async function confirmImport() {
  if (!selectedFile.value) return
  status.value = 'processing'
  statusMessage.value = 'Importing character…'
  importErrors.value = []

  try {
    const text = await selectedFile.value.text()
    const result = store.importCharacter(text)

    if (!result.valid) {
      status.value = 'error'
      statusMessage.value = 'The character could not be imported.'
      importErrors.value = result.errors
      return
    }

    status.value = 'success'
    statusMessage.value = `Imported "${preview.value?.name ?? 'character'}" successfully.`
    setTimeout(() => close(), 1500)
  } catch (error) {
    status.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Import failed.'
  }
}
</script>

<template>
  <BaseModal
    :open="show"
    title="Import Character"
    size="lg"
    :close-on-escape="status !== 'processing'"
    :close-on-backdrop="status !== 'processing'"
    @close="close"
  >
    <div class="space-y-4">
      <p class="text-sm text-on-surface-variant">
        Upload a character JSON file that was previously exported from this app. Importing
        replaces the currently open character and saves it to your library.
      </p>

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
          <p class="text-on-surface-variant">Drag &amp; drop a character .json file here, or choose one to browse</p>
          <input
            ref="fileInputRef"
            id="import-character-file-input"
            type="file"
            accept=".json,application/json"
            class="peer sr-only"
            @change="handleFileSelect"
          />
          <label
            for="import-character-file-input"
            class="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-tertiary px-4 py-2 font-label-md text-on-tertiary transition-transform active:scale-95 peer-focus-visible:ring-2 peer-focus-visible:ring-tertiary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-container"
          >
            Choose File
          </label>
        </div>

        <div v-else class="flex items-center justify-between gap-4 text-left">
          <div class="flex min-w-0 items-center gap-3">
            <span class="material-symbols-outlined text-tertiary" aria-hidden="true">description</span>
            <span class="truncate text-sm text-on-surface">{{ selectedFile.name }}</span>
          </div>
          <PressableButton
            variant="ghost"
            size="sm"
            class="shrink-0 text-error"
            :disabled="status === 'processing'"
            @click="reset"
          >
            Remove File
          </PressableButton>
        </div>
      </div>

      <!-- Preview -->
      <div
        v-if="preview"
        class="rounded-lg border border-outline-variant bg-surface-variant/40 p-4"
      >
        <h3 class="mb-2 font-label-md text-label-md text-tertiary">Preview</h3>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt class="text-on-surface-variant">Name</dt>
              <dd class="text-on-surface text-right">{{ preview.name }}</dd>
              <dt class="text-on-surface-variant">Class</dt>
              <dd class="text-on-surface text-right">{{ preview.className }}</dd>
              <dt class="text-on-surface-variant">Species</dt>
              <dd class="text-on-surface text-right">{{ preview.species }}</dd>
              <dt class="text-on-surface-variant">Background</dt>
              <dd class="text-on-surface text-right">{{ preview.background }}</dd>
              <template v-if="preview.renownTier !== null">
                <dt class="text-on-surface-variant">Renown Tier</dt>
                <dd class="text-on-surface text-right">{{ preview.renownTier }}</dd>
              </template>
              <dt class="text-on-surface-variant">Features / Spells</dt>
              <dd class="text-on-surface text-right">
                {{ preview.featureCount }} / {{ preview.spellCount }}
              </dd>
            </dl>
      </div>

      <!-- Status Messages -->
      <StatusBanner
        v-if="statusMessage"
        :tone="status === 'error' ? 'error' : 'info'"
        :icon="status === 'success' ? 'check_circle' : status === 'processing' ? 'progress_activity' : undefined"
      >
        {{ statusMessage }}
      </StatusBanner>

      <!-- Validation errors -->
      <ul v-if="importErrors.length" class="list-inside list-disc space-y-1 text-sm text-error">
        <li v-for="(err, i) in importErrors" :key="i">{{ err }}</li>
      </ul>

      <!-- Warning -->
      <StatusBanner tone="warning">
        Importing replaces the currently open character. Any unsaved changes to the current
        character will be lost.
      </StatusBanner>
    </div>

    <template #footer>
      <PressableButton variant="ghost" :disabled="status === 'processing'" @click="close">
        Cancel
      </PressableButton>
      <PressableButton variant="primary" :disabled="!canConfirm" @click="confirmImport">
        Import Character
      </PressableButton>
    </template>
  </BaseModal>
</template>
