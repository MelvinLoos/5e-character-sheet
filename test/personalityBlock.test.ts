import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import PersonalityBlock from '../src/components/sheet/PersonalityBlock.vue'
import { useCharacterStore } from '../src/stores/character'

describe('PersonalityBlock (component integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountComponent() {
    const store = useCharacterStore()
    store.currentCharacterData = {
      name: 'Test',
      title: '',
      class: null,
      level: 1,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 1, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
      jobInParty: '',
    } as any

    return mount(PersonalityBlock, {
      global: {
        stubs: {
          'material-symbols-outlined': { template: '<span class="material-symbols-outlined"></span>' },
        },
      },
    })
  }

  it('renders the Backstory heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Backstory')
  })

  it('renders the Job In The Party section', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Job In The Party')
  })

  it('renders the Lore & Identity section', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Lore & Identity')
  })

  it('applies parchment-texture class to the Backstory section', () => {
    const wrapper = mountComponent()
    const backstorySection = wrapper.findAll('section').at(1)
    expect(backstorySection?.classes()).toContain('parchment-texture')
  })

  it('uses theme-aware border class instead of hardcoded gold on Backstory section', () => {
    const wrapper = mountComponent()
    const backstorySection = wrapper.findAll('section').at(1)
    expect(backstorySection?.classes()).toContain('border-tertiary-container')
    expect(backstorySection?.classes()).not.toContain('border-[#cca72f]')
  })

  it('uses theme-aware text classes on Backstory heading instead of hardcoded near-black', () => {
    const wrapper = mountComponent()
    const headings = wrapper.findAll('h3')
    const backstoryHeading = headings.at(1)
    expect(backstoryHeading?.classes()).toContain('text-on-tertiary-fixed')
    expect(backstoryHeading?.classes()).toContain('dark:text-on-background')
    expect(backstoryHeading?.classes()).not.toContain('text-[#241a00]')
  })

  it('uses theme-aware text classes on Backstory body text instead of hardcoded near-black', () => {
    const wrapper = mountComponent()
    const bodyText = wrapper.find('section.parchment-texture p')
    expect(bodyText.classes()).toContain('text-on-tertiary-fixed')
    expect(bodyText.classes()).toContain('dark:text-on-surface')
    expect(bodyText.classes()).not.toContain('text-[#241a00]')
  })

  it('uses theme-aware icon color instead of hardcoded dark brown', () => {
    const wrapper = mountComponent()
    const backstorySection = wrapper.findAll('section').at(1)
    const icon = backstorySection?.find('.material-symbols-outlined')
    expect(icon?.classes()).toContain('text-on-tertiary-fixed-variant')
    expect(icon?.classes()).toContain('dark:text-tertiary')
    expect(icon?.classes()).not.toContain('text-[#574400]')
  })

  it('uses theme-aware corner decoration colors', () => {
    const wrapper = mountComponent()
    const corners = wrapper.findAll('.absolute')
    expect(corners.length).toBe(4)
    corners.forEach((corner) => {
      expect(corner.classes()).toContain('border-on-tertiary-fixed-variant')
      expect(corner.classes()).toContain('dark:border-tertiary-container')
      expect(corner.classes()).not.toContain('border-[#574400]')
    })
  })
})