<script setup>
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'
import { formatMod } from '@/services/characterService.js'

const store = useCharacterStore()
</script>

<template>
  <section class="bordered-section flex-grow">
    <h3 class="font-fell font-bold border-b border-gray-400 mb-1">Saving Throws</h3>
    <ul class="text-sm skill-list">
      <li
        v-for="[key, name] in Object.entries(DND_RULES.ABILITIES)"
        :key="key"
        :class="{ proficient: store.currentCharacterData.proficiencies.savingThrows.includes(key) }"
      >
        <span>{{ name }}</span>
        <strong>
          {{
            formatMod(
              store.abilityMods[key] +
                (store.currentCharacterData.proficiencies.savingThrows.includes(key)
                  ? store.profBonus
                  : 0),
            )
          }}
        </strong>
      </li>
    </ul>
  </section>
</template>
