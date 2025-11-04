<script setup>
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'
import { formatMod } from '@/services/characterService.js'

const store = useCharacterStore()
</script>

<template>
  <section class="bordered-section flex-grow">
    <h3 class="font-fell font-bold border-b border-gray-400 mb-1">Skills</h3>
    <ul class="text-sm skill-list">
      <li
        v-for="[name, stat] in Object.entries(DND_RULES.SKILLS)"
        :key="name"
        :class="{
          proficient: store.currentCharacterData.proficiencies.skills.includes(
            name.toLowerCase().replace(/ /g, ''),
          ),
        }"
      >
        <span>
          {{ name }}
          <span class="text-gray-500">({{ stat.toUpperCase() }})</span>
        </span>
        <strong>
          {{
            formatMod(
              store.abilityMods[stat] +
                (store.currentCharacterData.proficiencies.skills.includes(
                  name.toLowerCase().replace(/ /g, ''),
                )
                  ? store.profBonus
                  : 0),
            )
          }}
        </strong>
      </li>
    </ul>
  </section>
</template>
