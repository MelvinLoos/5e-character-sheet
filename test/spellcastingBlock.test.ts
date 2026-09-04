import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import SpellcastingBlock from '@/components/sheet/SpellcastingBlock.vue'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterSpell } from '@/types/character'

// ---------------------------------------------------------------------------
// jsdom does not perform layout, so scrollHeight/clientHeight are always 0.
// Mock them so that "long" texts overflow the fixed 40px clientHeight.
// ---------------------------------------------------------------------------

beforeEach(() => {
  setActivePinia(createPinia())
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent?.length ?? 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return 40
    },
  })
})

afterEach(() => {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
})

const LONG_DESC =
  'You touch a willing creature who is not wearing armor, and a protective ' +
  'magical force surrounds it until the spell ends. The target base AC ' +
  'becomes 13 + its Dexterity modifier. The spell ends if the target dons ' +
  'armor or if you dismiss it as an action.'

function createWizardCharacter(spells: CharacterSpell[]): CharacterData {
  return {
    ...createBlankCharacter(),
    class: 'Wizard',
    level: 1,
    renownTier: 1,
    profBonus: 2,
    spellcasting: { ability: 'int', slotsSpent: {} },
    spells,
    features: [
      {
        title: 'Wizard Spellcasting',
        desc: 'You can cast wizard spells.',
        casterType: 'full',
        key: true,
      },
    ],
  } as unknown as CharacterData
}

async function mountBlock() {
  const wrapper = mount(SpellcastingBlock, {
    global: {
      stubs: {
        'material-symbols-outlined': {
          template: '<span class="material-symbols-outlined"></span>',
        },
      },
    },
  })
  // ExpandableText measures overflow in onMounted; flush the resulting render.
  await nextTick()
  return wrapper
}

/** Finds the paragraph element that renders the given text. */
function findDescription(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('p').find((p) => p.text() === text)
}

describe('SpellcastingBlock spell descriptions (#212)', () => {
  it('shows a "Show more" toggle on spells whose description overflows', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = createWizardCharacter([
      { id: 'long', name: 'Mage Armor', level: 1, desc: LONG_DESC, prepared: false },
      { id: 'short', name: 'Fire Bolt', level: 0, desc: 'Short boom.', prepared: false },
    ])

    const wrapper = await mountBlock()
    const toggleButtons = wrapper.findAll('button').filter((b) => b.text() === 'Show more')

    expect(toggleButtons).toHaveLength(1)
    expect(findDescription(wrapper, LONG_DESC)?.attributes('style')).toContain(
      '-webkit-line-clamp: 4',
    )
    expect(findDescription(wrapper, 'Short boom.')?.attributes('style')).toBeUndefined()
  })

  it('reveals the full description when "Show more" is clicked', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = createWizardCharacter([
      { id: 'long', name: 'Mage Armor', level: 1, desc: LONG_DESC, prepared: false },
    ])

    const wrapper = await mountBlock()
    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Show more')
    expect(toggle).toBeDefined()

    await toggle!.trigger('click')

    expect(toggle!.text()).toBe('Show less')
    expect(toggle!.attributes('aria-expanded')).toBe('true')
    expect(findDescription(wrapper, LONG_DESC)?.attributes('style') ?? '').not.toContain(
      '-webkit-line-clamp',
    )
  })

  it('re-applies the clamp when "Show less" is clicked', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = createWizardCharacter([
      { id: 'long', name: 'Mage Armor', level: 1, desc: LONG_DESC, prepared: false },
    ])

    const wrapper = await mountBlock()
    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Show more')!

    await toggle.trigger('click')
    await toggle.trigger('click')

    expect(findDescription(wrapper, LONG_DESC)?.attributes('style')).toContain(
      '-webkit-line-clamp: 4',
    )
    expect(toggle.text()).toBe('Show more')
  })

  it('offers an expandable 2-line description in the Spell Library modal', async () => {
    const store = useCharacterStore()
    const rulesStore = useRulesStore()
    store.currentCharacterData = createWizardCharacter([
      { id: 'long', name: 'Mage Armor', level: 1, desc: LONG_DESC, prepared: false },
    ])
    rulesStore.$patch({
      baseSpells: [
        { name: 'Library Cantrip', level: 0, desc: LONG_DESC, classes: ['Wizard'] },
      ],
    })
    store.isEditing = true

    const wrapper = await mountBlock()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Add Spell'))!
      .trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Spell Library')
    expect(wrapper.text()).toContain('Library Cantrip')

    const libraryDescriptions = wrapper
      .findAll('p')
      .filter((p) => p.text() === LONG_DESC)
      .filter((p) => p.attributes('style')?.includes('-webkit-line-clamp: 2'))
    expect(libraryDescriptions.length).toBeGreaterThanOrEqual(1)
  })
})
