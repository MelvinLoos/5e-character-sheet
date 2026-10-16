<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'

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
  <Transition name="sheet-up">
    <div v-if="show" class="modal-backdrop backdrop-blur-sm bg-black/40">
      <div class="modal-content max-w-2xl rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-tertiary">Import Character</h2>
          <button @click="close" class="icon-button" title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-on-surface-variant font-body-sm">
            Upload a character JSON file that was previously exported from this app. Importing
            replaces the currently open character and saves it to your library.
          </p>

          <!-- File Upload Area -->
          <div
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging
                ? 'border-tertiary bg-tertiary/10'
                : 'border-outline-variant bg-surface-variant/40',
              status === 'processing' ? 'opacity-50 pointer-events-none' : '',
            ]"
          >
            <div v-if="!selectedFile" class="space-y-3">
              <span class="material-symbols-outlined text-4xl text-tertiary">upload_file</span>
              <p class="text-on-surface-variant font-body-sm">
                Drag &amp; drop a character .json file here, or click to browse
              </p>
              <input
                ref="fileInputRef"
                id="import-character-file-input"
                type="file"
                accept=".json,application/json"
                class="hidden"
                @change="handleFileSelect"
              />
              <label
                for="import-character-file-input"
                class="inline-block px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md text-sm cursor-pointer active:scale-95 transition-transform"
              >
                Choose File
              </label>
            </div>

            <div v-else class="flex items-center justify-between gap-4 text-left">
              <div class="flex items-center gap-3 min-w-0">
                <span class="material-symbols-outlined text-tertiary">description</span>
                <span class="text-sm text-on-surface truncate">{{ selectedFile.name }}</span>
              </div>
              <button
                class="text-sm text-error hover:underline shrink-0"
                :disabled="status === 'processing'"
                @click="reset"
              >
                Remove File
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div
            v-if="preview"
            class="border border-outline-variant bg-surface-variant/40 p-4 rounded-lg"
          >
            <h3 class="font-label-md text-label-md text-tertiary mb-2">Preview</h3>
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
          <div
            v-if="statusMessage"
            :class="[
              'p-3 rounded text-sm',
              status === 'success' ? 'bg-green-100 text-green-800' : '',
              status === 'error' ? 'bg-red-100 text-red-800' : '',
              status === 'processing' ? 'bg-blue-100 text-blue-800' : '',
            ]"
          >
            {{ statusMessage }}
          </div>

          <!-- Validation errors -->
          <ul v-if="importErrors.length" class="list-disc list-inside text-sm text-error space-y-1">
            <li v-for="(err, i) in importErrors" :key="i">{{ err }}</li>
          </ul>

          <!-- Warning -->
          <div class="bg-amber-50 border border-amber-300 p-3 rounded text-sm text-amber-900">
            <strong>Note:</strong> Importing replaces the currently open character. Any unsaved
            changes to the current character will be lost.
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-end">
            <button
              @click="close"
              class="px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-variant active:scale-95 transition-all"
              :disabled="status === 'processing'"
            >
              Cancel
            </button>
            <button
              @click="confirmImport"
              class="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="!canConfirm"
            >
              Import Character
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-sheet-bg);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.25),
    0 10px 10px rgba(0, 0, 0, 0.12);
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
}
</style>

