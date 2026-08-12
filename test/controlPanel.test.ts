import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import ControlPanel from '../src/components/ControlPanel.vue'
import { useCharacterStore } from '../src/stores/character'
import { useFeedbackStore } from '../src/stores/feedbackStore'

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      setSession: vi.fn(),
    },
  })),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {}, name: undefined, fullPath: '/' })),
}))

// Stub GuildSelector to avoid onMounted side-effects (API calls)
vi.mock('../src/components/GuildSelector.vue', () => ({
  default: defineComponent({
    name: 'GuildSelector',
    template: '<div class="guild-selector-mock">GuildSelector Mock</div>',
  }),
}))

// Stub AuthButton to avoid supabase-related side-effects
vi.mock('../src/components/AuthButton.vue', () => ({
  default: defineComponent({
    name: 'AuthButton',
    template: '<div class="auth-button-mock">AuthButton Mock</div>',
  }),
}))

// Stub GuildManagementModal to avoid complex modal rendering in tests
vi.mock('../src/components/modals/GuildManagementModal.vue', () => ({
  default: defineComponent({
    name: 'GuildManagementModal',
    props: { isOpen: Boolean },
    emits: ['close'],
    template: '<div v-if="isOpen" class="guild-management-modal-mock">GuildManagementModal Mock</div>',
  }),
}))

// Mock idb-keyval used by guildStore
vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}))

// Mock fetch for guildStore API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }),
) as unknown as typeof fetch

describe('ControlPanel feedback entry point', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountWithCharacter() {
    const store = useCharacterStore()
    store.currentCharacterData = {
      name: 'Tordek',
      title: '',
      jobInParty: '',
      class: null,
      renownTier: 1,
      renownMilestones: 0,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 10, hp_current: 10, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      gold: 0,
      supply: 0,
      influence: 0,
      inventorySlots: 10,
      equippedGear: [],
      consumables: [],
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as never

    return mount(ControlPanel, {
      attachTo: document.body,
    })
  }

  function bodyText(): string {
    return document.body.textContent ?? ''
  }

  async function openMorePopover() {
    const moreButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('More'),
    )
    expect(moreButton).toBeDefined()
    ;(moreButton as HTMLButtonElement).click()
    await nextTick()
  }

  it('renders the Give Feedback menu item when the feedback service is available', async () => {
    const feedbackStore = useFeedbackStore()
    feedbackStore.availability = 'available'

    mountWithCharacter()
    await openMorePopover()

    expect(bodyText()).toContain('Give Feedback')
  })

  it('hides the Give Feedback menu item when the feedback service is unavailable', async () => {
    const feedbackStore = useFeedbackStore()
    feedbackStore.availability = 'unavailable'

    mountWithCharacter()
    await openMorePopover()

    expect(bodyText()).not.toContain('Give Feedback')
    // The rest of the popover still renders.
    expect(bodyText()).toContain('Import Data')
  })

  it('hides the Give Feedback menu item while availability is unknown', async () => {
    const feedbackStore = useFeedbackStore()
    feedbackStore.availability = 'unknown'

    mountWithCharacter()
    await openMorePopover()

    expect(bodyText()).not.toContain('Give Feedback')
  })
})
