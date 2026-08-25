import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { createBlankCharacter } from '@/domain'
import type { CharacterData } from '@/types/character'

function makeCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    ...overrides,
  } as CharacterData
}

describe('useCharacterCompletion', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
  })

  describe('identity (unspent point-buy points)', () => {
    it('shows a count equal to the unspent points', () => {
      store.currentCharacterData = makeCharacter({
        pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.identity).toEqual({ type: 'count', count: 27, label: '27 ability points remaining' })
    })

    it('hides the identity badge when all points are spent', () => {
      store.currentCharacterData = makeCharacter({
        pointBuyBaseScores: { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 },
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.identity).toBeUndefined()
    })
  })

  describe('skills (remaining class skill choices)', () => {
    it('shows a count when class skill choices remain', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: null,
        proficiencies: { skills: [], savingThrows: [] },
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.skills).toEqual({ type: 'count', count: 2, label: '2 skill choices remaining' })
    })

    it('hides the skills badge when all choices are made', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: null,
        proficiencies: {
          skills: ['athletics', 'perception'],
          savingThrows: [],
        },
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.skills).toBeUndefined()
    })

    it('hides the skills badge when no class is selected', () => {
      store.currentCharacterData = makeCharacter({ class: null, background: null })
      const { badges } = useCharacterCompletion()
      expect(badges.value.skills).toBeUndefined()
    })
  })

  describe('feats (incomplete class feature choice)', () => {
    it('shows an alert when an eligible feature choice is incomplete', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: null,
        featureChoices: {},
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.feats).toEqual({ type: 'alert', label: 'Class feature choices remaining' })
    })

    it('hides the alert when the feature choice is satisfied', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: null,
        featureChoices: {
          'fighting-style': ['defense'],
          'fighter-subclass': ['champion'],
        },
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.feats).toBeUndefined()
    })
  })

  describe('inventory (starting equipment not chosen)', () => {
    it('shows an alert when class/background are set but equipment is empty', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: 'Soldier',
        equippedGear: [],
        consumables: [],
        gold: 0,
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.inventory).toEqual({ type: 'alert', label: 'Choose starting equipment' })
    })

    it('hides the alert once equipment has been added', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: 'Soldier',
        equippedGear: [{ id: 'x', name: 'Sword', theme: 'default' }],
        consumables: [],
        gold: 0,
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.inventory).toBeUndefined()
    })

    it('hides the alert when class or background is missing', () => {
      store.currentCharacterData = makeCharacter({
        class: null,
        background: 'Soldier',
        equippedGear: [],
        consumables: [],
        gold: 0,
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.inventory).toBeUndefined()
    })
  })

  it('returns an empty map when no character is loaded', () => {
    store.currentCharacterData = null as unknown as CharacterData
    const { badges } = useCharacterCompletion()
    expect(badges.value).toEqual({})
  })
})
