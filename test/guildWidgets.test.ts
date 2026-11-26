import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGuildWidgets } from '@/composables/useGuildWidgets'
import { useCharacterStore } from '@/stores/character'
import { useGuildStore } from '@/stores/guildStore'

describe('useGuildWidgets', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('hides guild widgets for a fresh non-guild character', () => {
    const { showRenown, showGuildCurrencies } = useGuildWidgets()
    expect(showRenown.value).toBe(false)
    expect(showGuildCurrencies.value).toBe(false)
  })

  it('keeps them for characters that already carry guild data', () => {
    const store = useCharacterStore()
    store.currentCharacterData.renownTier = 2
    store.currentCharacterData.supply = 3
    const { showRenown, showGuildCurrencies } = useGuildWidgets()
    expect(showRenown.value).toBe(true)
    expect(showGuildCurrencies.value).toBe(true)
  })

  it('shows them for players with an active guild', () => {
    const guild = useGuildStore()
    guild.activeGuildId = 'g1'
    const { showRenown, showGuildCurrencies } = useGuildWidgets()
    expect(showRenown.value).toBe(true)
    expect(showGuildCurrencies.value).toBe(true)
  })
})
