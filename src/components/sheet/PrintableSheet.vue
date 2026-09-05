<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useSpellcasting } from '@/composables/useSpellcasting'
import { renderMarkdown } from '@/utils/markdown'
import * as DND_RULES from '@/data/rules'

const store = useCharacterStore()
const { sortedSpells, displaySpellSlots } = useSpellcasting()

const char = computed(() => store.currentCharacterData)

const abilityEntries = computed(() => Object.entries(DND_RULES.ABILITIES))
const skillEntries = computed(() => Object.entries(DND_RULES.SKILLS))

function getAbilityMod(stat: string) {
  const mod = store.abilityMods[stat] ?? 0
  return (mod >= 0 ? '+' : '') + mod
}

function isSkillProficient(name: string) {
  const normName = name.toLowerCase().replace(/ /g, '')
  return char.value.proficiencies.skills.includes(normName)
}

function getSkillMod(name: string, stat: string) {
  const baseMod = store.abilityMods[stat] ?? 0
  const profBonus = isSkillProficient(name) ? store.profBonus : 0
  const total = baseMod + profBonus
  return (total >= 0 ? '+' : '') + total
}

const attacks = computed(() => {
  const arr = char.value?.attacks || []
  return arr.map((atk) => {
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
  })
})

const MAX_PAGE_TWO_FEATURES = 8
const MAX_PAGE_TWO_SPELLS = 8
const MAX_ATTACKS = 6
const MAX_EQUIPPED_GEAR = 6
const MAX_CONSUMABLES = 4

const feats = computed(() => char.value?.features || [])
const pageTwoFeats = computed(() => feats.value.slice(0, MAX_PAGE_TWO_FEATURES))
const pageTwoSpells = computed(() => sortedSpells.value.slice(0, MAX_PAGE_TWO_SPELLS))
const cappedAttacks = computed(() => attacks.value.slice(0, MAX_ATTACKS))
const cappedEquippedGear = computed(() => (char.value?.equippedGear || []).slice(0, MAX_EQUIPPED_GEAR))
const cappedConsumables = computed(() => (char.value?.consumables || []).slice(0, MAX_CONSUMABLES))
const appendixFeatures = computed(() => feats.value.filter((f) => !!f.desc?.trim()))
const appendixSpells = computed(() => sortedSpells.value.filter((s) => !!s.desc?.trim()))
const hasAppendix = computed(() => appendixFeatures.value.length > 0 || appendixSpells.value.length > 0)

function formatSpellLevel(level: number) {
  if (level === 0) return 'Cantrip'
  if (level === 1) return '1st'
  if (level === 2) return '2nd'
  if (level === 3) return '3rd'
  return `${level}th`
}
</script>

<template>
  <div class="printable-sheet-container hidden print:block bg-white text-black p-0 m-0 w-full">
    <!-- PAGE 1: Core Vitals & Skills -->
    <main
      class="a4-page a4-page--fixed p-8 border-black font-body-md text-body-md bg-white text-black overflow-hidden"
      style="width: 210mm; height: 296.5mm; min-height: 296.5mm; max-height: 296.5mm; margin: 0 auto; page-break-after: always"
    >
      <!-- Header -->
      <header class="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 class="font-display-lg text-display-lg leading-none mb-1 tracking-tight text-black uppercase">
            {{ char.name || 'Unnamed Hero' }}
          </h1>
          <p class="font-headline-md text-headline-md text-black">
            {{ store.displaySpeciesName || char.species || 'Species' }}
            {{ char.class || 'Class' }}{{ char.class ? ` ${store.derivedLevel}` : '' }}
          </p>
        </div>
        <div class="text-right uppercase font-bold space-y-1">
          <div class="font-label-md text-label-md text-black">
            Renown:
            <span class="border-b-2 border-black px-2">{{ char.renownTier || 1 }}</span>
          </div>
          <div class="font-label-md text-label-md text-black">
            Job:
            <span class="border-b-2 border-black px-2">{{ char.jobInParty || '—' }}</span>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-12 gap-6">
        <!-- Left Column: Stats & Vitals -->
        <div class="col-span-5 flex flex-col gap-6">
          <!-- Ability Scores -->
          <section class="grid grid-cols-2 gap-3">
            <div
              v-for="[key, label] in abilityEntries"
              :key="key"
              class="border-2 border-black p-2 text-center bg-white"
            >
              <span class="font-label-md text-label-md uppercase block leading-tight text-black">{{ label }}</span>
              <span class="font-headline-lg text-headline-lg text-black">{{ char.abilityScores[key] ?? 10 }}</span>
              <div class="border-t border-black mt-1 py-1 bg-gray-100 text-lg font-headline-md text-headline-md text-black">
                {{ getAbilityMod(key) }}
              </div>
            </div>
          </section>

          <!-- Combat Vitals -->
          <section class="border-4 border-black p-4 space-y-4 bg-white">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="border border-black p-1 bg-white">
                <span class="text-[10px] font-bold block uppercase text-black">Armor Class</span>
                <span class="text-2xl font-headline-lg text-headline-lg text-black">{{ store.computedArmorClass }}</span>
              </div>
              <div class="border border-black p-1 bg-white">
                <span class="text-[10px] font-bold block uppercase text-black">Initiative</span>
                <span class="text-2xl font-headline-lg text-headline-lg text-black">
                  {{ store.initiativeMod >= 0 ? '+' : '' }}{{ store.initiativeMod }}
                </span>
              </div>
              <div class="border border-black p-1 bg-white">
                <span class="text-[10px] font-bold block uppercase text-black">Speed</span>
                <span class="text-2xl font-headline-lg text-headline-lg text-black">{{ store.walkingSpeed }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <div class="flex-grow border border-black p-2 relative bg-white">
                <span class="text-[10px] font-bold block uppercase text-black">Hit Points (Max: {{ store.maxHp }})</span>
                <div class="hp-current-box h-12 border-2 border-dashed border-gray-300 mt-1"></div>
              </div>
              <div class="w-20 border border-black p-2 text-center bg-white">
                <span class="text-[10px] font-bold block uppercase text-black">Proficiency</span>
                <span class="text-2xl font-headline-lg text-headline-lg text-black">+{{ store.profBonus }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: Skills -->
        <div class="col-span-7">
          <section class="border-2 border-black bg-white">
            <h3 class="bg-black text-white px-2 py-1 text-sm font-headline-md text-headline-md uppercase tracking-widest">
              Skills
            </h3>
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="border-b-2 border-black bg-gray-50 uppercase text-[10px]">
                  <th class="px-2 py-1 w-8 text-black">Prof</th>
                  <th class="px-2 py-1 text-black">Skill (Ability)</th>
                  <th class="px-2 py-1 text-right text-black">Bonus</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="([name, stat], index) in skillEntries"
                  :key="name"
                  :class="['border-b border-gray-200', index % 2 === 1 ? 'bg-gray-50' : '']"
                >
                  <td class="px-2 py-1 text-center font-bold">
                    <div
                      :class="[
                        'skill-prof w-3 h-3 border border-black mx-auto',
                        isSkillProficient(name) ? 'skill-prof-filled' : '',
                      ]"
                    ></div>
                  </td>
                  <td class="px-2 py-1 text-black">
                    {{ name }} <span class="text-[10px] text-gray-500 uppercase">({{ stat.toUpperCase() }})</span>
                  </td>
                  <td class="px-2 py-1 text-right font-headline-md text-headline-md text-black">
                    {{ getSkillMod(name, stat) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>

    <!-- PAGE 2: Combat, Magic, & Inventory -->
    <main
      class="a4-page a4-page--fixed p-6 border-black font-body-md text-body-md bg-white text-black overflow-hidden"
      style="width: 210mm; height: 296.5mm; min-height: 296.5mm; max-height: 296.5mm; margin: 0 auto; page-break-after: always"
    >
      <!-- Spellcasting Vitals -->
      <section v-if="displaySpellSlots && Object.keys(displaySpellSlots).length" class="grid grid-cols-2 gap-4 mb-4">
        <div class="border-2 border-black p-2 flex justify-around items-center bg-white">
          <div class="text-center">
            <span class="text-xs font-bold uppercase block text-black">Spell Attack</span>
            <span class="text-2xl font-headline-lg text-headline-lg text-black">
              {{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}
            </span>
          </div>
          <div class="w-px h-10 bg-black"></div>
          <div class="text-center">
            <span class="text-xs font-bold uppercase block text-black">Save DC</span>
            <span class="text-2xl font-headline-lg text-headline-lg text-black">{{ store.spellSaveDC }}</span>
          </div>
        </div>
        <div class="border-2 border-black p-2 bg-white">
          <span class="text-xs font-bold uppercase block mb-1 text-black">Spell Slots</span>
          <div class="flex justify-between gap-1">
            <div v-for="level in [1, 2, 3, 4, 5]" :key="level" class="flex flex-col items-center">
              <span class="text-[10px] font-bold text-black">L{{ level }}</span>
              <div class="flex gap-0.5">
                <div
                  v-for="slotIndex in displaySpellSlots[`level${level}`] || 0"
                  :key="slotIndex"
                  class="w-3.5 h-3.5 border border-black bg-white"
                ></div>
                <div v-if="!(displaySpellSlots[`level${level}`] || 0)" class="text-xs text-black italic">-</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Attacks Table -->
      <section class="border-2 border-black mb-4 bg-white">
        <h3 class="bg-black text-white px-2 py-1 text-sm font-headline-md text-headline-md uppercase tracking-widest">
          Attacks
        </h3>
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="border-b border-black bg-gray-50 uppercase text-[10px]">
              <th class="px-2 py-1 text-black">Name</th>
              <th class="px-2 py-1 text-black">Bonus</th>
              <th class="px-2 py-1 text-black">Damage/Type</th>
              <th class="px-2 py-1 text-black">Notes</th>
            </tr>
          </thead>
            <tbody>
            <tr v-for="atk in cappedAttacks" :key="atk.name" class="border-b border-gray-200">
              <td class="px-2 py-2 font-bold text-black">{{ atk.name }}</td>
              <td class="px-2 py-2 font-headline-md text-headline-md text-black">
                {{ atk.bonus >= 0 ? '+' : '' }}{{ atk.bonus }}
              </td>
              <td class="px-2 py-2 text-black">{{ atk.damage }}</td>
              <td class="px-2 py-2 text-[10px] text-black">{{ atk.notes }}</td>
            </tr>
            <tr v-if="cappedAttacks.length === 0">
              <td colspan="4" class="px-2 py-4 text-center text-black italic">No attacks recorded.</td>
            </tr>
            <tr v-if="(char.attacks || []).length > cappedAttacks.length">
              <td colspan="4" class="px-2 py-1 text-center text-[10px] italic text-gray-500 text-black">
                +{{ (char.attacks || []).length - cappedAttacks.length }} more attacks
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Inventory Summary & Gear -->
      <section class="grid grid-cols-2 gap-4 mb-4">
        <div class="border-2 border-black bg-white">
          <div class="bg-black text-white px-2 py-1 text-[10px] font-headline-md text-headline-md uppercase flex justify-between">
            <span>Inventory & Gear</span>
            <span>Gold: {{ char.gold ?? 0 }}gp</span>
          </div>
          <div class="p-2 space-y-2">
            <div class="flex justify-between text-[10px] font-bold border-b border-black pb-1 text-black">
              <span>Supply: {{ char.supply ?? 0 }}</span>
              <span>Influence: {{ char.influence ?? 0 }}</span>
            </div>
            <ul class="text-[11px] space-y-1">
              <li
                v-for="item in cappedEquippedGear"
                :key="item.id"
                class="flex justify-between items-center border-b border-gray-100 last:border-0"
              >
                <span class="text-black">{{ item.name }}</span>
                <span class="text-[9px] text-gray-500 uppercase">{{ item.slotCost }} slot</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="border-2 border-black bg-white">
          <div class="bg-black text-white px-2 py-1 text-[10px] font-headline-md text-headline-md uppercase">Consumables</div>
          <div class="p-2">
            <ul class="text-[11px] space-y-1">
              <li
                v-for="item in cappedConsumables"
                :key="item.id"
                class="flex justify-between items-center border-b border-gray-100 last:border-0"
              >
                <span class="text-black">{{ item.name }}</span>
                <span class="font-bold text-black">{{ item.usageDie }}</span>
              </li>
            </ul>
            <div v-if="!cappedConsumables.length" class="text-black italic text-center py-2 text-[11px]">
              No consumables.
            </div>
            <div v-if="(char.consumables || []).length > cappedConsumables.length" class="text-[10px] italic text-gray-500 text-black text-center pt-1">
              +{{ (char.consumables || []).length - cappedConsumables.length }} more consumables
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom: Features & Spells Index -->
      <section class="flex-grow grid grid-cols-2 gap-4 min-h-0 overflow-hidden">
        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase border-b border-black text-black">Class Features Index</h3>
          <ul class="text-[10px] space-y-1">
            <li
              v-for="feat in pageTwoFeats"
              :key="feat.title"
              data-testid="page-two-index-item"
              class="flex justify-between text-black"
            >
              <span class="font-bold">{{ feat.title }}</span>
            </li>
            <li v-if="feats.length > pageTwoFeats.length" class="text-[10px] italic text-gray-500 text-black">
              +{{ feats.length - pageTwoFeats.length }} more<span v-if="hasAppendix"> — see Appendix</span>
            </li>
          </ul>
          <div v-if="!feats.length" class="text-black italic text-[10px]">No features recorded.</div>
        </div>
        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase border-b border-black text-black">Spells Index</h3>
          <ul class="text-[10px] space-y-1">
            <li
              v-for="spell in pageTwoSpells"
              :key="spell.id || spell.name"
              data-testid="page-two-index-item"
              class="flex justify-between text-black"
            >
              <span class="font-bold">{{ spell.name }}</span>
              <span class="italic text-gray-500">{{ formatSpellLevel(spell.level) }} {{ spell.school || '' }}</span>
            </li>
            <li v-if="sortedSpells.length > pageTwoSpells.length" class="text-[10px] italic text-gray-500 text-black">
              +{{ sortedSpells.length - pageTwoSpells.length }} more<span v-if="hasAppendix"> — see Appendix</span>
            </li>
          </ul>
          <div v-if="!sortedSpells.length" class="text-black italic text-[10px]">No spells recorded.</div>
        </div>
      </section>

      <div
        v-if="hasAppendix"
        data-testid="appendix-footer"
        class="mt-auto flex-shrink-0 text-center text-[10px] font-bold uppercase py-2 border-t-2 border-black text-black"
      >
        Continues in Appendix
      </div>
    </main>

    <!-- PAGE 3+: The Appendix -->
    <main
      v-if="hasAppendix"
      class="a4-page a4-page--fixed p-6 border-black font-body-md text-body-md bg-white text-black overflow-hidden"
      style="width: 210mm; height: 296.5mm; min-height: 296.5mm; max-height: 296.5mm; margin: 0 auto"
    >
      <header class="border-b-4 border-black pb-4 mb-4">
        <h2 class="font-headline-lg text-headline-lg text-black uppercase tracking-tight">Appendix & Detailed Reference</h2>
        <p class="text-xs italic text-gray-500">Full descriptions for all feats, features, and spells.</p>
      </header>

      <div class="space-y-4">
        <article
          v-for="feat in appendixFeatures"
          :key="'appendix-feat-' + feat.title"
          class="border border-black p-3 break-inside-avoid bg-white"
        >
          <header class="flex justify-between items-baseline border-b border-black mb-2 pb-1">
            <h3 class="font-headline-md text-headline-md uppercase text-sm text-black">{{ feat.title }}</h3>
          </header>
          <div
            class="appendix-markdown text-xs leading-relaxed whitespace-pre-wrap text-black"
            v-html="renderMarkdown(feat.desc)"
          ></div>
        </article>

        <article
          v-for="spell in appendixSpells"
          :key="'appendix-spell-' + (spell.id || spell.name)"
          class="border border-black p-3 break-inside-avoid bg-gray-50 bg-opacity-30"
        >
          <header class="flex justify-between items-baseline border-b border-black mb-2 pb-1">
            <h4 class="font-headline-md text-headline-md uppercase text-sm italic text-black">{{ spell.name }}</h4>
            <span class="text-[10px] uppercase font-bold text-black">
              {{ formatSpellLevel(spell.level) }}<span v-if="spell.school"> • {{ spell.school }}</span>
            </span>
          </header>
          <div
            class="appendix-markdown text-xs leading-relaxed whitespace-pre-wrap text-black"
            v-html="renderMarkdown(spell.desc)"
          ></div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

/* Markdown-rendered appendix content (#215). Tailwind's preflight strips
   list styles, so restore them for print. :deep() is required because v-html
   content does not receive the scoped data attribute. */
.appendix-markdown :deep(p) {
  margin: 0.25rem 0;
}

.appendix-markdown :deep(ul),
.appendix-markdown :deep(ol) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

.appendix-markdown :deep(ol) {
  list-style: decimal;
}

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
    margin: 0;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .printable-sheet-container {
    display: block !important;
    background: white !important;
  }
  .a4-page--fixed {
    border: none !important;
    margin: 0 auto !important;
    padding: 0.5cm !important;
    width: 100% !important;
    height: 296.5mm !important;
    min-height: 296.5mm !important;
    max-height: 296.5mm !important;
    box-shadow: none !important;
    background: white !important;
    color: black !important;
    overflow: hidden !important;
  }
  .a4-page:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
  * {
    color: black !important;
    border-color: black !important;
    background-color: transparent !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }
  .skill-prof-filled {
    background-color: black !important;
  }
}

.a4-page--fixed {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 210mm;
  height: 296.5mm;
  min-height: 296.5mm;
  max-height: 296.5mm;
  overflow: hidden;
  background: white !important;
  color: black !important;
}
</style>