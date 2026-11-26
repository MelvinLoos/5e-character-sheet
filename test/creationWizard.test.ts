import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CharacterCreationWizard from '@/components/creation/CharacterCreationWizard.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useCharacterStore } from '@/stores/character'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: {} }) }))

function mountWizard() {
  return mount(CharacterCreationWizard, {
    global: { components: { PressableButton, IconButton } },
  })
}
const next = (w: ReturnType<typeof mountWizard>) =>
  w.findAllComponents(PressableButton).find((b) => b.text() === 'Next')!

describe('CharacterCreationWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useCharacterStore().handleNewCharacter()
  })

  it('starts as a new character in creation mode', () => {
    expect(useCharacterStore().isCreating).toBe(true)
  })

  it('previews options and blocks Next until one is chosen', async () => {
    const w = mountWizard()
    expect(w.findAll('input[type="radio"]').length).toBeGreaterThan(5)
    expect(next(w).attributes('disabled')).toBeDefined()
    await w.find('input[type="radio"]').setValue(true)
    await w.find('input[type="radio"]').trigger('change')
    // species with sub-choices still require one; others advance
    expect(w.text()).toContain('Step 1 of')
  })

  it('walks species, class and background then shows point-buy cost hints', async () => {
    const w = mountWizard()
    for (const v of ['Human', 'Fighter', 'champion', 'Acolyte']) {
      await w.findAll('input[type="radio"]').find((r) => r.attributes('value') === v)!.trigger('change')
      await flushPromises()
      await next(w).trigger('click')
    }
    expect(w.text()).toContain('Set your ability scores')
    expect(w.text()).toContain('Next point costs 1')
    expect(w.text()).toContain('27 of 27 points left')
  })

  it('skipping the guide leaves creation mode', async () => {
    const w = mountWizard()
    await w.findAll('button').find((b) => b.text() === 'Skip the guide')!.trigger('click')
    expect(useCharacterStore().isCreating).toBe(false)
  })
})

describe('subclass step', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useCharacterStore().handleNewCharacter()
  })
  const pick = async (w: ReturnType<typeof mountWizard>, v: string) => {
    await w.findAll('input[type="radio"]').find((r) => r.attributes('value') === v)!.trigger('change')
    await flushPromises()
  }

  it('adds a subclass step after class and blocks Next until one is chosen', async () => {
    const w = mountWizard()
    await pick(w, 'Human')
    await next(w).trigger('click')
    await pick(w, 'Fighter')
    await next(w).trigger('click')
    expect(w.text()).toContain('Choose your Martial Archetype')
    expect(next(w).attributes('disabled')).toBeDefined()
    await pick(w, 'champion')
    expect(useCharacterStore().currentCharacterData.featureChoices['fighter-subclass']).toEqual(['champion'])
    expect(next(w).attributes('disabled')).toBeUndefined()
  })

  it('renders Back and Next in two labelled landmarks', () => {
    const w = mountWizard()
    expect(w.find('nav[aria-label="Wizard steps (top)"]').exists()).toBe(true)
    expect(w.find('nav[aria-label="Wizard steps (bottom)"]').exists()).toBe(true)
    expect(w.findAllComponents(PressableButton).filter((b) => b.text() === 'Next')).toHaveLength(2)
  })
})

describe('reopening the guide', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    const s = useCharacterStore()
    s.handleNewCharacter()
    s.applySpeciesChange('Human')
    s.applyClassChange('Fighter')
    s.applyBackgroundChange('Acolyte')
    s.finishCreation()
  })

  it('prefills every pick so Next is enabled on the first step', () => {
    useCharacterStore().openCreationGuide()
    const w = mountWizard()
    expect(next(w).attributes('disabled')).toBeUndefined()
    expect(w.find('input[value="Human"]').element).toHaveProperty('checked', true)
  })

  it('cancel restores the character untouched', async () => {
    const s = useCharacterStore()
    s.openCreationGuide()
    s.applyBackgroundChange('Sage')
    s.currentCharacterData.name = 'Changed'
    s.cancelCreationGuide()
    expect(s.currentCharacterData.background).toBe('Acolyte')
    expect(s.currentCharacterData.name).not.toBe('Changed')
    expect(s.isCreating).toBe(false)
    expect(s.isEditing).toBe(false)
  })

  it('finish keeps the changes and restores the previous edit state', () => {
    const s = useCharacterStore()
    s.openCreationGuide()
    s.applyBackgroundChange('Sage')
    s.finishCreation()
    expect(s.currentCharacterData.background).toBe('Sage')
    expect(s.isCreating).toBe(false)
    expect(s.isEditing).toBe(false)
    expect(s.isReopening).toBe(false)
  })

  it('changing class clears the old class feature choices', () => {
    const s = useCharacterStore()
    s.applyFeatureChoice('fighter-subclass', ['champion'])
    s.applyClassChange('Wizard')
    expect(s.currentCharacterData.featureChoices).toEqual({})
  })
})

describe('option visuals', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useCharacterStore().handleNewCharacter()
  })

  it('renders emblems for species and classes, a monogram for backgrounds', async () => {
    const w = mountWizard()
    const first = w.find('[data-testid="option-visual"]')
    expect(first.find('svg').exists()).toBe(true) // Human has an emblem
    expect(first.attributes('aria-hidden')).toBe('true')
    await w.findAll('input[type="radio"]').find((r) => r.attributes('value') === 'Human')!.trigger('change')
    await flushPromises()
    await next(w).trigger('click')
    expect(w.find('[data-testid="option-visual"] svg').exists()).toBe(true)
    for (const v of ['Fighter', 'champion']) {
      await w.findAll('input[type="radio"]').find((r) => r.attributes('value') === v)!.trigger('change')
      await flushPromises()
      await next(w).trigger('click')
    }
    expect(w.find('[data-testid="option-visual"] [data-visual="monogram"]').exists()).toBe(true)
  })
})
