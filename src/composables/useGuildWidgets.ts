import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useGuildStore } from '@/stores/guildStore'

/**
 * Whether guild-only widgets (Renown progression, Supply, Influence) are shown.
 * They appear for players with an active guild, and for any character that
 * already carries guild data, so nothing a player entered ever disappears.
 */
export function useGuildWidgets() {
  const store = useCharacterStore()
  const guild = useGuildStore()
  const char = computed(() => store.currentCharacterData)

  const showRenown = computed(
    () =>
      guild.isActiveGuildSet || (char.value.renownTier ?? 1) > 1 || (char.value.renownMilestones ?? 0) > 0,
  )
  const showGuildCurrencies = computed(
    () => guild.isActiveGuildSet || (char.value.supply ?? 0) > 0 || (char.value.influence ?? 0) > 0,
  )
  return { showRenown, showGuildCurrencies }
}
