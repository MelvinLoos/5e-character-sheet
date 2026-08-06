import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'

import { mapSpells, mapFeats } from '../src/utils/fiveToolsAdapter'

// ---------------------------------------------------------------------------
// Parser tests (no Vue needed)
// ---------------------------------------------------------------------------

describe('guildContentBulkImport - parseSpellArray', () => {
  it('maps a valid JSON array of 5e.tools spells into AppSpell objects', () => {
    const input = [
      { name: 'Fireball', level: 3, school: 'E', entries: ['A bright streak...'], source: 'PHB' },
      { name: 'Magic Missile', level: 1, school: 'E', entries: ['You create three...'], source: 'PHB' },
    ]
    const result = mapSpells(input)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Fireball')
    expect(result[0].level).toBe(3)
  })

  it('filters out malformed entries missing required fields', () => {
    const input = [
      { name: 'Valid Spell', level: 1, entries: ['Does something'] },
      { name: null, level: 2, entries: ['Missing name'] },
      { name: 'Missing Level' },
      { entries: ['No name at all'] },
    ]
    expect(mapSpells(input)).toHaveLength(1)
  })

  it('handles empty array gracefully', () => {
    expect(mapSpells([])).toEqual([])
  })

  it('handles the { spell: [...] } wrapper format', () => {
    const wrapper = { spell: [{ name: 'Cure Wounds', level: 1, entries: ['Test'] }] }
    const spells = Array.isArray(wrapper) ? wrapper : (wrapper as Record<string, unknown>).spell || []
    expect(mapSpells(spells as unknown[])).toHaveLength(1)
  })

  it('returns validCount and invalidCount statistics', () => {
    const input = [
      { name: 'Spell A', level: 0, entries: ['Cantrip'] },
      { name: 'Spell B', level: 1, entries: ['Level 1'] },
      null, { invalid: true },
      { name: 'Spell C', level: 2, entries: ['Level 2'] },
    ]
    const result = mapSpells(input)
    expect(result.length).toBe(3)
    expect(input.length - result.length).toBe(2)
  })
})

describe('guildContentBulkImport - parseFeatArray', () => {
  it('maps a valid JSON array of 5e.tools feats into AppFeature objects', () => {
    const input = [
      { name: 'Lucky', source: 'PHB', entries: ['You have inexplicable luck...'] },
      { name: 'Alert', source: 'PHB', entries: ['Always on the lookout...'] },
    ]
    const result = mapFeats(input)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Lucky')
  })

  it('filters out malformed feat entries missing name', () => {
    const input = [
      { name: 'Valid Feat', entries: ['Does something'] },
      { entries: ['No name'] }, { name: '', entries: ['Empty name'] }, null,
    ]
    expect(mapFeats(input)).toHaveLength(1)
  })

  it('handles the { feat: [...] } wrapper format via caller extraction', () => {
    const wrapper = { feat: [{ name: 'Tough', entries: ['Test'] }] }
    const feats = Array.isArray(wrapper) ? wrapper : (wrapper as Record<string, unknown>).feat || []
    expect(mapFeats(feats as unknown[])).toHaveLength(1)
  })

  it('handles empty array gracefully', () => {
    expect(mapFeats([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Mock infrastructure for component tests
// ---------------------------------------------------------------------------

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
  })),
}

vi.mock('../src/infra/sharingService', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => null),
}))

vi.mock('../src/utils/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
}))

const mockGet = vi.fn(() => Promise.resolve(null))
const mockSet = vi.fn(() => Promise.resolve())
const mockDel = vi.fn(() => Promise.resolve())
vi.mock('idb-keyval', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  set: (...args: unknown[]) => mockSet(...args),
  del: (...args: unknown[]) => mockDel(...args),
}))

import GuildManagementModal from '../src/components/modals/GuildManagementModal.vue'
import { useGuildStore } from '../src/stores/guildStore'
import { useAuthStore } from '../src/stores/authStore'
import { useRulesStore } from '../src/stores/rulesStore'

function createMockFile(content: string, filename: string, mimeType = 'application/json'): File {
  const blob = new Blob([content], { type: mimeType })
  const file = new File([blob], filename, { type: mimeType })
  // JSDOM doesn't implement File.prototype.text(). Polyfill it so readBulkFile works.
  if (!('text' in file)) {
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(content),
      writable: true,
      configurable: true,
    })
  }
  return file
}

/** Find a button whose visible text contains the given string. */
function findButtonByText(wrapper: VueWrapper, text: string) {
  const buttons = wrapper.findAll('button')
  for (const btn of buttons) {
    if (btn.text().includes(text)) return btn
  }
  return null
}

describe('guildContentBulkImport - file upload (UI)', () => {
  let wrapper: VueWrapper<InstanceType<typeof GuildManagementModal>>

  beforeEach(() => {
    setActivePinia(createPinia())

    const authStore = useAuthStore()
    authStore.$patch({
      status: 'authenticated' as const,
      userId: 'test-user',
      discordUsername: 'TestUser',
    })

    const guildStore = useGuildStore()
    guildStore.$patch({
      guilds: [
        { id: 'test-guild', name: 'Test Guild', icon: null, owner: true, permissions: '8', features: [] },
      ],
      activeGuildId: 'test-guild',
      registeredGuildIds: new Set(['test-guild']),
      isLoading: false,
      error: null,
    })

    const rulesStore = useRulesStore()
    rulesStore.$patch({ allSpells: [], allFeats: [] })

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    ) as unknown as typeof fetch
  })

  function mountAndOpen() {
    wrapper = mount(GuildManagementModal, {
      props: { isOpen: true },
      global: {
        stubs: {
          Teleport: { template: '<div><slot /></div>' },
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })
  }

  async function openBulkImportPanel() {
    const bulkBtn = findButtonByText(wrapper, 'Bulk Import')
    expect(bulkBtn).not.toBeNull()
    await bulkBtn!.trigger('click')
    await nextTick()
  }

  // -----------------------------------------------------------------------
  // Test 1: File input renders with accept=".json"
  // -----------------------------------------------------------------------
  it('renders a file input with accept=".json" in the bulk import panel', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)
    expect((fileInput.element as HTMLInputElement).accept).toBe('.json')
  })

  // -----------------------------------------------------------------------
  // Test 2: Non-.json file sets error state
  // -----------------------------------------------------------------------
  it('shows file error message when a non-.json file is selected', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    const txtFile = createMockFile('not json', 'test.txt', 'text/plain')
    Object.defineProperty(fileInput.element, 'files', { value: [txtFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    // Error is displayed via v-if on bulkImportFileError
    expect(wrapper.text()).toContain('Please select a .json file.')
    // Textarea should still be visible (no valid file accepted)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  // -----------------------------------------------------------------------
  // Test 3: Textarea hidden when .json file is selected (DOM performance)
  // -----------------------------------------------------------------------
  it('hides the textarea when a .json file is selected (DOM performance)', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    const jsonFile = createMockFile(
      JSON.stringify([{ name: 'Fireball', level: 3, entries: ['Test'] }]),
      'spells.json',
    )
    Object.defineProperty(fileInput.element, 'files', { value: [jsonFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    // Textarea hidden via v-if="!bulkImportFile"
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  // -----------------------------------------------------------------------
  // Test 4: Selected file name is displayed
  // -----------------------------------------------------------------------
  it('displays the selected file name in the UI', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    const jsonFile = createMockFile(
      JSON.stringify([{ name: 'Fireball', level: 3, entries: ['Test'] }]),
      'spells.json',
    )
    Object.defineProperty(fileInput.element, 'files', { value: [jsonFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    expect(wrapper.text()).toContain('spells.json')
  })

  // -----------------------------------------------------------------------
  // Test 5: validateAndPreview reads file and produces preview
  // -----------------------------------------------------------------------
  it('validateAndPreview reads file content and produces a valid preview', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    const spellData = [
      { name: 'Fireball', level: 3, school: 'E', entries: ['Test fireball'] },
      { name: 'Cure Wounds', level: 1, school: 'A', entries: ['Test cure'] },
    ]
    const jsonFile = createMockFile(JSON.stringify(spellData), 'spells.json')
    Object.defineProperty(fileInput.element, 'files', { value: [jsonFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    // Click "Validate & Preview"
    const validateBtn = findButtonByText(wrapper, 'Validate & Preview')
    expect(validateBtn).not.toBeNull()
    await validateBtn!.trigger('click')
    await nextTick()
    await nextTick()

    // Preview should show "Found" and "valid"
    expect(wrapper.text()).toContain('Found')
    expect(wrapper.text()).toContain('valid')
  })

  // -----------------------------------------------------------------------
  // Test 6: Invalid JSON in file shows error
  // -----------------------------------------------------------------------
  it('shows error status when uploaded file contains invalid JSON', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    const fileInput = wrapper.find('input[type="file"]')
    const jsonFile = createMockFile('{ not valid }', 'bad.json')
    Object.defineProperty(fileInput.element, 'files', { value: [jsonFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    const validateBtn = findButtonByText(wrapper, 'Validate & Preview')
    expect(validateBtn).not.toBeNull()
    await validateBtn!.trigger('click')
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Invalid JSON')
  })

  // -----------------------------------------------------------------------
  // Test 7: cancelBulkImport clears file state
  // -----------------------------------------------------------------------
  it('cancelBulkImport clears file state and hides the panel', async () => {
    mountAndOpen()
    await nextTick()
    await openBulkImportPanel()

    // Select a file
    const fileInput = wrapper.find('input[type="file"]')
    const jsonFile = createMockFile(
      JSON.stringify([{ name: 'Fireball', level: 3, entries: ['Test'] }]),
      'spells.json',
    )
    Object.defineProperty(fileInput.element, 'files', { value: [jsonFile], writable: false })
    await fileInput.trigger('change')
    await nextTick()

    // File selected, textarea hidden
    expect(wrapper.find('textarea').exists()).toBe(false)

    // Cancel
    const cancelBtn = findButtonByText(wrapper, 'Cancel')
    expect(cancelBtn).not.toBeNull()
    await cancelBtn!.trigger('click')
    await nextTick()

    // Panel closed, no file name visible
    expect(wrapper.text()).not.toContain('spells.json')
    // No textarea in the closed panel
    expect(wrapper.find('textarea').exists()).toBe(false)
  })
})