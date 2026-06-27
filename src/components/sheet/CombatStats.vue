<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'

const store = useCharacterStore()
</script>

<template>
  <section class="flex flex-col gap-6">
    <h3
      class="font-headline-md text-headline-md text-primary border-b border-primary-container pb-2"
    >
      Combat Vitals
    </h3>
    <div class="grid grid-cols-2 gap-4">
      <!-- AC Card -->
      <div
        class="bg-secondary-container rounded-lg p-4 border border-on-secondary-fixed-variant flex flex-col items-center justify-center shadow-md relative overflow-hidden group"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <span
          class="material-symbols-outlined text-4xl text-secondary mb-2 relative z-10"
          style="font-variation-settings: 'FILL' 1"
          >shield</span
        >
        <span
          class="font-label-md text-label-md text-secondary-fixed-dim uppercase tracking-wider relative z-10"
          >Armor Class</span
        >
        <div class="font-headline-lg text-headline-lg text-white mt-1 relative z-10 font-bold">
          <input
            v-if="store.isEditing"
            v-model.number="store.currentCharacterData.combat.ac"
            type="number"
            class="w-16 bg-transparent border-none focus:ring-0 text-center font-headline-lg text-headline-lg text-white font-bold p-0"
          />
          <template v-else>
            {{ store.currentCharacterData.combat.ac }}
          </template>
        </div>
      </div>

      <!-- HP Card -->
      <div
        class="bg-surface-container-highest rounded-lg p-4 border border-outline-variant flex flex-col justify-between"
      >
        <div class="flex justify-between items-center mb-2">
          <span
            class="font-label-md text-label-md text-on-surface-variant uppercase flex items-center gap-1"
            ><span class="material-symbols-outlined text-sm">favorite</span> HP</span
          >
        </div>
        <div class="flex items-end gap-2 border-b border-surface-variant pb-2 mb-2">
          <input
            class="w-16 bg-transparent border-none text-right font-headline-lg text-headline-lg text-on-surface p-0 focus:ring-0"
            type="number"
            v-model.number="store.currentCharacterData.combat.hp_current"
            @input="() => { if ((store.currentCharacterData?.combat?.hp_current ?? 0) > store.maxHp) store.currentCharacterData.combat.hp_current = store.maxHp; }"
          />
          <span class="font-body-md text-body-md text-on-surface-variant pb-1 whitespace-nowrap"
            >/ {{ store.maxHp }}</span
          >
        </div>
        <div class="flex justify-between items-center">
          <span class="font-label-md text-label-md text-on-surface-variant">Temp</span>
          <input
            class="w-12 bg-surface-container rounded border border-outline-variant text-center font-body-md text-on-surface p-1 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="0"
            type="number"
          />
        </div>
      </div>

      <!-- Hit Dice -->
      <div
        class="bg-surface-container-highest rounded-lg p-4 border border-outline-variant flex flex-col items-center justify-center col-span-2 sm:col-span-1"
      >
        <span
          class="font-label-md text-label-md text-on-surface-variant uppercase mb-2 flex items-center gap-1"
          ><span class="material-symbols-outlined text-sm">casino</span> Hit Dice</span
        >
        <div class="flex items-center gap-3">
          <div class="font-headline-md text-headline-md text-on-surface">
            {{ store.currentCharacterData.renownTier
            }}<span class="text-on-surface-variant text-lg"
              >d{{
                store.currentCharacterData.class
                  ? DND_RULES.CLASSES[store.currentCharacterData.class]?.hitDice || 8
                  : 8
              }}</span
            >
          </div>
        </div>
      </div>

      <!-- Initiative & Speed -->
      <div class="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
        <div
          class="bg-surface-container-high rounded p-3 border border-outline-variant flex flex-col items-center justify-center"
        >
          <span class="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase"
            >Initiative</span
          >
          <span class="font-headline-md text-headline-md text-on-surface"
            >{{ (store.abilityMods.dex ?? 0) >= 0 ? '+' : ''
            }}{{ store.abilityMods.dex ?? 0 }}</span
          >
        </div>
        <div
          class="bg-surface-container-high rounded p-3 border border-outline-variant flex flex-col items-center justify-center"
        >
          <span class="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase"
            >Speed</span
          >
          <input
            v-if="store.isEditing"
            v-model="store.currentCharacterData.combat.speed"
            class="w-full bg-transparent border-b border-surface-variant focus:border-tertiary focus:ring-0 text-center font-headline-md text-on-surface p-0 pb-1"
          />
          <span
            v-else
            class="font-headline-md text-headline-md text-on-surface"
            v-html="
              store.currentCharacterData.combat.speed.replace(
                'ft',
                '<span class=\'text-base\'>ft</span>',
              )
            "
          ></span>
        </div>
      </div>
    </div>
  </section>
</template>
