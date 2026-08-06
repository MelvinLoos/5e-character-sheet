<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGuildStore } from '@/stores/guildStore'
import { useGuildContentSyncStore } from '@/stores/guildContentSyncStore'
import { useRulesStore } from '@/stores/rulesStore'
import {
  createGuildSpell,
  updateGuildSpell,
  deleteGuildSpell,
  createGuildFeat,
  updateGuildFeat,
  deleteGuildFeat,
} from '@/utils/guildContentManagement'
import { logger } from '@/utils/logger'
import type { GuildSpell, GuildFeat } from '@/types/supabase'

// ---------------------------------------------------------------------------
// Props & Emits
// ---------------------------------------------------------------------------

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

const guildStore = useGuildStore()
const guildContentSyncStore = useGuildContentSyncStore()
const rulesStore = useRulesStore()

// ---------------------------------------------------------------------------
// Local State
// ---------------------------------------------------------------------------

const activeTab = ref<'spells' | 'feats'>('spells')
const isRegistering = ref(false)
const registerError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const isSubmitting = ref(false)

// Show forms
const showAddSpellForm = ref(false)
const showAddFeatForm = ref(false)
const editingSpellId = ref<string | null>(null)
const editingFeatId = ref<string | null>(null)

// JSON textarea values
const spellJsonText = ref('')
const featJsonText = ref('')

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const isAdmin = computed(() => guildStore.isActiveGuildAdmin)
const guildId = computed(() => guildStore.activeGuildId)
const isRegistered = computed(() => {
  return guildStore.registeredGuildIds?.has(guildId.value ?? '') ?? false
})

const guildSpells = computed(() => {
  return rulesStore.allSpells.filter((s: Record<string, unknown>) => s._guild_id === guildId.value)
})

const guildFeats = computed(() => {
  return rulesStore.allFeats.filter((f: Record<string, unknown>) => f._guild_id === guildId.value)
})

// ---------------------------------------------------------------------------
// Register Guild
// ---------------------------------------------------------------------------

async function handleRegisterGuild() {
  isRegistering.value = true
  registerError.value = null

  try {
    await guildStore.registerActiveGuild()
  } catch (e) {
    registerError.value = (e as Error).message
    logger.error('Failed to register guild:', e)
  } finally {
    isRegistering.value = false
  }
}

// ---------------------------------------------------------------------------
// CRUD Handlers - Spells
// ---------------------------------------------------------------------------

function openAddSpell() {
  spellJsonText.value = JSON.stringify({ name: '', level: 0, school: '', description: '' }, null, 2)
  editingSpellId.value = null
  showAddSpellForm.value = true
  actionError.value = null
}

function openEditSpell(spell: Record<string, unknown>) {
  try {
    spellJsonText.value = JSON.stringify(spell, null, 2)
  } catch {
    spellJsonText.value = '{}'
  }
  editingSpellId.value = (spell.id as string) ?? null
  showAddSpellForm.value = true
  actionError.value = null
}

function cancelSpellForm() {
  showAddSpellForm.value = false
  editingSpellId.value = null
  spellJsonText.value = ''
  actionError.value = null
}

async function submitSpellForm() {
  actionError.value = null
  isSubmitting.value = true

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(spellJsonText.value)
  } catch (e) {
    actionError.value = `Invalid JSON: ${(e as Error).message}`
    isSubmitting.value = false
    return
  }

  try {
    if (editingSpellId.value) {
      await updateGuildSpell(editingSpellId.value, parsed)
    } else {
      await createGuildSpell({
        guild_id: guildId.value!,
        data: parsed,
      })
    }

    cancelSpellForm()
    // Re-sync local state
    await guildContentSyncStore.syncGuildContent(guildId.value!)
  } catch (e) {
    actionError.value = (e as Error).message
    logger.error('Failed to save spell:', e)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteSpell(id: string) {
  actionError.value = null
  isSubmitting.value = true

  try {
    await deleteGuildSpell(id)
    await guildContentSyncStore.syncGuildContent(guildId.value!)
  } catch (e) {
    actionError.value = (e as Error).message
    logger.error('Failed to delete spell:', e)
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------------------------------------------------------------
// CRUD Handlers - Feats
// ---------------------------------------------------------------------------

function openAddFeat() {
  featJsonText.value = JSON.stringify({ name: '', description: '', prerequisite: null }, null, 2)
  editingFeatId.value = null
  showAddFeatForm.value = true
  actionError.value = null
}

function openEditFeat(feat: Record<string, unknown>) {
  try {
    featJsonText.value = JSON.stringify(feat, null, 2)
  } catch {
    featJsonText.value = '{}'
  }
  editingFeatId.value = (feat.id as string) ?? null
  showAddFeatForm.value = true
  actionError.value = null
}

function cancelFeatForm() {
  showAddFeatForm.value = false
  editingFeatId.value = null
  featJsonText.value = ''
  actionError.value = null
}

async function submitFeatForm() {
  actionError.value = null
  isSubmitting.value = true

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(featJsonText.value)
  } catch (e) {
    actionError.value = `Invalid JSON: ${(e as Error).message}`
    isSubmitting.value = false
    return
  }

  try {
    if (editingFeatId.value) {
      await updateGuildFeat(editingFeatId.value, parsed)
    } else {
      await createGuildFeat({
        guild_id: guildId.value!,
        data: parsed,
      })
    }

    cancelFeatForm()
    await guildContentSyncStore.syncGuildContent(guildId.value!)
  } catch (e) {
    actionError.value = (e as Error).message
    logger.error('Failed to save feat:', e)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteFeat(id: string) {
  actionError.value = null
  isSubmitting.value = true

  try {
    await deleteGuildFeat(id)
    await guildContentSyncStore.syncGuildContent(guildId.value!)
  } catch (e) {
    actionError.value = (e as Error).message
    logger.error('Failed to delete feat:', e)
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------------------------------------------------------------
// Close on Escape
// ---------------------------------------------------------------------------

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && isAdmin"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50"></div>

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface-container rounded-2xl shadow-xl border border-outline-variant z-10"
          role="dialog"
          aria-modal="true"
          aria-label="Server Homebrew Management"
        >
          <!-- Header -->
          <div class="sticky top-0 bg-surface-container z-20 flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
            <h2 class="font-headline-md text-headline-md text-on-surface">
              Server Homebrew Management
            </h2>
            <button
              @click="emit('close')"
              class="p-2 rounded-full hover:bg-surface-variant active:scale-95 transition-all"
              aria-label="Close"
            >
              <span class="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div class="p-6">
            <!-- Guild Registration Section -->
            <div v-if="!isRegistered" class="text-center py-8">
              <span class="material-symbols-outlined text-5xl text-tertiary mb-4">shield</span>
              <p class="font-body-lg text-on-surface mb-2">
                This server hasn't been enabled for homebrew content yet.
              </p>
              <p class="font-body-md text-on-surface-variant mb-6">
                Register your server to start managing custom spells and feats.
              </p>
              <button
                @click="handleRegisterGuild"
                :disabled="isRegistering"
                class="px-6 py-3 bg-tertiary text-on-tertiary rounded-xl font-label-lg hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="isRegistering" class="material-symbols-outlined animate-spin mr-2 text-sm">progress_activity</span>
                {{ isRegistering ? 'Registering...' : 'Enable Homebrew for this Server' }}
              </button>
              <p v-if="registerError" class="text-error font-body-sm mt-3">{{ registerError }}</p>
            </div>

            <!-- CRUD Tabs (only when registered) -->
            <div v-else>
              <!-- Tab Headers -->
              <div class="flex gap-1 mb-6 bg-surface-variant/50 rounded-xl p-1">
                <button
                  @click="activeTab = 'spells'"
                  class="flex-1 py-2.5 px-4 rounded-lg font-label-md text-sm transition-all duration-200"
                  :class="activeTab === 'spells'
                    ? 'bg-tertiary text-on-tertiary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-bright'"
                >
                  <span class="material-symbols-outlined text-[1.125rem] align-middle mr-1">auto_stories</span>
                  Spells
                </button>
                <button
                  @click="activeTab = 'feats'"
                  class="flex-1 py-2.5 px-4 rounded-lg font-label-md text-sm transition-all duration-200"
                  :class="activeTab === 'feats'
                    ? 'bg-tertiary text-on-tertiary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-bright'"
                >
                  <span class="material-symbols-outlined text-[1.125rem] align-middle mr-1">military_tech</span>
                  Feats
                </button>
              </div>

              <!-- Error banner -->
              <div v-if="actionError" class="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error font-body-sm">
                {{ actionError }}
              </div>

              <!-- ============================================================= -->
              <!-- Spells Tab -->
              <!-- ============================================================= -->
              <div v-if="activeTab === 'spells'">
                <!-- Spell List -->
                <div v-if="!showAddSpellForm">
                  <div v-if="guildSpells.length === 0" class="text-center py-8 text-on-surface-variant font-body-md">
                    No custom spells yet. Add one to get started!
                  </div>
                  <ul v-else class="space-y-2 mb-4">
                    <li
                      v-for="spell in guildSpells"
                      :key="(spell as any).id"
                      class="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg border border-outline-variant/20"
                    >
                      <span class="font-body-md text-on-surface truncate mr-2">
                        {{ (spell as any).name || 'Unnamed Spell' }}
                      </span>
                      <div class="flex items-center gap-1 shrink-0">
                        <button
                          @click="openEditSpell(spell as Record<string, unknown>)"
                          class="p-1.5 rounded-lg hover:bg-surface-bright text-on-surface-variant hover:text-tertiary transition-colors"
                          title="Edit"
                          aria-label="Edit spell"
                        >
                          <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          @click="handleDeleteSpell((spell as any).id)"
                          class="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
                          aria-label="Delete spell"
                        >
                          <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </li>
                  </ul>
                  <button
                    @click="openAddSpell"
                    class="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-xl text-on-surface-variant font-label-md text-sm hover:border-tertiary hover:text-tertiary active:scale-[0.99] transition-all"
                  >
                    <span class="material-symbols-outlined text-sm align-middle mr-1">add</span>
                    Add Custom Spell
                  </button>
                </div>

                <!-- Spell Form (Add/Edit) -->
                <div v-else class="space-y-4">
                  <h3 class="font-label-lg text-on-surface">
                    {{ editingSpellId ? 'Edit Spell' : 'Add New Spell' }}
                  </h3>
                  <p class="font-body-sm text-on-surface-variant">
                    Enter the spell data as JSON. The object will be validated against the spell schema.
                  </p>
                  <textarea
                    v-model="spellJsonText"
                    rows="12"
                    class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary resize-y"
                    placeholder='{"name": "Fireball", "level": 3, ...}'
                  ></textarea>
                  <div class="flex gap-2 justify-end">
                    <button
                      @click="cancelSpellForm"
                      class="px-4 py-2 rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-variant active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitSpellForm"
                      :disabled="isSubmitting"
                      class="px-6 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-md text-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span v-if="isSubmitting" class="material-symbols-outlined animate-spin mr-1 text-sm">progress_activity</span>
                      {{ isSubmitting ? 'Saving...' : 'Save Spell' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ============================================================= -->
              <!-- Feats Tab -->
              <!-- ============================================================= -->
              <div v-if="activeTab === 'feats'">
                <!-- Feat List -->
                <div v-if="!showAddFeatForm">
                  <div v-if="guildFeats.length === 0" class="text-center py-8 text-on-surface-variant font-body-md">
                    No custom feats yet. Add one to get started!
                  </div>
                  <ul v-else class="space-y-2 mb-4">
                    <li
                      v-for="feat in guildFeats"
                      :key="(feat as any).id"
                      class="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg border border-outline-variant/20"
                    >
                      <span class="font-body-md text-on-surface truncate mr-2">
                        {{ (feat as any).name || 'Unnamed Feat' }}
                      </span>
                      <div class="flex items-center gap-1 shrink-0">
                        <button
                          @click="openEditFeat(feat as Record<string, unknown>)"
                          class="p-1.5 rounded-lg hover:bg-surface-bright text-on-surface-variant hover:text-tertiary transition-colors"
                          title="Edit"
                          aria-label="Edit feat"
                        >
                          <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          @click="handleDeleteFeat((feat as any).id)"
                          class="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
                          aria-label="Delete feat"
                        >
                          <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </li>
                  </ul>
                  <button
                    @click="openAddFeat"
                    class="w-full py-2.5 border-2 border-dashed border-outline-variant/50 rounded-xl text-on-surface-variant font-label-md text-sm hover:border-tertiary hover:text-tertiary active:scale-[0.99] transition-all"
                  >
                    <span class="material-symbols-outlined text-sm align-middle mr-1">add</span>
                    Add Custom Feat
                  </button>
                </div>

                <!-- Feat Form (Add/Edit) -->
                <div v-else class="space-y-4">
                  <h3 class="font-label-lg text-on-surface">
                    {{ editingFeatId ? 'Edit Feat' : 'Add New Feat' }}
                  </h3>
                  <p class="font-body-sm text-on-surface-variant">
                    Enter the feat data as JSON. The object will be validated against the feat schema.
                  </p>
                  <textarea
                    v-model="featJsonText"
                    rows="12"
                    class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary resize-y"
                    placeholder='{"name": "Lucky", "description": "You have inexplicable luck..."}'
                  ></textarea>
                  <div class="flex gap-2 justify-end">
                    <button
                      @click="cancelFeatForm"
                      class="px-4 py-2 rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-variant active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitFeatForm"
                      :disabled="isSubmitting"
                      class="px-6 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-md text-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span v-if="isSubmitting" class="material-symbols-outlined animate-spin mr-1 text-sm">progress_activity</span>
                      {{ isSubmitting ? 'Saving...' : 'Save Feat' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 150ms ease-in;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  opacity: 0;
  transform: scale(0.95) translateY(12px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to > div:last-child {
  opacity: 0;
  transform: scale(0.95);
}
</style>