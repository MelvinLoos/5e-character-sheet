<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'

const store = useCharacterStore()

const char = computed(() => store.currentCharacterData)

// Helper to format ability modifiers
function getAbilityMod(stat: string) {
  const mod = store.abilityMods[stat] ?? 0
  return (mod >= 0 ? '+' : '') + mod
}

// Helper to check skill proficiency
function isSkillProficient(name: string) {
  const normName = name.toLowerCase().replace(/ /g, '')
  return char.value.proficiencies.skills.includes(normName)
}

// Helper to calculate skill modifier
function getSkillMod(name: string, stat: string) {
  const baseMod = store.abilityMods[stat] ?? 0
  const profBonus = isSkillProficient(name) ? store.profBonus : 0
  const total = baseMod + profBonus
  return (total >= 0 ? '+' : '') + total
}

// Calculate spell slots based on caster type and level
const spellSlots = computed<Record<string, number>>(() => {
  const features = char.value?.features || []
  const spellcastingFeature = features.find(
    (f: { casterType?: string | null }) =>
      typeof f.casterType === 'string' && f.casterType !== 'none',
  )
  const casterType = spellcastingFeature ? spellcastingFeature.casterType : null

  if (casterType && casterType !== 'none') {
    if (!char.value?.renownTier) return {}
    const level = char.value.renownTier
    const progression = SPELL_SLOT_PROGRESSION[casterType as keyof typeof SPELL_SLOT_PROGRESSION]
    return (progression?.[level] || {}) as Record<string, number>
  }
  return {}
})

const SPELL_SLOT_PROGRESSION = DND_RULES.SPELL_SLOT_PROGRESSION

// Get key features (feats)
const feats = computed(() => {
  return char.value?.features || []
})

// Get attacks with calculated bonuses
const attacks = computed(() => {
  const arr = char.value?.attacks || []
  return arr.map(
    (atk: {
      name: string
      atkStat?: string | null
      customAtkValue?: number
      dmgStat?: string | null
      customDmgValue?: number
      dmgBonus?: number
      dmgDie?: string
      type?: string
      weaponMastery?: string
      notes?: string
    }) => {
      let atkBonus = 0
      if (atk.atkStat) {
        if (atk.atkStat === 'custom') {
          atkBonus = atk.customAtkValue || 0
        } else {
          atkBonus = (store.abilityMods[atk.atkStat] ?? 0) + store.profBonus
        }
      }

      let dmgBonusStr = ''
      if (atk.dmgStat) {
        let dmgMod = 0
        if (atk.dmgStat === 'custom') {
          dmgMod = (atk.customDmgValue || 0) + (atk.dmgBonus || 0)
        } else {
          dmgMod = (store.abilityMods[atk.dmgStat] ?? 0) + (atk.dmgBonus || 0)
        }
        dmgBonusStr = (dmgMod >= 0 ? '+' : '') + dmgMod
      } else if (atk.dmgBonus) {
        dmgBonusStr = (atk.dmgBonus >= 0 ? '+' : '') + atk.dmgBonus
      }

      const damageStr = `${atk.dmgDie || ''}${dmgBonusStr} ${atk.type || ''}`

      return {
        name: atk.name,
        bonus: atkBonus,
        damage: damageStr,
        notes: (atk.weaponMastery ? `[${atk.weaponMastery}] ` : '') + (atk.notes || ''),
      }
    },
  )
})
</script>

<template>
  <div class="printable-sheet-container hidden print:block bg-white text-black p-0 m-0 w-full">
    <!-- PAGE 1 -->
    <main
      class="a4-page p-8 border-black font-body-md text-body-md bg-white text-black"
      style="width: 794px; min-height: 1123px; margin: 0 auto; page-break-after: always"
    >
      <!-- Header Section -->
      <header class="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 class="font-display-lg text-display-lg leading-none mb-1 tracking-tight text-black">
            {{ char.name || 'Unnamed Hero' }}
          </h1>
          <h2 class="font-headline-md text-headline-md text-black">
            <span style="font-family: Manrope, sans-serif; font-size: 18px">
              {{ char.class || 'Class' }} - {{ char.species || 'Species' }}
            </span>
          </h2>
        </div>
        <div class="text-right">
          <div class="font-headline-md text-headline-md uppercase tracking-widest text-black">
            Tier {{ char.renownTier || 1 }}
          </div>
          <div class="font-label-md text-label-md uppercase text-black">Aspirant</div>
        </div>
      </header>

      <div class="grid grid-cols-12 gap-6">
        <!-- Left Column: Stats & Vitals -->
        <div class="col-span-4 flex flex-col gap-8">
          <!-- Ability Scores -->
          <section class="border-2 border-black p-4 rounded-lg bg-white">
            <h3
              class="font-headline-md text-headline-md border-b-2 border-black mb-4 pb-1 text-left text-black"
            >
              Abilities
            </h3>
            <div class="space-y-4">
              <!-- STR -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-headline-lg text-headline-lg text-black bg-white"
                >
                  {{ char.abilityScores.str }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">STR</div>
                  <div class="font-headline-md text-headline-md text-black">
                    {{ getAbilityMod('str') }}
                  </div>
                </div>
              </div>
              <!-- DEX -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-headline-lg text-headline-lg text-black bg-white"
                >
                  {{ char.abilityScores.dex }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">DEX</div>
                  <div class="font-headline-md text-headline-md text-black">
                    {{ getAbilityMod('dex') }}
                  </div>
                </div>
              </div>
              <!-- CON -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-headline-lg text-headline-lg text-black bg-white"
                >
                  {{ char.abilityScores.con }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">CON</div>
                  <div class="font-headline-md text-headline-md text-black">
                    {{ getAbilityMod('con') }}
                  </div>
                </div>
              </div>
              <!-- INT -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center font-headline-lg text-headline-lg font-bold text-black bg-white"
                >
                  {{ char.abilityScores.int }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">INT</div>
                  <div class="font-headline-md text-headline-md font-bold text-black">
                    {{ getAbilityMod('int') }}
                  </div>
                </div>
              </div>
              <!-- WIS -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-headline-lg text-headline-lg text-black bg-white"
                >
                  {{ char.abilityScores.wis }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">WIS</div>
                  <div class="font-headline-md text-headline-md text-black">
                    {{ getAbilityMod('wis') }}
                  </div>
                </div>
              </div>
              <!-- CHA -->
              <div class="flex items-center justify-between">
                <div
                  class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-headline-lg text-headline-lg text-black bg-white"
                >
                  {{ char.abilityScores.cha }}
                </div>
                <div class="text-center w-16">
                  <div class="font-label-md text-label-md uppercase text-xs text-black">CHA</div>
                  <div class="font-headline-md text-headline-md text-black">
                    {{ getAbilityMod('cha') }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Vitals -->
          <section class="grid grid-cols-2 gap-2">
            <div class="border-2 border-black p-2 text-center rounded bg-white">
              <div class="font-label-md text-label-md text-xs uppercase text-black">
                Armor Class
              </div>
              <div class="font-headline-lg text-headline-lg text-black">{{ char.combat.ac }}</div>
            </div>
            <div class="border-2 border-black p-2 text-center rounded bg-white">
              <div class="font-label-md text-label-md text-xs uppercase text-black">Initiative</div>
              <div class="font-headline-lg text-headline-lg text-black">
                {{ getAbilityMod('dex') }}
              </div>
            </div>
            <div class="border-2 border-black p-2 text-center rounded bg-white">
              <div class="font-label-md text-label-md text-xs uppercase text-black">Speed</div>
              <div class="font-headline-lg text-headline-lg text-black">
                {{ char.combat.speed || '30ft' }}
              </div>
            </div>
            <div class="border-2 border-black p-2 text-center rounded bg-white">
              <div class="font-label-md text-label-md text-xs uppercase text-black">
                Proficiency
              </div>
              <div class="font-headline-lg text-headline-lg text-black">+{{ store.profBonus }}</div>
            </div>
            <div class="col-span-2 border-2 border-black p-3 text-center rounded bg-white">
              <div class="font-label-md text-label-md text-xs uppercase mb-1 text-black">
                Hit Points
              </div>
              <div class="flex justify-center items-end gap-2">
                <span class="font-headline-lg text-headline-lg leading-none text-black"
                  ><span class="w-8 inline-block"></span
                ></span>
                <span class="text-black font-bold pb-1">/ {{ store.maxHp }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Middle & Right Columns: Skills & Talents -->
        <div class="col-span-8 flex flex-col gap-8">
          <!-- Skills -->
          <section class="border-2 border-black p-4 rounded-lg bg-white">
            <h3
              class="font-headline-md text-headline-md border-b-2 border-black mb-4 pb-1 text-black"
            >
              Skills
            </h3>
            <div class="columns-2 gap-6 space-y-1">
              <div
                v-for="[name, stat] in Object.entries(DND_RULES.SKILLS)"
                :key="name"
                class="flex justify-between border-b border-black pb-1 text-black"
              >
                <span class="flex items-center gap-2 text-black">
                  <span
                    class="w-3 h-3 rounded-full inline-block border-2 border-black"
                    :class="isSkillProficient(name) ? 'bg-black' : 'bg-white'"
                  ></span>
                  {{ name }} <span class="text-xs text-black">({{ stat.toUpperCase() }})</span>
                </span>
                <span :class="isSkillProficient(name) ? 'font-bold text-black' : 'text-black'">
                  {{ getSkillMod(name, stat) }}
                </span>
              </div>
            </div>
          </section>

          <!-- Feats / Features -->
          <section class="border-2 border-black p-4 rounded-lg flex-1 bg-white">
            <h3
              class="font-headline-md text-headline-md border-b-2 border-black mb-4 pb-1 text-black"
            >
              Feats & Features
            </h3>
            <div class="space-y-4">
              <div
                v-for="feat in feats.slice(0, 3)"
                :key="feat.title"
                class="border-2 border-black p-3 rounded bg-white"
              >
                <h4
                  class="font-label-md text-label-md uppercase font-bold flex items-center gap-2 text-black"
                >
                  {{ feat.title }}
                </h4>
                <p class="text-sm mt-1 text-black">{{ feat.desc }}</p>
              </div>
              <div
                v-if="feats.length === 0"
                class="border-2 border-black p-3 rounded border-dashed flex items-center justify-center min-h-[80px] bg-white"
              >
                <span class="text-black italic font-body-md text-body-md"
                  >No feats or features recorded.</span
                >
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- PAGE 2 -->
    <main
      class="a4-page p-6 border-black font-body-md text-body-md bg-white text-black"
      style="width: 794px; min-height: 1123px; margin: 0 auto"
    >
      <!-- Spellcasting Vitals & Slots Tracker -->
      <section class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        <!-- Vitals -->
        <div class="md:col-span-4 grid grid-cols-2 gap-2">
          <div class="border border-black p-2 rounded-sm text-center bg-white">
            <p class="font-label-md text-label-md text-black uppercase mb-0.5 text-xs">
              Spell Attack
            </p>
            <div class="font-display-lg text-display-lg text-black text-3xl leading-none">
              {{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}
            </div>
          </div>
          <div class="border border-black p-2 rounded-sm text-center bg-white">
            <p class="font-label-md text-label-md text-black uppercase mb-0.5 text-xs">
              Spell Save DC
            </p>
            <div class="font-display-lg text-display-lg text-black text-3xl leading-none">
              {{ store.spellSaveDC }}
            </div>
          </div>
        </div>
        <!-- Slots Tracker -->
        <div class="md:col-span-8 border border-black p-2 rounded-sm bg-white">
          <h3
            class="font-headline-md text-headline-md text-black mb-1 border-b border-black pb-1 text-sm"
          >
            Spell Slots
          </h3>
          <div class="grid grid-cols-5 gap-2">
            <div v-for="level in [1, 2, 3, 4, 5]" :key="level" class="flex flex-col items-center">
              <span class="font-label-md text-label-md mb-0.5 text-black text-xs"
                >Level {{ level }}</span
              >
              <div class="flex gap-1">
                <div
                  v-for="slotIndex in spellSlots[`level${level}`] || 0"
                  :key="slotIndex"
                  class="w-3.5 h-3.5 border border-black rounded-sm bg-white"
                ></div>
                <div v-if="!(spellSlots[`level${level}`] || 0)" class="text-xs text-black italic">
                  -
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Attacks & Combat Actions -->
      <section class="mt-4">
        <h3
          class="font-headline-lg text-headline-lg border-b-2 border-black pb-1 mb-2 text-black uppercase tracking-wider text-xl"
        >
          Attacks
        </h3>
        <div class="border border-black rounded-sm overflow-hidden bg-white">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-black bg-white">
                <th
                  class="p-1.5 font-label-md text-label-md uppercase border-r border-black text-black text-xs"
                >
                  Weapon Name
                </th>
                <th
                  class="p-1.5 font-label-md text-label-md uppercase border-r border-black text-center text-black text-xs"
                >
                  Atk Bonus
                </th>
                <th
                  class="p-1.5 font-label-md text-label-md uppercase border-r border-black text-black text-xs"
                >
                  Damage/Type
                </th>
                <th class="p-1.5 font-label-md text-label-md uppercase text-black text-xs">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody class="font-body-md bg-white text-sm">
              <tr
                v-for="(atk, index) in attacks.slice(0, 4)"
                :key="index"
                class="border-b border-black"
              >
                <td class="p-1.5 border-r border-black h-8 text-black">{{ atk.name }}</td>
                <td class="p-1.5 border-r border-black text-center text-black">
                  {{ atk.bonus >= 0 ? '+' : '' }}{{ atk.bonus }}
                </td>
                <td class="p-1.5 border-r border-black text-black">{{ atk.damage }}</td>
                <td class="p-1.5 text-black text-xs">{{ atk.notes }}</td>
              </tr>
              <!-- Fill empty rows if less than 4 attacks -->
              <tr
                v-for="i in Math.max(0, 4 - attacks.length)"
                :key="'empty-' + i"
                class="border-b border-black"
              >
                <td class="p-1.5 border-r border-black h-8"></td>
                <td class="p-1.5 border-r border-black text-center"></td>
                <td class="p-1.5 border-r border-black"></td>
                <td class="p-1.5"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="border border-black p-2 rounded-sm bg-white">
            <h4
              class="font-label-md text-label-md uppercase mb-1 border-b border-black pb-0.5 text-black text-xs"
            >
              Combat Actions (5.5e)
            </h4>
            <div class="grid grid-cols-1 gap-1 text-[9px] font-label-md">
              <div class="mb-0.5">
                <span class="font-bold uppercase block border-b border-black/10 mb-0.5 text-black"
                  >Actions</span
                >
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-black">
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Attack
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Dash
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Disengage
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Dodge
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Help
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Hide
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Ready
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Search
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Use Object
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Grapple
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Push/Shove
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Magic
                  </div>
                </div>
              </div>
              <div class="mb-0.5">
                <span class="font-bold uppercase block border-b border-black/10 mb-0.5 text-black"
                  >Bonus Actions</span
                >
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-black">
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Magic Action
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Class Feature
                  </div>
                </div>
              </div>
              <div>
                <span class="font-bold uppercase block border-b border-black/10 mb-0.5 text-black"
                  >Movement</span
                >
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-black">
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Move
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Climb/Swim
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Drop Prone
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Crawl
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Stand Up
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1 h-1 bg-black rounded-full"></span>Jump
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory & Equipment Block -->
          <div class="border border-black p-2 rounded-sm bg-white flex flex-col justify-between">
            <h4
              class="font-label-md text-label-md uppercase mb-1 border-b border-black pb-0.5 text-black text-xs"
            >
              Inventory & Equipment
            </h4>
            <div class="flex-1 text-black text-xs overflow-hidden space-y-1">
              <!-- Tri-Currency Row -->
              <div
                class="flex justify-between border-b border-black/10 pb-1 mb-1 font-bold text-[10px]"
              >
                <span>Gold: {{ char?.gold ?? 0 }} GP</span>
                <span>Supply: {{ char?.supply ?? 0 }}</span>
                <span>Influence: {{ char?.influence ?? 0 }}</span>
              </div>
              <!-- Gear List -->
              <div v-if="char?.equippedGear && char.equippedGear.length > 0" class="space-y-0.5">
                <div
                  v-for="item in char.equippedGear.slice(0, 3)"
                  :key="item.id"
                  class="flex justify-between text-[10px]"
                >
                  <span class="truncate font-medium">⚔️ {{ item.name }}</span>
                  <span class="text-black/60 shrink-0">Cost: {{ item.slotCost }}</span>
                </div>
              </div>
              <!-- Consumables List -->
              <div
                v-if="char?.consumables && char.consumables.length > 0"
                class="space-y-0.5 pt-1 border-t border-black/10"
              >
                <div
                  v-for="item in char.consumables.slice(0, 3)"
                  :key="item.id"
                  class="flex justify-between text-[10px]"
                >
                  <span class="truncate">🎒 {{ item.name }}</span>
                  <span class="text-black/60 shrink-0">{{ item.usageDie }}</span>
                </div>
              </div>
              <div
                v-if="
                  (!char?.equippedGear || char.equippedGear.length === 0) &&
                  (!char?.consumables || char.consumables.length === 0)
                "
                class="text-black/50 italic text-center py-4"
              >
                No equipment or consumables.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

.font-display-lg {
  font-family: 'EB Garamond', serif;
  font-size: 48px;
  line-height: 56px;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.font-headline-lg {
  font-family: 'EB Garamond', serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
}

.font-headline-md {
  font-family: 'EB Garamond', serif;
  font-size: 24px;
  line-height: 32px;
  font-weight: 500;
}

.font-body-md {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
}

.font-label-md {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.05em;
  font-weight: 600;
}

/* Force black borders and text override for all states in print */
@media print {
  @page {
    size: A4;
    margin: 0.5cm;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .printable-sheet-container {
    display: block !important;
    background: white !important;
  }
  .a4-page {
    border: none !important;
    margin: 0 auto !important;
    padding: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
    background: white !important;
    color: black !important;
    min-height: 0 !important;
    height: auto !important;
  }
  .a4-page:not(:last-child) {
    page-break-after: always;
  }
  * {
    color: black !important;
    border-color: black !important;
    background-color: transparent !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }
}

.a4-page {
  width: 210mm;
  min-height: 297mm;
  background: white !important;
  color: black !important;
}
</style>
