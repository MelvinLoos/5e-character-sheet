/**
 * Phase 5 of the UI/UX audit: mobile shell, touch targets and non-drag reordering.
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { createBlankCharacter } from '../src/domain'
import { useCharacterStore } from '../src/stores/character'
import { moveItem } from '../src/utils/listMove'
import ReorderControls from '../src/components/ui/ReorderControls.vue'
import MobileHeader from '../src/components/MobileHeader.vue'
import RenownProgression from '../src/components/sheet/RenownProgression.vue'
import SkillsList from '../src/components/sheet/SkillsList.vue'
import SavingThrows from '../src/components/sheet/SavingThrows.vue'
import AttacksList from '../src/components/sheet/AttacksList.vue'
import router from '../src/router'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('moveItem', () => {
  it('moves an item and clamps to the list bounds without mutating the input', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveItem(list, 0, -5)).toEqual(['a', 'b', 'c'])
    expect(moveItem(list, 2, 99)).toEqual(['a', 'b', 'c'])
    expect(moveItem(list, 7, 0)).toEqual(['a', 'b', 'c'])
    expect(list).toEqual(['a', 'b', 'c'])
  })
})

describe('ReorderControls', () => {
  it('labels both buttons and disables them at the ends', async () => {
    const first = mount(ReorderControls, { props: { index: 0, count: 3, label: 'Fireball' } })
    const [up, down] = first.findAll('button')
    expect(up!.attributes('aria-label')).toBe('Move Fireball up')
    expect(up!.attributes('disabled')).toBeDefined()
    expect(down!.attributes('disabled')).toBeUndefined()
    await down!.trigger('click')
    expect(first.emitted('move')?.[0]).toEqual([1])

    const last = mount(ReorderControls, { props: { index: 2, count: 3, label: 'x' } })
    expect(last.findAll('button')[1]!.attributes('disabled')).toBeDefined()
  })
})

describe('MobileHeader', () => {
  it('offers a menu entry point when no character is loaded', async () => {
    useCharacterStore().currentCharacterData = null as never
    const wrapper = mount(MobileHeader)
    const menu = wrapper.find('button[aria-label="Open menu"]')
    expect(menu.exists()).toBe(true)
    await menu.trigger('click')
    expect(wrapper.emitted('showMore')).toHaveLength(1)
  })

  it('shows the edit toggle (with pressed state) once a character is loaded', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBlankCharacter()
    const wrapper = mount(MobileHeader)
    expect(wrapper.find('button[aria-label="Open menu"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-pressed]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label^="Switch to"]').exists()).toBe(true)
  })
})

describe('standalone routes', () => {
  it('marks Terms and Privacy as renderable without a character', () => {
    for (const name of ['terms', 'privacy']) {
      expect(router.getRoutes().find((r) => r.name === name)?.meta.standalone).toBe(true)
    }
  })
})

describe('touch targets and names', () => {
  it('renders renown milestones as named buttons with pressed state', () => {
    const store = useCharacterStore()
    store.currentCharacterData = { ...createBlankCharacter(), renownMilestones: 1 }
    store.isEditing = true
    const wrapper = mount(RenownProgression)
    const pips = wrapper.findAll('button[aria-label^="Milestone"]')
    expect(pips.length).toBeGreaterThan(1)
    expect(pips[0]!.attributes('aria-pressed')).toBe('true')
    expect(pips[1]!.attributes('aria-pressed')).toBe('false')
  })

  it('gives every skill and saving-throw toggle an accessible name', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBlankCharacter()
    const skills = mount(SkillsList)
    expect(skills.find('input[aria-label="Acrobatics proficiency"]').exists()).toBe(true)
    const saves = mount(SavingThrows)
    const named = saves.findAll('input[type="checkbox"]').filter((i) =>
      /saving throw proficiency$/.test(i.attributes('aria-label') ?? ''),
    )
    expect(named).toHaveLength(6)
  })

  it('keeps no text below 12px outside the print sheet', () => {
    const files = [
      'src/components/sheet/SkillsList.vue',
      'src/components/sheet/SavingThrows.vue',
      'src/components/sheet/RenownProgression.vue',
      'src/components/sheet/SpellcastingBlock.vue',
    ]
    for (const f of files) expect(readFileSync(f, 'utf8')).not.toMatch(/text-\[(8|9|10|11)px\]/)
  })

  it('reveals secondary actions on hover only for fine pointers', () => {
    const css = readFileSync('src/assets/main.css', 'utf8')
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.reveal-on-hover/)
    expect(readFileSync('src/views/Feats.vue', 'utf8')).not.toContain('opacity-0 group-hover:opacity-100')
  })
})

describe('AttacksList reordering', () => {
  it('moves an attack down without dragging', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = {
      ...createBlankCharacter(),
      attacks: [
        { id: 'a', name: 'Sword', atkStat: 'str', dmgDie: '1d8', dmgStat: 'str', type: 'slashing' },
        { id: 'b', name: 'Bow', atkStat: 'dex', dmgDie: '1d6', dmgStat: 'dex', type: 'piercing' },
      ],
    } as never
    store.isEditing = true
    const wrapper = mount(AttacksList)
    await wrapper.get('button[aria-label="Move Sword down"]').trigger('click')
    expect(store.currentCharacterData.attacks.map((a: { name: string }) => a.name)).toEqual([
      'Bow',
      'Sword',
    ])
  })
})
