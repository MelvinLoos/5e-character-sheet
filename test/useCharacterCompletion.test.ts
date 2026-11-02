import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterFeature, CharacterSpell } from '@/types/character'

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

  describe('spells (prepared spell selections)', () => {
    const wizardFeature = {
      title: 'Wizard Spellcasting',
      desc: '',
      casterType: 'full',
      key: true,
    } as CharacterFeature

    it('shows a count of remaining spell selections for a caster', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Wizard',
        renownTier: 1,
        features: [wizardFeature],
        spells: [{ name: 'Magic Missile', level: 1, desc: '' }] as CharacterSpell[],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toEqual({ type: 'count', count: 5, label: '5 spells to select' })
    })

    it('uses a singular label when exactly one spell remains', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Warlock',
        renownTier: 1,
        features: [
          { title: 'Warlock Pact Magic', desc: '', casterType: 'pact', key: true },
        ] as CharacterFeature[],
        spells: [
          { name: 'Hex', level: 1, desc: '' },
          { name: 'Armor of Agathys', level: 1, desc: '' },
          { name: 'Hellish Rebuke', level: 1, desc: '' },
        ] as CharacterSpell[],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toEqual({ type: 'count', count: 1, label: '1 spell to select' })
    })

    it('does not count cantrips against the limit', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Wizard',
        renownTier: 1,
        features: [wizardFeature],
        spells: [
          { name: 'Light', level: 0, desc: '' },
          { name: 'Fire Bolt', level: 0, desc: '' },
        ] as CharacterSpell[],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toEqual({ type: 'count', count: 6, label: '6 spells to select' })
    })

    it('hides the badge once the prepared limit is reached', () => {
      const spells = Array.from({ length: 6 }, (_, i) => ({
        name: `Spell ${i}`,
        level: 1,
        desc: '',
      })) as CharacterSpell[]
      store.currentCharacterData = makeCharacter({
        class: 'Wizard',
        renownTier: 1,
        features: [wizardFeature],
        spells,
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toBeUndefined()
    })

    it('scales the limit with the renown tier', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Warlock',
        renownTier: 3,
        features: [
          { title: 'Warlock Pact Magic', desc: '', casterType: 'pact', key: true },
        ] as CharacterFeature[],
        spells: [],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toEqual({ type: 'count', count: 10, label: '10 spells to select' })
    })

    it('hides the badge for a non-caster class', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Fighter',
        background: null,
        features: [],
        spells: [],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toBeUndefined()
    })

    it('hides the badge when the character has no spellcasting feature', () => {
      store.currentCharacterData = makeCharacter({
        class: 'Wizard',
        features: [],
        spells: [],
      })
      const { badges } = useCharacterCompletion()
      expect(badges.value.spells).toBeUndefined()
    })
  })
})
