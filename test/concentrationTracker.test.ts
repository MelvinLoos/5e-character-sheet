import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import ConcentrationTracker from '../src/components/sheet/ConcentrationTracker.vue'
import { useCharacterStore } from '../src/stores/character'
import { useSpellStore } from '../src/stores/spellStore'

function setupCaster() {
  setActivePinia(createPinia())
  const character = useCharacterStore()
  const spells = useSpellStore()
  character.currentCharacterData.spellcasting = { ability: 'int' }
  character.currentCharacterData.spells = [
    { id: 'bless', name: 'Bless', level: 1, desc: '', concentration: true },
    { id: 'fireball', name: 'Fireball', level: 3, desc: '' },
  ]
  character.currentCharacterData.combat.hp_current = 20
  return { character, spells }
}

describe('ConcentrationTracker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nothing when there is nothing to concentrate on', () => {
    const character = useCharacterStore()
    character.currentCharacterData.spells = []
    const wrapper = mount(ConcentrationTracker)
    expect(wrapper.find('[data-testid="concentration-tracker"]').exists()).toBe(false)
  })

  it('lists only concentration spells in the picker', () => {
    setupCaster()
    const wrapper = mount(ConcentrationTracker)
    const options = wrapper
      .findAll('[data-testid="concentration-select"] option')
      .map((o) => o.text())
    expect(options).toEqual(['Choose a spell…', 'Bless (L1)'])
  })

  it('starts concentration from the picker and shows the banner', async () => {
    const { spells } = setupCaster()
    const wrapper = mount(ConcentrationTracker)

    await wrapper.find('[data-testid="concentration-select"]').setValue('bless')
    await wrapper.find('[data-testid="concentration-start"]').trigger('click')
    await nextTick()

    expect(spells.activeConcentration?.spellName).toBe('Bless')
    expect(wrapper.find('[data-testid="concentration-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="concentration-name"]').text()).toBe('Bless')
  })

  it('ends concentration from the banner', async () => {
    const { spells } = setupCaster()
    spells.startConcentration(spells.concentrationSpells[0]!)
    const wrapper = mount(ConcentrationTracker)
    await nextTick()

    await wrapper.find('[data-testid="concentration-end"]').trigger('click')
    await nextTick()

    expect(spells.activeConcentration).toBeNull()
    expect(wrapper.find('[data-testid="concentration-banner"]').exists()).toBe(false)
  })

  it('surfaces the CON save reminder after damage', async () => {
    const { spells } = setupCaster()
    spells.startConcentration(spells.concentrationSpells[0]!)
    spells.noteConcentrationDamage(24)
    const wrapper = mount(ConcentrationTracker)
    await nextTick()

    expect(wrapper.find('[data-testid="concentration-dc-value"]').text()).toBe('12')
  })
})
