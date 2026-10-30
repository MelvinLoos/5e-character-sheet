/**
 * Issue #163: switching class or background should remove the starting gear
 * the Starting Equipment wizard granted (and only that gear).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  applyStartingEquipment,
  removeStartingEquipment,
  hasStartingEquipment,
  migrateCharacterData,
} from '@/utils/characterMutations'
import { createBlankCharacter } from '@/domain'
import { useCharacterStore } from '@/stores/character'
import type { CharacterData } from '@/types/character'
import type { StartingEquipmentState } from '@/types/equipment'

const wizardState: StartingEquipmentState = {
  classOption: 'B',
  backgroundOption: 'A',
  resolvedClassChoices: [],
  selectedTrinket: null,
}

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    class: 'Fighter',
    background: 'Soldier',
    ...overrides,
  } as CharacterData
}

const manualGear = {
  id: 'manual-1',
  name: 'Lucky Coin',
  type: 'Misc',
  description: '',
  slotCost: 1,
}

describe('applyStartingEquipment tagging', () => {
  it('tags granted items and records starting gold and the applied flag', () => {
    const result = applyStartingEquipment(makeChar(), wizardState)
    expect(result.equippedGear.length).toBeGreaterThan(0)
    expect(result.equippedGear.every((g) => g.source === 'starting-equipment')).toBe(true)
    expect(result.startingEquipmentApplied).toBe(true)
    expect(result.startingGold).toBe(result.gold)
  })
})

describe('removeStartingEquipment', () => {
  it('removes only tagged items and keeps manual ones', () => {
    const char = makeChar({
      equippedGear: [manualGear],
      attacks: [{ name: 'Fists', dmgDie: '1', dmgBonus: 0, type: 'Bludgeoning' }],
      gold: 5,
    })
    const applied = applyStartingEquipment(char, wizardState)
    const removed = removeStartingEquipment(applied)
    expect(removed.equippedGear).toEqual([manualGear])
    expect(removed.attacks.map((a) => a.name)).toEqual(['Fists'])
    expect(removed.gold).toBe(5)
    expect(removed.startingGold).toBe(0)
    expect(removed.startingEquipmentApplied).toBe(false)
  })

  it('never takes gold below zero', () => {
    const removed = removeStartingEquipment(
      makeChar({ gold: 2, startingGold: 50, startingEquipmentApplied: true }),
    )
    expect(removed.gold).toBe(0)
  })

  it('removes the Spellcasting Focus feature granted by starting equipment', () => {
    const char = makeChar({
      features: [
        {
          title: 'Spellcasting Focus',
          desc: '',
          source: 'Starting Equipment',
        } as CharacterData['features'][number],
      ],
    })
    const removed = removeStartingEquipment(char)
    expect(removed.features.some((f) => f.title === 'Spellcasting Focus')).toBe(false)
  })
})

describe('hasStartingEquipment', () => {
  it('is false for a blank character and true after the wizard is applied', () => {
    expect(hasStartingEquipment(makeChar())).toBe(false)
    expect(hasStartingEquipment(applyStartingEquipment(makeChar(), wizardState))).toBe(true)
  })

  it('ignores manually added gear', () => {
    expect(hasStartingEquipment(makeChar({ equippedGear: [manualGear] }))).toBe(false)
  })
})

describe('migrateCharacterData startingEquipmentApplied', () => {
  it('is true for legacy characters that already have gear', () => {
    const result = migrateCharacterData({ equippedGear: [manualGear] })
    expect(result.startingEquipmentApplied).toBe(true)
  })

  it('is false for legacy characters with no gear, consumables or gold', () => {
    expect(migrateCharacterData({}).startingEquipmentApplied).toBe(false)
  })
})

describe('character store class/background switch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setup() {
    const store = useCharacterStore()
    store.currentCharacterData.class = 'Fighter'
    store.currentCharacterData.background = 'Soldier'
    store.currentCharacterData.equippedGear = [manualGear]
    store.selectClassEquipmentOption('B')
    store.selectBackgroundEquipmentOption('A')
    store.confirmStartingEquipment()
    return store
  }

  it('removes starting gear but keeps manual gear when the class changes', () => {
    const store = setup()
    expect(hasStartingEquipment(store.currentCharacterData)).toBe(true)
    store.applyClassChange('Wizard')
    expect(hasStartingEquipment(store.currentCharacterData)).toBe(false)
    expect(store.currentCharacterData.equippedGear).toEqual([manualGear])
    expect(store.currentCharacterData.startingEquipmentApplied).toBe(false)
    expect(store.startingEquipmentState.classOption).toBeNull()
  })

  it('removes starting gear when the background changes', () => {
    const store = setup()
    store.applyBackgroundChange('Acolyte')
    expect(hasStartingEquipment(store.currentCharacterData)).toBe(false)
    expect(store.currentCharacterData.equippedGear).toEqual([manualGear])
  })

  it('does nothing when the same class is selected again', () => {
    const store = setup()
    const before = store.currentCharacterData.equippedGear.length
    store.applyClassChange('Fighter')
    expect(store.currentCharacterData.equippedGear.length).toBe(before)
    expect(store.currentCharacterData.startingEquipmentApplied).toBe(true)
  })
})

describe('SheetHeader class change confirmation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  async function mountHeader() {
    const { mount } = await import('@vue/test-utils')
    const SheetHeader = (await import('@/components/sheet/SheetHeader.vue')).default
    const store = useCharacterStore()
    store.currentCharacterData.class = 'Fighter'
    store.currentCharacterData.background = 'Soldier'
    store.selectClassEquipmentOption('B')
    store.selectBackgroundEquipmentOption('A')
    store.confirmStartingEquipment()
    store.isEditing = true
    const wrapper = mount(SheetHeader)
    return { store, wrapper }
  }

  it('keeps class and gear when the player cancels the confirm', async () => {
    const { flushPromises } = await import('@vue/test-utils')
    const { useConfirm } = await import('@/composables/useConfirm')
    const { store, wrapper } = await mountHeader()
    const select = wrapper.findAll('select')[1]!
    await select.setValue('Wizard')
    const { state, settle } = useConfirm()
    expect(state.open).toBe(true)
    settle(false)
    await flushPromises()
    expect(store.currentCharacterData.class).toBe('Fighter')
    expect((select.element as HTMLSelectElement).value).toBe('Fighter')
    expect(hasStartingEquipment(store.currentCharacterData)).toBe(true)
  })

  it('removes starting gear when the player accepts the confirm', async () => {
    const { flushPromises } = await import('@vue/test-utils')
    const { useConfirm } = await import('@/composables/useConfirm')
    const { store, wrapper } = await mountHeader()
    await wrapper.findAll('select')[1]!.setValue('Wizard')
    useConfirm().settle(true)
    await flushPromises()
    expect(store.currentCharacterData.class).toBe('Wizard')
    expect(hasStartingEquipment(store.currentCharacterData)).toBe(false)
  })
})
