import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SubChoiceModal from '@/components/modals/SubChoiceModal.vue'
import * as DND_RULES from '@/data/rules'
import type { SubChoice } from '@/types/rules'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Use a known species with subChoices for all tests
const SPECIES_WITH_SUBCHOICES = 'Tiefling'

function mockSubChoices(): SubChoice[] {
  const speciesData = DND_RULES.SPECIES[SPECIES_WITH_SUBCHOICES]
  return speciesData?.subChoices ?? []
}

function createWrapper(
  props: {
    isOpen?: boolean
    speciesKey?: string
    currentSubChoice?: string | null
  } = {},
) {
  return mount(SubChoiceModal, {
    props: {
      isOpen: true,
      speciesKey: SPECIES_WITH_SUBCHOICES,
      currentSubChoice: null,
      ...props,
    },
    global: {
      plugins: [createPinia()],
    },
  })
}

// ---------------------------------------------------------------------------
// SubChoiceModal component tests
// ---------------------------------------------------------------------------

describe('SubChoiceModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const wrapper = createWrapper({ isOpen: false })
      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('renders the modal backdrop and content when isOpen is true', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.modal-backdrop').exists()).toBe(true)
      expect(wrapper.find('.modal-content').exists()).toBe(true)
    })

    it('renders all sub-choice options for the species', () => {
      const wrapper = createWrapper()
      const options = mockSubChoices()
      const optionCards = wrapper.findAll('[data-test="subchoice-option"]')
      expect(optionCards).toHaveLength(options.length)
    })

    it('displays each option label', () => {
      const wrapper = createWrapper()
      const options = mockSubChoices()
      for (const option of options) {
        expect(wrapper.text()).toContain(option.label)
      }
    })

    it('displays each option description when present', () => {
      const wrapper = createWrapper()
      const options = mockSubChoices()
      const withDesc = options.filter((o) => o.description)
      for (const option of withDesc) {
        expect(wrapper.text()).toContain(option.description!)
      }
    })
  })

  describe('selection', () => {
    it('emits "select" with the subChoice id when an option is clicked', async () => {
      const wrapper = createWrapper()
      const options = mockSubChoices()
      const firstOption = wrapper.findAll('[data-test="subchoice-option"]')[0]
      await firstOption.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([options[0].id])
    })

    it('visually highlights the currently selected subChoice', () => {
      const options = mockSubChoices()
      const selectedId = options[1]?.id ?? options[0].id
      const wrapper = createWrapper({ currentSubChoice: selectedId })
      const selectedCard = wrapper.find(`[data-test="subchoice-option"][data-id="${selectedId}"]`)
      expect(selectedCard.exists()).toBe(true)
      expect(selectedCard.classes()).toContain('selected')
    })
  })

  describe('close behavior', () => {
    it('emits "close" when the close (X) button is clicked', async () => {
      const wrapper = createWrapper()
      const closeBtn = wrapper.find('[data-test="modal-close-btn"]')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits "close" when the backdrop is clicked', async () => {
      const wrapper = createWrapper()
      const backdrop = wrapper.find('.modal-backdrop')
      await backdrop.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does NOT emit "close" when clicking inside the modal content', async () => {
      const wrapper = createWrapper()
      const content = wrapper.find('.modal-content')
      await content.trigger('click')
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('edge cases', () => {
    it('renders nothing when speciesKey is empty', () => {
      const wrapper = createWrapper({ speciesKey: '' })
      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('renders nothing when species has no subChoices', () => {
      // Human has no subChoices
      const wrapper = createWrapper({ speciesKey: 'Human' })
      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('renders nothing when speciesKey is invalid', () => {
      const wrapper = createWrapper({ speciesKey: 'NonExistentSpecies' })
      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('does not crash when currentSubChoice does not match any option', () => {
      const wrapper = createWrapper({ currentSubChoice: 'nonexistent-id' })
      expect(wrapper.find('.modal-backdrop').exists()).toBe(true)
      // No option should have the 'selected' class
      const selectedCards = wrapper.findAll('.selected')
      expect(selectedCards).toHaveLength(0)
    })
  })
})