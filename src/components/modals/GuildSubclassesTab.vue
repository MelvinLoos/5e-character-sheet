<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGuildContentSyncStore } from '@/stores/guildContentSyncStore'
import { useRulesStore } from '@/stores/rulesStore'
import {
  createGuildSubclass,
  updateGuildSubclass,
  deleteGuildSubclass,
  bulkCreateGuildSubclasses,
} from '@/utils/guildContentManagement'
import { parseSubclassImport } from '@/utils/subclassParser'
import { logger } from '@/utils/logger'
import type { SubclassImport } from '@/types/rules'

const props = defineProps<{ guildId: string }>()

const syncStore = useGuildContentSyncStore()
const rulesStore = useRulesStore()

const error = ref<string | null>(null)
const isSubmitting = ref(false)

// Add / edit form
const showForm = ref(false)
const editingId = ref<string | null>(null)
const jsonText = ref('')

// Bulk import
const showBulk = ref(false)
const bulkText = ref('')
const bulkError = ref<string | null>(null)
const bulkPreview = ref<SubclassImport[] | null>(null)
const bulkFileInput = ref<HTMLInputElement | null>(null)

type GuildEntry = SubclassImport & { _id?: string; _guild_id?: string }

const guildSubclasses = computed(
  () => (rulesStore.guildSubclasses as GuildEntry[]).filter((s) => s._guild_id === props.guildId),
)

const TEMPLATE: SubclassImport = {
  name: '',
  parentClass: 'Fighter',
  description: '',
  features: [{ name: '', level: 3, description: '' }],
}

function openAdd() {
  jsonText.value = JSON.stringify(TEMPLATE, null, 2)
  editingId.value = null
  showForm.value = true
  error.value = null
}

function openEdit(entry: GuildEntry) {
  const { _id, _guild_id, ...data } = entry
  void _guild_id
  jsonText.value = JSON.stringify(data, null, 2)
  editingId.value = _id ?? null
  showForm.value = true
  error.value = null
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  jsonText.value = ''
  error.value = null
}

async function submitForm() {
  error.value = null
  isSubmitting.value = true

  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText.value)
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`)
    }

    if (editingId.value) {
      await updateGuildSubclass(editingId.value, parsed)
    } else {
      await createGuildSubclass({ guild_id: props.guildId, data: parsed })
    }

    cancelForm()
    await syncStore.syncGuildContent(props.guildId)
  } catch (e) {
    error.value = (e as Error).message
    logger.error('Failed to save subclass:', e)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: string | undefined) {
  if (!id) return
  error.value = null
  isSubmitting.value = true

  try {
    await deleteGuildSubclass(id)
    await syncStore.syncGuildContent(props.guildId)
  } catch (e) {
    error.value = (e as Error).message
    logger.error('Failed to delete subclass:', e)
  } finally {
    isSubmitting.value = false
  }
}

// --- Bulk import ---

function openBulk() {
  showBulk.value = true
  bulkText.value = ''
  bulkError.value = null
  bulkPreview.value = null
}

function cancelBulk() {
  showBulk.value = false
  bulkText.value = ''
  bulkError.value = null
  bulkPreview.value = null
  if (bulkFileInput.value) bulkFileInput.value.value = ''
}

async function handleBulkFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    bulkText.value = await file.text()
    bulkPreview.value = null
    bulkError.value = null
  } catch (e) {
    bulkError.value = `Failed to read file: ${(e as Error).message}`
  }
}

function previewBulk() {
  bulkError.value = null
  bulkPreview.value = null
  try {
    bulkPreview.value = parseSubclassImport(JSON.parse(bulkText.value))
  } catch (e) {
    bulkError.value = (e as Error).message
  }
}

async function confirmBulk() {
  if (!bulkPreview.value) return
  isSubmitting.value = true
  bulkError.value = null

  try {
    await bulkCreateGuildSubclasses({ guild_id: props.guildId, subclasses: bulkPreview.value })
    cancelBulk()
    await syncStore.syncGuildContent(props.guildId)
  } catch (e) {
    bulkError.value = (e as Error).message
    logger.error('Failed to bulk import subclasses:', e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div data-testid="guild-subclasses-tab">
    <div v-if="error" class="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error font-body-sm">
      {{ error }}
    </div>

    <!-- List -->
    <div v-if="!showForm">
      <div v-if="guildSubclasses.length === 0" class="text-center py-8 text-on-surface-variant font-body-md">
        No custom subclasses yet. Add one to get started!
      </div>
      <ul v-else class="space-y-2 mb-4">
        <li
          v-for="entry in guildSubclasses"
          :key="entry._id"
          class="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg border border-outline-variant/20"
        >
          <span class="font-body-md text-on-surface truncate mr-2">
            {{ entry.name }}
            <span class="text-on-surface-variant">({{ entry.parentClass }})</span>
          </span>
          <div class="flex items-center gap-1 shrink-0">
            <button
              @click="openEdit(entry)"
              class="p-1.5 rounded-lg hover:bg-surface-bright text-on-surface-variant hover:text-tertiary transition-colors"
              title="Edit"
              aria-label="Edit subclass"
            >
              <span class="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
            </button>
            <button
              @click="handleDelete(entry._id)"
              :disabled="isSubmitting"
              class="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
              title="Delete"
              aria-label="Delete subclass"
            >
              <span class="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
            </button>
          </div>
        </li>
      </ul>
      <button
        @click="openAdd"
        class="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-xl text-on-surface-variant font-label-md text-sm hover:border-tertiary hover:text-tertiary active:scale-[0.99] transition-all"
      >
        <span class="material-symbols-outlined text-sm align-middle mr-1" aria-hidden="true">add</span>
        Add Custom Subclass
      </button>
      <button
        @click="openBulk"
        class="w-full mt-2 py-2.5 border-2 border-dashed border-tertiary/30 rounded-xl text-tertiary font-label-md text-sm hover:bg-tertiary/5 active:scale-[0.99] transition-all"
      >
        <span class="material-symbols-outlined text-sm align-middle mr-1" aria-hidden="true">upload</span>
        Bulk Import Subclasses
      </button>
    </div>

    <!-- Add / edit form -->
    <div v-else class="space-y-4">
      <h3 class="font-label-lg text-on-surface">
        {{ editingId ? 'Edit Subclass' : 'Add New Subclass' }}
      </h3>
      <p class="font-body-sm text-on-surface-variant">
        Enter the subclass as JSON following
        <a href="/subclass-schema.json" target="_blank" rel="noopener" class="underline">subclass-schema.json</a>.
        It is validated before saving.
      </p>
      <textarea
        v-model="jsonText"
        rows="14"
        aria-label="Subclass JSON"
        class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary resize-y"
      ></textarea>
      <div class="flex gap-2 justify-end">
        <button
          @click="cancelForm"
          class="px-4 py-2 rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-variant active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          @click="submitForm"
          :disabled="isSubmitting"
          class="px-6 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-md text-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="material-symbols-outlined animate-spin mr-1 text-sm" aria-hidden="true">progress_activity</span>
          {{ isSubmitting ? 'Saving...' : 'Save Subclass' }}
        </button>
      </div>
    </div>

    <!-- Bulk import -->
    <div v-if="showBulk" class="mt-6 p-4 bg-surface-variant/20 border border-outline-variant/30 rounded-xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-label-lg text-on-surface">Bulk Import Subclasses</h3>
        <button
          @click="cancelBulk"
          class="p-1 rounded-full hover:bg-surface-bright text-on-surface-variant transition-colors"
          aria-label="Close bulk import"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">close</span>
        </button>
      </div>
      <p class="font-body-sm text-on-surface-variant">
        Paste or upload a file in the
        <a href="/subclass-schema.json" target="_blank" rel="noopener" class="underline">subclass schema</a>
        format: <code class="bg-surface-variant px-1 rounded">&#123; "subclasses": [...] &#125;</code> or a plain array.
      </p>
      <input
        ref="bulkFileInput"
        type="file"
        accept=".json"
        aria-label="Subclass JSON file"
        class="font-body-sm"
        @change="handleBulkFile"
      />
      <textarea
        v-model="bulkText"
        rows="8"
        aria-label="Bulk subclass JSON"
        class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary resize-y"
        @input="bulkPreview = null"
      ></textarea>
      <p v-if="bulkError" class="text-error font-body-sm" role="alert">{{ bulkError }}</p>
      <div v-if="bulkPreview" class="font-body-sm text-on-surface">
        {{ bulkPreview.length }} subclass(es) ready:
        {{ bulkPreview.map((s) => `${s.name} (${s.parentClass})`).join(', ') }}
      </div>
      <div class="flex gap-2 justify-end">
        <button
          @click="previewBulk"
          :disabled="!bulkText.trim() || isSubmitting"
          class="px-4 py-2 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-95 transition-all disabled:opacity-60"
        >
          Validate
        </button>
        <button
          @click="confirmBulk"
          :disabled="!bulkPreview || isSubmitting"
          class="px-6 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-md text-sm active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Importing...' : 'Import' }}
        </button>
      </div>
    </div>
  </div>
</template>
