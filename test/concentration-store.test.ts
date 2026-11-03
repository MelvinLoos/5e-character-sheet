import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'
import { useSpellStore } from '../src/stores/spellStore'
import type { CharacterSpell } from '@/types/character'

function concentrationSpell(name: string, level = 1, id = name.toLowerCase()): CharacterSpell {
  return { id, name, level, desc: '', concentration: true }
}

/**
 * Spell-store concentration behaviour. The pure rules (save DC, candidate
 * filtering) live in `concentrationService`; here we cover the single-active
 * invariant, the CON save reminder and the 0-HP auto-clear.
 */
describe('Spell Store - Concentration', () => {
  let character: ReturnType<typeof useCharacterStore>
  let spells: ReturnType<typeof useSpellStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    character = useCharacterStore()
    spells = useSpellStore()
    // Concentration only applies to casters (spellcasting object present).
    character.currentCharacterData.spellcasting = { ability: 'wis' }
    character.currentCharacterData.spells = [
      concentrationSpell('Bless'),
      { id: 'fireball', name: 'Fireball', level: 3, desc: '' },
      concentrationSpell('Hex'),
    ]
    character.currentCharacterData.combat.hp_current = 20
  })

  it('lists only concentration spells as picker candidates', () => {
    expect(spells.concentrationSpells.map((s) => s.name)).toEqual(['Bless', 'Hex'])
  })

  it('starts and ends concentration', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    expect(spells.activeConcentration).toMatchObject({ spellId: 'bless', spellName: 'Bless', level: 1 })

    spells.endConcentration()
    expect(spells.activeConcentration).toBeNull()
  })

  it('keeps a single active concentration, replacing the previous', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    spells.startConcentration(concentrationSpell('Hex'))
    expect(spells.activeConcentration?.spellName).toBe('Hex')
  })

  it('records the CON save DC after damage while concentrating', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    spells.noteConcentrationDamage(24)
    expect(spells.lastConcentrationCheck).toBe(12)
  })

  it('does not record a check when not concentrating', () => {
    spells.noteConcentrationDamage(24)
    expect(spells.lastConcentrationCheck).toBeNull()
  })

  it('clears concentration when HP reaches 0', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    character.currentCharacterData.combat.hp_current = 0
    expect(spells.activeConcentration).toBeNull()
  })

  it('shows no save reminder for lethal damage (concentration already ended)', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    character.currentCharacterData.combat.hp_current = 0
    spells.noteConcentrationDamage(50)
    expect(spells.lastConcentrationCheck).toBeNull()
  })

  it('leaves concentration untouched when HP is above 0', () => {
    spells.startConcentration(concentrationSpell('Bless'))
    character.currentCharacterData.combat.hp_current = 1
    expect(spells.activeConcentration?.spellName).toBe('Bless')
  })
})
