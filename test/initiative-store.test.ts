import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'
import { useProgressionStore } from '../src/stores/progression'
import { buildInitiativeRoll } from '@/domain'
import type { CharacterFeature } from '@/types/character'

/**
 * Store-level initiative behaviour. The dice math and feature-reset rule live in
 * `initiativeService` (covered separately); here we verify that a roll produced
 * elsewhere — e.g. the 3D dice roller — is persisted and triggers the reset.
 */
describe('Character Store - Initiative', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    useProgressionStore()
  })

  function feat(title: string, reset: string, used = 1): CharacterFeature {
    return {
      title,
      desc: '',
      used,
      resource: { resourceType: 'static', value: 1, reset },
    } as CharacterFeature
  }

  it('persists a result produced by an external roller', () => {
    store.recordInitiativeRoll(buildInitiativeRoll('advantage', 3, [7, 14]))

    expect(store.currentCharacterData.combat.initiative).toBe(17)
    expect(store.lastInitiativeRoll).toEqual({
      mode: 'advantage',
      mod: 3,
      rolls: [7, 14],
      kept: 14,
      total: 17,
    })
  })

  it('resets only the features that reset on Initiative', () => {
    store.currentCharacterData.features = [
      feat('A', 'Initiative'),
      feat('B', 'Long Rest'),
    ]

    store.recordInitiativeRoll(buildInitiativeRoll('normal', 0, [10]))

    expect(store.currentCharacterData.features.map((f) => f.used)).toEqual([0, 1])
  })
})
