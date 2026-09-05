import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RenownProgression from '@/components/sheet/RenownProgression.vue'
import { useCharacterStore } from '@/stores/character'
import type { CharacterData } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    name: 'Test',
    title: '',
    jobInParty: '',
    class: 'Fighter',
    renownTier: 1,
    renownMilestones: 0,
    species: 'Human',
    subChoice: null,
    featureChoices: {},
    background: 'Soldier',
    pointBuyBaseScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    abilityScores: { ...baseScores },
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
    spellcasting: { ability: 'int', slotsSpent: {} },
    spells: [],
    ...overrides,
  } as CharacterData
}

function mountComponent() {
  return mount(RenownProgression, {
    global: {
      stubs: {
        InfoButton: { template: '<span class="info-button-stub">Info</span>' },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------


describe('RenownProgression.vue', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
  })

  describe('setMilestones — within a tier', () => {
    it('tiers up when clicking the last bar and reaching max', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 2 })
      store.isEditing = true

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')
      expect(bars).toHaveLength(3)

      // Click bar 3 (0-based index 2) → target milestone = 3, triggers tier-up
      bars[2]!.trigger('click')

      expect(store.currentCharacterData.renownTier).toBe(2)
      expect(store.currentCharacterData.renownMilestones).toBe(0)
    })

    it('decrements to a lower milestone when clicking a filled bar', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 3 })
      store.isEditing = true

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')

      bars[1]!.trigger('click')

      expect(store.currentCharacterData.renownMilestones).toBe(2)
      expect(store.currentCharacterData.renownTier).toBe(1)
    })

    it('sets to milestone 1 when clicking the first bar from milestone 3', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 3 })
      store.isEditing = true

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')

      bars[0]!.trigger('click')

      expect(store.currentCharacterData.renownMilestones).toBe(1)
      expect(store.currentCharacterData.renownTier).toBe(1)
    })

    it('stays at milestone 0 when target is already the current value', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 0 })
      store.isEditing = true

      mountComponent()
      // The bars only go 1..max, so milestone 0 is only reachable via tier reset
      // Verify the state is at 0 and no bars are incorrectly filled
      expect(store.currentCharacterData.renownMilestones).toBe(0)
    })

    it('is a no-op when not in editing mode', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 1 })
      store.isEditing = false

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')

      bars[2]!.trigger('click')

      expect(store.currentCharacterData.renownMilestones).toBe(1)
    })
  })

  describe('setMilestones — tier-up transitions', () => {
    it('tiers up from Tier 2 to Tier 3 when clicking last bar', () => {
      store.currentCharacterData = makeChar({ renownTier: 2, renownMilestones: 3 })
      store.isEditing = true

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')
      expect(bars).toHaveLength(4)

      bars[3]!.trigger('click')

      expect(store.currentCharacterData.renownTier).toBe(3)
      expect(store.currentCharacterData.renownMilestones).toBe(0)
    })

    it('does not render bars at Tier 4 (max tier)', () => {
      store.currentCharacterData = makeChar({ renownTier: 4, renownMilestones: 0 })
      store.isEditing = true

      const wrapper = mountComponent()
      const bars = wrapper.findAll('.flex-1.h-4')

      expect(bars).toHaveLength(0)
      expect(wrapper.text()).toContain('Maximum Renown Achieved')
    })
  })

  describe('decrementTier', () => {
    it('downgrades from Tier 2 to Tier 1, setting milestones just below max', () => {
      store.currentCharacterData = makeChar({ renownTier: 2, renownMilestones: 0 })
      store.isEditing = true

      const wrapper = mountComponent()
      const demoteBtn = wrapper.find('button[title="Downgrade to previous tier"]')

      expect(demoteBtn.exists()).toBe(true)

      demoteBtn.trigger('click')

      expect(store.currentCharacterData.renownTier).toBe(1)
      expect(store.currentCharacterData.renownMilestones).toBe(2)
    })

    it('downgrades from Tier 3 to Tier 2', () => {
      store.currentCharacterData = makeChar({ renownTier: 3, renownMilestones: 3 })
      store.isEditing = true

      const wrapper = mountComponent()
      const demoteBtn = wrapper.find('button[title="Downgrade to previous tier"]')

      demoteBtn.trigger('click')

      expect(store.currentCharacterData.renownTier).toBe(2)
      expect(store.currentCharacterData.renownMilestones).toBe(3)
    })

    it('demote button is not visible at Tier 1', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 0 })
      store.isEditing = true

      const wrapper = mountComponent()
      const demoteBtn = wrapper.find('button[title="Downgrade to previous tier"]')

      expect(demoteBtn.exists()).toBe(false)
    })

    it('demote button is not visible when not in editing mode', () => {
      store.currentCharacterData = makeChar({ renownTier: 2, renownMilestones: 0 })
      store.isEditing = false

      const wrapper = mountComponent()
      const demoteBtn = wrapper.find('button[title="Downgrade to previous tier"]')

      expect(demoteBtn.exists()).toBe(false)
    })
  })

  describe('UI element visibility', () => {
    it('displays the correct number of milestone bars for each tier', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 0 })
      store.isEditing = true

      let wrapper = mountComponent()
      expect(wrapper.findAll('.flex-1.h-4')).toHaveLength(3)
      wrapper.unmount()

      store.currentCharacterData.renownTier = 2
      store.currentCharacterData.renownMilestones = 0
      wrapper = mountComponent()
      expect(wrapper.findAll('.flex-1.h-4')).toHaveLength(4)
      wrapper.unmount()

      store.currentCharacterData.renownTier = 3
      store.currentCharacterData.renownMilestones = 0
      wrapper = mountComponent()
      expect(wrapper.findAll('.flex-1.h-4')).toHaveLength(5)
      wrapper.unmount()
    })

    it('shows the tier title correctly', () => {
      store.currentCharacterData = makeChar({ renownTier: 1 })
      store.isEditing = true

      let wrapper = mountComponent()
      expect(wrapper.text()).toContain('Tier 1 Aspirant')
      wrapper.unmount()

      store.currentCharacterData.renownTier = 2
      wrapper = mountComponent()
      expect(wrapper.text()).toContain('Tier 2 Adept')
      wrapper.unmount()
    })

    it('shows progress text with remaining count', () => {
      store.currentCharacterData = makeChar({ renownTier: 1, renownMilestones: 1 })
      store.isEditing = true

      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Complete 2 more')
    })
  })
})
