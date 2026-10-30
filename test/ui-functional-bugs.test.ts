/**
 * Regression tests for UI functional bugs found in the UI/UX audit:
 * - Temp HP is persisted on combat.hp_temp
 * - Speed renders as text (no v-html)
 * - Inventory slot meter gets a real width
 * - Feature usage boxes write to feature.used
 * - Spell library search is independent of the character's spell list search
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { createBlankCharacter } from '../src/domain'
import { migrateCharacterData } from '../src/utils/characterMutations'
import { useCharacterStore } from '../src/stores/character'
import { useSpellcasting } from '../src/composables/useSpellcasting'
import CombatStats from '../src/components/sheet/CombatStats.vue'
import EquipmentBlock from '../src/components/sheet/EquipmentBlock.vue'
import FeaturesList from '../src/components/sheet/FeaturesList.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('hp_temp', () => {
  it('defaults to 0 for new and migrated characters', () => {
    expect(createBlankCharacter().combat.hp_temp).toBe(0)
    expect(migrateCharacterData({}).combat.hp_temp).toBe(0)
    const legacy = migrateCharacterData({ combat: { ac: 12, hp_max: 5, speed: '30ft' } } as any)
    expect(legacy.combat.hp_temp).toBe(0)
  })

  it('keeps an existing value through migration', () => {
    const migrated = migrateCharacterData({
      combat: { ac: 12, hp_max: 5, hp_temp: 4, speed: '30ft' },
    } as any)
    expect(migrated.combat.hp_temp).toBe(4)
  })

  it('writes the Temp input back to the character', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBlankCharacter()
    const wrapper = mount(CombatStats)
    const input = wrapper.find('input[aria-label="Temporary hit points"]')
    await input.setValue('7')
    expect(store.currentCharacterData.combat.hp_temp).toBe(7)
  })
})

describe('CombatStats speed', () => {
  it('renders speed as text without interpreting HTML', () => {
    const store = useCharacterStore()
    const character = createBlankCharacter()
    character.combat.speed = '30ft <img src=x onerror=alert(1)>'
    store.currentCharacterData = character
    const wrapper = mount(CombatStats)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })
})

describe('EquipmentBlock slot meter', () => {
  it('sets a numeric percentage width, not a literal template string', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBlankCharacter()
    const wrapper = mount(EquipmentBlock)
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('style')).toMatch(/width:\s*\d+(\.\d+)?%/)
    expect(bar.attributes('style')).not.toContain('$')
  })
})

describe('FeaturesList usage boxes', () => {
  it('toggles feature.used when a usage box is clicked', async () => {
    const store = useCharacterStore()
    const feature: any = {
      title: 'Second Wind',
      desc: 'Heal',
      uses: { total: 2, per: 'short rest' },
    }
    const character = createBlankCharacter()
    character.features = [feature]
    store.currentCharacterData = character

    const wrapper = mount(FeaturesList, {
      props: { features: store.currentCharacterData.features, editable: false },
    })
    const boxes = wrapper.findAll('[role="group"] input[type="checkbox"]')
    expect(boxes).toHaveLength(2)

    await boxes[1]!.setValue(true)
    expect(store.currentCharacterData.features[0]!.used).toBe(2)
    await nextTick()
    expect((wrapper.findAll('[role="group"] input[type="checkbox"]')[0]!.element as HTMLInputElement).checked).toBe(true)

    await wrapper.findAll('[role="group"] input[type="checkbox"]')[1]!.setValue(false)
    expect(store.currentCharacterData.features[0]!.used).toBe(1)
  })
})

describe('useSpellcasting search filters', () => {
  it('keeps the library search separate from the spell list search', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBlankCharacter()
    const { searchFilter, librarySearchFilter, clearFilters } = useSpellcasting()
    librarySearchFilter.value = 'fire'
    expect(searchFilter.value).toBe('')
    searchFilter.value = 'cure'
    clearFilters()
    expect(librarySearchFilter.value).toBe('')
    expect(searchFilter.value).toBe('cure')
  })
})
