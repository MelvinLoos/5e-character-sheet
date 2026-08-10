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

/**
 * Query the document body for teleported modal elements.
 * <Teleport to="body"> moves content outside the mount wrapper,
 * so we must search document.body directly.
 */
function backdrop() {
  return document.body.querySelector('.modal-backdrop') as HTMLElement | null
}

function content() {
  return document.body.querySelector('.modal-content') as HTMLElement | null
}

function options() {
  return document.body.querySelectorAll(
    '[data-test="subchoice-option"]',
  ) as NodeListOf<HTMLElement>
}

function optionById(id: string) {
  return document.body.querySelector(
    `[data-test="subchoice-option"][data-id="${id}"]`,
  ) as HTMLElement | null
}

function closeBtn() {
  return document.body.querySelector(
    '[data-test="modal-close-btn"]',
  ) as HTMLElement | null
}

function selectedCards() {
  return document.body.querySelectorAll('.selected') as NodeListOf<HTMLElement>
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
    // Clean up any leftover teleported content between tests
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      createWrapper({ isOpen: false })
      expect(backdrop()).toBeNull()
    })

    it('renders the modal backdrop and content when isOpen is true', () => {
      createWrapper()
      expect(backdrop()).not.toBeNull()
      expect(content()).not.toBeNull()
    })

    it('renders all sub-choice options for the species', () => {
      createWrapper()
      const expectedCount = mockSubChoices().length
      expect(options()).toHaveLength(expectedCount)
    })

    it('displays each option label', () => {
      createWrapper()
      const text = document.body.textContent || ''
      for (const opt of mockSubChoices()) {
        expect(text).toContain(opt.label)
      }
    })

    it('displays each option description when present', () => {
      createWrapper()
      const text = document.body.textContent || ''
      const descriptions = mockSubChoices()
        .filter((opt) => opt.description)
        .map((opt) => opt.description!)
      expect(descriptions.length).toBeGreaterThan(0)
      for (const desc of descriptions) {
        expect(text).toContain(desc)
      }
    })
  })

  describe('selection', () => {
    it('emits "select" with the subChoice id when an option is clicked', async () => {
      const wrapper = createWrapper()
      const expectedOptions = mockSubChoices()
      const firstOption = options()[0]
      firstOption.click()

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([expectedOptions[0].id])
    })

    it('visually highlights the currently selected subChoice', () => {
      const expectedOptions = mockSubChoices()
      const selectedId = expectedOptions[1]?.id ?? expectedOptions[0].id
      createWrapper({ currentSubChoice: selectedId })
      const card = optionById(selectedId)
      expect(card).not.toBeNull()
      expect(card!.classList.contains('selected')).toBe(true)
    })
  })

  describe('close behavior', () => {
    it('emits "close" when the close (X) button is clicked', async () => {
      const wrapper = createWrapper()
      const btn = closeBtn()
      expect(btn).not.toBeNull()
      btn!.click()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits "close" when the backdrop is clicked', async () => {
      const wrapper = createWrapper()
      const bg = backdrop()
      bg!.click()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does NOT emit "close" when clicking inside the modal content', async () => {
      const wrapper = createWrapper()
      const ct = content()
      ct!.click()
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('edge cases', () => {
    it('renders nothing when speciesKey is empty', () => {
      createWrapper({ speciesKey: '' })
      expect(backdrop()).toBeNull()
    })

    it('renders nothing when species has no subChoices', () => {
      // Human has no subChoices
      createWrapper({ speciesKey: 'Human' })
      expect(backdrop()).toBeNull()
    })

    it('renders nothing when speciesKey is invalid', () => {
      createWrapper({ speciesKey: 'NonExistentSpecies' })
      expect(backdrop()).toBeNull()
    })

    it('does not crash when currentSubChoice does not match any option', () => {
      createWrapper({ currentSubChoice: 'nonexistent-id' })
      expect(backdrop()).not.toBeNull()
      // No option should have the 'selected' class
      expect(selectedCards().length).toBe(0)
    })
  })
})