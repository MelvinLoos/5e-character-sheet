<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRulesStore } from '@/stores/rulesStore'
import { mapSpells, mapFeats, type AppSpell } from '@/utils/fiveToolsAdapter'
import feather from 'feather-icons'

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
  <Transition name="sheet-up">
    <div v-if="show" class="modal-backdrop backdrop-blur-sm bg-black/40">
      <div class="modal-content max-w-2xl rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-tertiary">Import 5e.tools Data</h2>
          <button @click="close" class="icon-button" title="Close">
            <span v-html="feather.icons.x.toSvg()"></span>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Category Selection -->
          <div>
            <label class="block text-sm font-medium mb-2">Import Category:</label>
            <select
              v-model="selectedCategory"
              class="w-full p-2 border border-sheet-border bg-sheet-input-bg"
              :disabled="status === 'processing'"
            >
              <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- File Upload Area -->
          <div
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
              status === 'processing' ? 'opacity-50 pointer-events-none' : '',
            ]"
          >
            <div v-if="!selectedFile" class="space-y-3">
              <div class="text-4xl">📁</div>
              <p class="text-gray-600">Drag & drop a .json file here, or click to browse</p>
              <input
                ref="fileInputRef"
                type="file"
                accept=".json"
                @change="handleFileSelect"
                class="hidden"
                id="import-file-input"
              />
              <label
                for="import-file-input"
                class="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
              >
                Choose File
              </label>
            </div>

            <div v-else class="space-y-3">
              <div class="text-4xl">📄</div>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-600">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
              <button
                @click="clearFile"
                class="text-red-500 hover:text-red-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out text-sm select-none"
                :disabled="status === 'processing'"
              >
                Remove File
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="previewData" class="border border-blue-300 bg-blue-50 p-4 rounded">
            <h3 class="font-bold mb-2">Preview:</h3>
            <p class="mb-2">Found {{ previewData.count }} {{ selectedCategory }}</p>
            <p class="text-sm text-gray-700 mb-2">
              First {{ Math.min(5, previewData.count) }} items:
            </p>
            <ul class="list-disc list-inside text-sm">
              <li v-for="item in previewData.items" :key="item">{{ item }}</li>
            </ul>
            <p v-if="previewData.count > 5" class="text-xs text-gray-600 mt-2">
              ...and {{ previewData.count - 5 }} more
            </p>
          </div>

          <!-- Status Messages -->
          <div
            v-if="statusMessage"
            :class="[
              'p-3 rounded',
              status === 'success' ? 'bg-green-100 text-green-800' : '',
              status === 'error' ? 'bg-red-100 text-red-800' : '',
              status === 'processing' ? 'bg-blue-100 text-blue-800' : '',
            ]"
          >
            {{ statusMessage }}
          </div>

          <!-- Warning -->
          <div class="bg-amber-50 border border-amber-300 p-3 rounded text-sm">
            <strong>⚠️ Warning:</strong> Importing will replace existing {{ selectedCategory }} data.
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-end">
            <button
              @click="close"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:shadow-sm active:scale-95 transition-all duration-200 ease-out select-none"
              :disabled="status === 'processing'"
            >
              Cancel
            </button>

            <button
              v-if="!previewData"
              @click="processFile"
              :disabled="!canProcess"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm active:scale-95 transition-all duration-200 ease-out disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none select-none"
            >
              Process File
            </button>

            <button
              v-if="canConfirm"
              @click="confirmImport"
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm active:scale-95 transition-all duration-200 ease-out select-none"
            >
              Confirm Import
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
