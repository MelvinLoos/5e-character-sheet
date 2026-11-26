import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
    for (let i = 0; i < 3; i++) {
      await w.findAll('input[type="radio"]').find((r) => r.attributes('value') === ['Human', 'Fighter', 'Acolyte'][i])!.trigger('change')
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
