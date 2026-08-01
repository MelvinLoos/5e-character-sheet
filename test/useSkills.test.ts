import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { createBlankCharacter, getMod } from '@/domain'
import { normalizeSkillName, useSkills } from '@/composables/useSkills'
import type { CharacterData } from '@/types/character'

/**
 * Helper: create a test character with specific ability scores and proficiencies.
 *
 * We must set `pointBuyBaseScores` to match `abilityScores` because the character
 * store's watcher on `backgroundBonusSelections` calls `recalculateAbilityScores()`,
 * which rebuilds `abilityScores` from `pointBuyBaseScores` + background bonuses.
 */
function createTestCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = {
    str: 16,
    dex: 14,
    con: 12,
    int: 10,
    wis: 8,
    cha: 15,
  }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    profBonus: 2,
    proficiencies: {
      skills: [],
      savingThrows: [],
    },
    backgroundBonusSelections: {
      plusTwo: null,
      plusOne: null,
    },
    ...overrides,
  } as CharacterData
}

describe('normalizeSkillName (pure utility)', () => {
  it('lowercases and strips spaces', () => {
    expect(normalizeSkillName('Sleight of Hand')).toBe('sleightofhand')
  })

  it('handles single-word skill names', () => {
    expect(normalizeSkillName('Athletics')).toBe('athletics')
    expect(normalizeSkillName('Stealth')).toBe('stealth')
  })

  it('handles mixed case', () => {
    expect(normalizeSkillName('AnImAl HaNdLiNg')).toBe('animalhandling')
  })
})

describe('useSkills', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    store.currentCharacterData = createTestCharacter()
    store.isEditing = true
  })

  describe('isProficient', () => {
    it('returns true for skills present in store.proficiencies.skills', () => {
      store.currentCharacterData.proficiencies.skills = ['athletics', 'acrobatics']
      const { isProficient } = useSkills(store)

      expect(isProficient.value('Athletics')).toBe(true)
      expect(isProficient.value('Acrobatics')).toBe(true)
    })

    it('returns false for untrained skills', () => {
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { isProficient } = useSkills(store)

      expect(isProficient.value('Stealth')).toBe(false)
      expect(isProficient.value('Arcana')).toBe(false)
    })

    it('handles skills with spaces in names', () => {
      store.currentCharacterData.proficiencies.skills = ['sleightofhand']
      const { isProficient } = useSkills(store)

      expect(isProficient.value('Sleight of Hand')).toBe(true)
    })
  })

  describe('skillMod', () => {
    it('calculates correctly with proficiency (abilityMod + profBonus)', () => {
      // STR 16 → +3 mod, PB +2, proficient → +5 total
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { skillMod } = useSkills(store)

      const expectedMod = getMod(16) + store.profBonus // 3 + 2 = 5
      expect(skillMod.value('Athletics', 'str')).toBe(expectedMod)
    })

    it('calculates correctly without proficiency (abilityMod only)', () => {
      // STR 16 → +3 mod, NOT proficient → just +3
      store.currentCharacterData.proficiencies.skills = []
      const { skillMod } = useSkills(store)

      const expectedMod = getMod(16) // 3
      expect(skillMod.value('Athletics', 'str')).toBe(expectedMod)
    })

    it('returns just abilityMod when profBonus > 0 but not proficient', () => {
      // DEX 14 → +2 mod, PB +2, NOT proficient → just +2
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { skillMod } = useSkills(store)

      const expectedMod = getMod(14) // 2
      expect(skillMod.value('Acrobatics', 'dex')).toBe(expectedMod)
    })
  })

  describe('toggleProficiency', () => {
    it('adds an untrained skill to the store', () => {
      store.currentCharacterData.proficiencies.skills = []
      const { toggleProficiency } = useSkills(store)

      toggleProficiency('Athletics')

      expect(store.currentCharacterData.proficiencies.skills).toContain('athletics')
    })

    it('removes a trained skill when toggled twice', () => {
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { toggleProficiency } = useSkills(store)

      // First toggle: remove
      toggleProficiency('Athletics')
      expect(store.currentCharacterData.proficiencies.skills).not.toContain('athletics')

      // Second toggle: re-add
      toggleProficiency('Athletics')
      expect(store.currentCharacterData.proficiencies.skills).toContain('athletics')
    })

    it('does nothing when not in editing mode', () => {
      store.isEditing = false
      store.currentCharacterData.proficiencies.skills = []
      const { toggleProficiency } = useSkills(store)

      toggleProficiency('Athletics')

      expect(store.currentCharacterData.proficiencies.skills).toHaveLength(0)
    })
  })

  describe('allSkillMods', () => {
    it('returns an entry for every D&D skill', () => {
      store.currentCharacterData.proficiencies.skills = ['athletics', 'perception']
      const { allSkillMods } = useSkills(store)

      expect(allSkillMods.value.length).toBe(18) // 18 skills in DND_RULES.SKILLS
      expect(allSkillMods.value[0]).toHaveProperty('name')
      expect(allSkillMods.value[0]).toHaveProperty('stat')
      expect(allSkillMods.value[0]).toHaveProperty('mod')
      expect(allSkillMods.value[0]).toHaveProperty('proficient')
    })

    it('marks proficient skills correctly', () => {
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { allSkillMods } = useSkills(store)

      const athleticsEntry = allSkillMods.value.find((s) => s.name === 'Athletics')
      const acrobaticsEntry = allSkillMods.value.find((s) => s.name === 'Acrobatics')

      expect(athleticsEntry?.proficient).toBe(true)
      expect(acrobaticsEntry?.proficient).toBe(false)
    })

    it('calculates correct modifiers for proficient and non-proficient skills', () => {
      // STR 16 (+3), prof in Athletics → +5; DEX 14 (+2), no prof in Acrobatics → +2
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { allSkillMods } = useSkills(store)

      const athleticsEntry = allSkillMods.value.find((s) => s.name === 'Athletics')
      const acrobaticsEntry = allSkillMods.value.find((s) => s.name === 'Acrobatics')

      expect(athleticsEntry?.mod).toBe(5) // 3 + 2
      expect(acrobaticsEntry?.mod).toBe(2) // 2 + 0
    })
  })

  describe('lockedSkills', () => {
    it('returns background fixed skills as locked', () => {
      store.currentCharacterData.background = 'Acolyte'
      const { lockedSkills } = useSkills(store)
      expect(lockedSkills.value).toContain('insight')
      expect(lockedSkills.value).toContain('religion')
    })

    it('returns empty when no background and no class fixed skills', () => {
      store.currentCharacterData.background = null
      store.currentCharacterData.class = 'Fighter' // Fighter has no fixedSkills
      const { lockedSkills } = useSkills(store)
      expect(lockedSkills.value).toEqual([])
    })
  })

  describe('classSkillOptions', () => {
    it('returns the class skillChoices for a class with choices', () => {
      store.currentCharacterData.class = 'Fighter'
      const { classSkillOptions } = useSkills(store)
      expect(classSkillOptions.value).toEqual({
        count: 2,
        from: expect.any(Array),
      })
    })

    it('returns null when no class selected', () => {
      store.currentCharacterData.class = null
      const { classSkillOptions } = useSkills(store)
      expect(classSkillOptions.value).toBeNull()
    })
  })

  describe('remainingChoices', () => {
    it('returns 0 when no class selected', () => {
      store.currentCharacterData.class = null
      const { remainingChoices } = useSkills(store)
      expect(remainingChoices.value).toBe(0)
    })

    it('returns max count minus manually selected non-locked skills', () => {
      store.currentCharacterData.class = 'Fighter' // count: 2
      store.currentCharacterData.background = 'Acolyte' // locked: insight, religion
      store.currentCharacterData.proficiencies.skills = ['insight', 'athletics']
      const { remainingChoices } = useSkills(store)
      // insight is locked, athletics is manual → 2 - 1 = 1
      expect(remainingChoices.value).toBe(1)
    })

    it('returns 0 when all choices used', () => {
      store.currentCharacterData.class = 'Fighter' // count: 2
      store.currentCharacterData.proficiencies.skills = ['athletics', 'perception']
      const { remainingChoices } = useSkills(store)
      expect(remainingChoices.value).toBe(0)
    })
  })

  describe('isSkillDisabled', () => {
    it('disables locked skills', () => {
      store.currentCharacterData.background = 'Acolyte'
      const { isSkillDisabled } = useSkills(store)
      expect(isSkillDisabled('Insight')).toBe(true)
      expect(isSkillDisabled('Religion')).toBe(true)
    })

    it('disables all skills when no class selected', () => {
      store.currentCharacterData.class = null
      const { isSkillDisabled } = useSkills(store)
      expect(isSkillDisabled('Athletics')).toBe(true)
      expect(isSkillDisabled('Stealth')).toBe(true)
    })

    it('disables skills not in the class from list', () => {
      store.currentCharacterData.class = 'Fighter'
      const { isSkillDisabled } = useSkills(store)
      // Fighter list doesn't include Arcana
      expect(isSkillDisabled('Arcana')).toBe(true)
      // Fighter list includes Athletics
      expect(isSkillDisabled('Athletics')).toBe(false)
    })

    it('allows any skill when class from is any', () => {
      store.currentCharacterData.class = 'Bard' // from: 'any'
      const { isSkillDisabled } = useSkills(store)
      expect(isSkillDisabled('Arcana')).toBe(false)
      expect(isSkillDisabled('Stealth')).toBe(false)
    })

    it('disables unselected skills when no remaining choices', () => {
      store.currentCharacterData.class = 'Fighter' // count: 2
      store.currentCharacterData.proficiencies.skills = ['athletics', 'perception']
      const { isSkillDisabled } = useSkills(store)
      // All 2 choices used, so unselected skills are disabled
      expect(isSkillDisabled('Survival')).toBe(true)
      // Already-selected skills remain enabled (can be toggled off)
      expect(isSkillDisabled('Athletics')).toBe(false)
    })
  })

  describe('toggleProficiency with constraints', () => {
    it('prevents toggling locked skills', () => {
      store.currentCharacterData.background = 'Acolyte'
      store.currentCharacterData.proficiencies.skills = ['insight']
      const { toggleProficiency } = useSkills(store)

      // Try to remove a locked skill
      toggleProficiency('Insight')
      expect(store.currentCharacterData.proficiencies.skills).toContain('insight')
    })

    it('prevents adding skills beyond remaining choices', () => {
      store.currentCharacterData.class = 'Fighter' // count: 2
      store.currentCharacterData.proficiencies.skills = ['athletics', 'perception']
      const { toggleProficiency } = useSkills(store)

      // Try to add a third skill
      toggleProficiency('Survival')
      expect(store.currentCharacterData.proficiencies.skills).not.toContain('survival')
    })

    it('allows adding skills within remaining choices', () => {
      store.currentCharacterData.class = 'Fighter' // count: 2
      store.currentCharacterData.proficiencies.skills = ['athletics']
      const { toggleProficiency } = useSkills(store)

      toggleProficiency('Perception')
      expect(store.currentCharacterData.proficiencies.skills).toContain('perception')
    })
  })
})
