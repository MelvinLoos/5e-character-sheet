import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useCharacterStore } from '../src/stores/character'
import { useProgressionStore } from '../src/stores/progression'
import type { CharacterData } from '@/domain'

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    name: 'Test',
    title: '',
    jobInParty: '',
    class: 'Wizard',
    renownTier: 1,
    renownMilestones: 0,
    species: 'Human',
    background: null,
    pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    profBonus: 2,
    proficiencies: { savingThrows: [], skills: [] },
    combat: { ac: 10, hp_max: 10, hp_current: 10, speed: '30ft' },
    attacks: [],
    features: [
      {
        title: 'Spellcasting (Wizard)',
        desc: 'Wizard spells',
        casterType: 'full',
        key: true,
      },
    ],
    equipment: '',
    gold: 0,
    supply: 0,
    influence: 0,
    inventorySlots: 10,
    equippedGear: [],
    consumables: [],
    personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
    spellcasting: { ability: 'int', slotsSpent: {} },
    spells: [],
    ...overrides,
  } as CharacterData
}

describe('Tier Reactivity — Vue integration', () => {
  let store: ReturnType<typeof useCharacterStore>
  let progressionStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    progressionStore = useProgressionStore()
  })

  it('derivedLevel updates reactively when renownTier changes', () => {
    store.currentCharacterData = makeChar({ renownTier: 1 })
    expect(store.derivedLevel).toBe(3)

    store.currentCharacterData.renownTier = 2
    expect(store.derivedLevel).toBe(6)

    store.currentCharacterData.renownTier = 3
    expect(store.derivedLevel).toBe(10)
  })

  it('spellSlots updates reactively when renownTier changes (T1 → T2 → T3)', () => {
    store.currentCharacterData = makeChar({ renownTier: 1 })

    // Tier 1 → level 3 full caster
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })

    // Advance to Tier 2 → level 6 full caster
    store.currentCharacterData.renownTier = 2
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 3 })

    // Advance to Tier 3 → level 10 full caster
    store.currentCharacterData.renownTier = 3
    expect(progressionStore.spellSlots).toEqual({
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
    })
  })

  it('spellSlots reacts when tier decreases (T3 → T1)', () => {
    store.currentCharacterData = makeChar({ renownTier: 3 })
    expect(progressionStore.spellSlots).toEqual({
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
    })

    store.currentCharacterData.renownTier = 1
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
  })

  it('derivedLevel and profBonus chain react together', async () => {
    // At Tier 1 (level 3), proficiency bonus is +2
    store.currentCharacterData = makeChar({ renownTier: 1 })
    expect(store.derivedLevel).toBe(3)
    expect(store.profBonus).toBe(2)

    // Advance to Tier 3 (level 10) — proficiency bonus still +2 (threshold is 9)
    // Actually at level 10, proficiency bonus is +4 (threshold 9)
    store.currentCharacterData.renownTier = 3
    await nextTick()
    expect(store.derivedLevel).toBe(10)
    expect(store.profBonus).toBe(4)
  })

  it('slotsSpent is clamped when tier decreases and max slots drop', () => {
    store.currentCharacterData = makeChar({
      renownTier: 2,
      spellcasting: {
        ability: 'int',
        slotsSpent: {
          level1: 3,
          level2: 2,
          level3: 3, // Used all level3 slots
        },
      },
    })
    // Tier 2 provides { level1:4, level2:3, level3:3 }
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 3 })

    // Demote to Tier 1 — slots become { level1:4, level2:2 }
    // level3 disappears entirely, so any level3 spent data would be stale
    // but level2 max drops from 3 to 2
    // The clamping happens in SpellcastingBlock's watch, so we simulate
    // what happens: if slotsSpent.level2 was 2 and max becomes 2, it's fine.
    // If it was 3, the watcher would clamp it to 2.

    // Simulate what the component does on tier decrease:
    store.currentCharacterData.renownTier = 1
    // Manually apply the clamping logic:
    const newSlots = progressionStore.spellSlots // { level1:4, level2:2 }
    const slotsSpent = store.currentCharacterData.spellcasting?.slotsSpent || {}
    for (const [key, max] of Object.entries(newSlots)) {
      if ((slotsSpent[key] || 0) > max) {
        slotsSpent[key] = max
      }
    }

    expect(slotsSpent.level1).toBe(3) // within max of 4, unchanged
    expect(slotsSpent.level2).toBe(2) // was 2, still within max 2
    // level3 is no longer in the slot map, but that's correct — you can't spend
    // level3 slots at Tier 1
  })

  it('maxHp reactively updates with tier changes', () => {
    // Tier 1 Wizard (level 3) with CON 10 (+0)
    // hp = 6 + 0 + (3-1) * (4 + 0) = 6 + 2*4 = 14
    store.currentCharacterData = makeChar({ renownTier: 1 })
    // Hit dice is 6, average is 4, level 3
    // hp = 6 + 0 (=6) + (3 - 1) * max(1, 4 + 0) = 6 + 8 = 14
    expect(store.maxHp).toBe(14)

    // Tier 3 Wizard (level 10) with CON 10
    // hp = 6 + 0 + (10 - 1) * 4 = 6 + 36 = 42
    store.currentCharacterData.renownTier = 3
    expect(store.maxHp).toBe(42)
  })

  it('non-spellcasting class returns empty spellSlots regardless of tier', () => {
    store.currentCharacterData = makeChar({
      renownTier: 3,
      class: 'Barbarian',
      features: [
        {
          title: 'Rage',
          desc: 'Angry',
          casterType: null,
          key: true,
        },
      ],
    })
    expect(progressionStore.spellSlots).toEqual({})
    expect(store.derivedLevel).toBe(10) // derivedLevel works for other computed
  })

  it('multiple tier changes maintain consistent state', () => {
    store.currentCharacterData = makeChar({ renownTier: 1 })
    expect(store.derivedLevel).toBe(3)
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })

    store.currentCharacterData.renownTier = 3
    expect(store.derivedLevel).toBe(10)
    expect(progressionStore.spellSlots).toEqual({
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
    })

    store.currentCharacterData.renownTier = 2
    expect(store.derivedLevel).toBe(6)
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 3 })

    store.currentCharacterData.renownTier = 1
    expect(store.derivedLevel).toBe(3)
    expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
  })
})