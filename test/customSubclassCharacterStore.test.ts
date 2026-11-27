import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'
import { useRulesStore } from '../src/stores/rulesStore'
import { setCustomSubclassSource } from '../src/domain/customSubclasses'
import { nextTick } from 'vue'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn() }))

const OPTION = 'custom-fighter-blade-dancer'
const bladeDancer = {
  name: 'Blade Dancer',
  parentClass: 'Fighter',
  features: [{ name: 'Opening Flourish', level: 3, description: 'First.' }],
}

describe('character store reacts to custom subclasses', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setCustomSubclassSource(() => useRulesStore().allSubclasses)
  })

  it('adds a picked custom subclass trait when content arrives and keeps it if content goes away', async () => {
    const character = useCharacterStore()
    const rules = useRulesStore()
    character.hasCharacter = true
    character.currentCharacterData.class = 'Fighter'
    character.currentCharacterData.renownTier = 1
    character.currentCharacterData.featureChoices = { 'fighter-subclass': [OPTION] }
    const has = () =>
      character.currentCharacterData.features.some((f) => f.title === 'Opening Flourish')

    expect(has()).toBe(false)

    rules.injectGuildSubclasses([bladeDancer])
    await nextTick()
    expect(has()).toBe(true)

    // Logging out or an offline sync strips guild content; the character must
    // not lose features it already has.
    rules.stripGuildContent()
    await nextTick()
    expect(has()).toBe(true)
  })

  it('applyFeatureChoice accepts a registered custom option', () => {
    const character = useCharacterStore()
    const rules = useRulesStore()
    character.currentCharacterData.class = 'Fighter'
    character.currentCharacterData.renownTier = 1
    rules.injectGuildSubclasses([bladeDancer])

    character.applyFeatureChoice('fighter-subclass', [OPTION])

    expect(character.currentCharacterData.featureChoices?.['fighter-subclass']).toEqual([OPTION])
    expect(character.currentCharacterData.features.some((f) => f.title === 'Opening Flourish')).toBe(true)
  })

  it('leaves the blank placeholder character alone until one is started', async () => {
    const character = useCharacterStore()
    const rules = useRulesStore()
    const before = character.currentCharacterData

    rules.injectGuildSubclasses([bladeDancer])
    await nextTick()

    expect(character.hasCharacter).toBe(false)
    expect(character.currentCharacterData).toBe(before)
  })
})
