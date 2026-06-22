<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()

const strScore = computed(() => store.currentCharacterData.abilityScores['str'] || 10)
const maxSlots = computed(() => Math.max(10, strScore.value))

const usedSlots = computed(() => {
  let cost = 0
  const gear = store.currentCharacterData.equippedGear || []
  const consumables = store.currentCharacterData.consumables || []
  gear.forEach(item => cost += (item.slotCost || 0))
  consumables.forEach(item => cost += (item.slotCost || 0))
  return cost
})

const slotPercentage = computed(() => {
  const percent = (usedSlots.value / maxSlots.value) * 100
  return Math.min(100, Math.max(0, percent))
})

const buySupply = () => {
  if (store.currentCharacterData.gold >= 1) {
    store.currentCharacterData.gold -= 1
    store.currentCharacterData.supply = (store.currentCharacterData.supply || 0) + 1
  }
}

const addConsumable = () => {
  store.currentCharacterData.consumables.push({
    id: crypto.randomUUID(), name: 'New Consumable', type: 'Item', slotCost: 1, usageDie: 'd8'
  })
}

const removeConsumable = (idx: number) => { store.currentCharacterData.consumables.splice(idx, 1) }

const addGear = () => {
  store.currentCharacterData.equippedGear.push({
    id: crypto.randomUUID(), name: 'New Item', type: 'Gear', description: 'Description', slotCost: 1, theme: 'default'
  })
}

const removeGear = (idx: number) => { store.currentCharacterData.equippedGear.splice(idx, 1) }

const getGearBgClass = (theme?: string) => {
  if (theme === 'parchment-bg' || theme === 'parchment') return 'parchment-bg text-[#15130b]'
  if (theme === 'deep-teal-bg' || theme === 'deep-teal') return 'deep-teal-bg text-on-primary-container'
  return 'bg-surface-container text-on-surface'
}
</script>

<style scoped>
.parchment-bg { background-color: #e8e2d4; color: #15130b; }
.deep-teal-bg { background-color: #1a3c40; color: #84a6aa; }
.stat-orb { background: linear-gradient(145deg, #37352b, #1e1c13); border: 1px solid theme('colors.tertiary-container'); }
</style>

<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Tri-Currency Dashboard -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-card-gap lg:grid-cols-3">
      <!-- Gold -->
      <div class="bg-surface-container p-4 rounded border border-[#1A3C40] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 stat-orb rounded-full flex items-center justify-center text-tertiary">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">monetization_on</span>
          </div>
          <div>
            <h2 class="font-label-md text-label-md text-on-surface-variant">Gold (GP)</h2>
            <input v-if="store.isEditing" type="number" v-model="store.currentCharacterData.gold" class="w-20 bg-background border border-[#1A3C40] rounded text-on-surface p-1 text-headline-lg font-headline-lg" />
            <span v-else class="font-headline-lg text-headline-lg text-tertiary">{{ store.currentCharacterData.gold }}</span>
          </div>
        </div>
      </div>
      <!-- Supply -->
      <div class="bg-surface-container p-4 rounded border border-[#1A3C40] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-secondary-container text-secondary border border-secondary">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
          </div>
          <div>
            <h2 class="font-label-md text-label-md text-on-surface-variant">Supply</h2>
            <input v-if="store.isEditing" type="number" v-model="store.currentCharacterData.supply" class="w-20 bg-background border border-[#1A3C40] rounded text-on-surface p-1 text-headline-lg font-headline-lg" />
            <span v-else class="font-headline-lg text-headline-lg text-secondary">{{ store.currentCharacterData.supply }}</span>
          </div>
        </div>
        <button v-if="!store.isEditing" @click="buySupply" :disabled="store.currentCharacterData.gold < 1" class="bg-surface-variant text-on-surface-variant px-3 py-1 rounded font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors border border-outline-variant flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Buy (-1 GP)
        </button>
      </div>
      <!-- Influence -->
      <div class="bg-surface-container p-4 rounded border border-[#1A3C40] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-primary-container text-primary border border-primary">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">stars</span>
          </div>
          <div>
            <h2 class="font-label-md text-label-md text-on-surface-variant">Influence</h2>
            <input v-if="store.isEditing" type="number" v-model="store.currentCharacterData.influence" class="w-20 bg-background border border-[#1A3C40] rounded text-on-surface p-1 text-headline-lg font-headline-lg" />
            <span v-else class="font-headline-lg text-headline-lg text-primary">{{ store.currentCharacterData.influence }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Slot Meter -->
    <section>
      <div class="flex justify-between items-end mb-2">
        <h3 class="font-headline-md text-headline-md text-on-surface">Inventory Slots</h3>
        <span class="font-label-md text-label-md text-tertiary">Used: {{ usedSlots }} / Max: {{ maxSlots }} (STR)</span>
      </div>
      <div class="h-4 bg-surface-container-highest rounded-full overflow-hidden border border-[#1A3C40] flex">
        <div class="h-full bg-tertiary transition-all duration-300" :style="{ width: `\${slotPercentage}%` }"></div>
        <div class="h-full" :style="{ width: `\${100 - slotPercentage}%` }"></div>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant mt-2 text-sm italic">Slots determined by current Strength Score (min 10).</p>
    </section>

    <!-- Tactile Item Grid -->
    <section>
      <div class="flex justify-between items-center mb-4 border-b border-[#1A3C40] pb-2">
        <h3 class="font-headline-md text-headline-md text-on-surface ">Equipped Gear &amp; Artifacts</h3>
        <button v-if="store.isEditing" @click="addGear" class="bg-surface-variant text-on-surface px-3 py-1 rounded flex items-center gap-1 hover:bg-surface-container-high transition-colors">
          <span class="material-symbols-outlined text-sm">add</span> Add Gear
        </button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-card-gap">
        <div v-for="(gear, index) in store.currentCharacterData.equippedGear" :key="gear.id" :class="['p-5 rounded border border-[#1A3C40] relative shadow-md transition-colors', getGearBgClass(gear.theme)]">
          <div v-if="store.isEditing" class="flex flex-col gap-2 mb-2">
            <div class="flex gap-2">
               <input v-model="gear.name" placeholder="Name" class="flex-1 bg-black/20 border border-black/30 rounded p-1 text-inherit" />
               <button @click="removeGear(index)" class="text-error bg-black/20 p-1 rounded hover:bg-error/20"><span class="material-symbols-outlined text-sm">delete</span></button>
            </div>
            <div class="flex gap-2 text-sm">
                <input v-model="gear.type" placeholder="Type" class="flex-1 bg-black/20 border border-black/30 rounded p-1 text-inherit" />
                <input v-model.number="gear.slotCost" type="number" placeholder="Cost" class="w-16 bg-black/20 border border-black/30 rounded p-1 text-inherit" />
            </div>
            <div class="flex gap-2 text-sm">
                <select v-model="gear.theme" class="flex-1 bg-black/20 border border-black/30 rounded p-1 text-inherit">
                  <option value="default">Default</option><option value="parchment">Parchment</option><option value="deep-teal">Deep Teal</option>
                </select>
            </div>
            <textarea v-model="gear.description" placeholder="Description" class="w-full bg-black/20 border border-black/30 rounded p-1 text-inherit text-sm min-h-[60px]"></textarea>
          </div>
          <template v-else>
            <div :class="['absolute top-0 right-0 font-label-md text-label-md px-3 py-1 rounded-bl border-l border-b border-[#1A3C40]', gear.theme === 'parchment' ? 'bg-[#15130b] text-[#e8e2d4]' : gear.theme === 'deep-teal' ? 'bg-[#15130b] text-primary' : 'bg-surface-variant text-on-surface']">
              Cost: {{ gear.slotCost }} Slot{{ gear.slotCost !== 1 ? 's' : '' }}
            </div>
            <div class="flex items-start gap-4 mb-3">
              <div :class="['w-10 h-10 rounded flex items-center justify-center shrink-0', gear.theme === 'parchment' ? 'bg-[#15130b] text-[#e8e2d4]' : gear.theme === 'deep-teal' ? 'bg-[#15130b] text-primary' : 'bg-surface-variant text-on-surface']">
                <span class="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <h4 class="font-headline-md text-headline-md leading-tight">{{ gear.name || 'Unnamed Item' }}</h4>
                <span class="font-label-md text-label-md opacity-80">{{ gear.type || 'Gear' }}</span>
              </div>
            </div>
            <p class="font-body-md text-body-md opacity-90">{{ gear.description || 'No description' }}</p>
          </template>
        </div>
      </div>
      <div v-if="!store.currentCharacterData.equippedGear?.length" class="text-on-surface-variant text-center py-8 italic border border-dashed border-outline-variant rounded">No gear.</div>
    </section>

    <!-- Consumables -->
    <section>
      <div class="flex justify-between items-center mb-4 border-b border-[#1A3C40] pb-2">
        <h3 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2"><span class="material-symbols-outlined">casino</span> Consumables</h3>
        <button v-if="store.isEditing" @click="addConsumable" class="bg-surface-variant px-3 py-1 rounded flex gap-1"><span class="material-symbols-outlined text-sm">add</span></button>
      </div>

      <div class="bg-surface-container rounded border border-[#1A3C40] overflow-hidden">
        <div class="grid grid-cols-12 gap-4 p-4 border-b border-surface-variant bg-surface-container-high font-label-md text-label-md text-on-surface-variant">
          <div class="col-span-6">Item</div><div class="col-span-3 text-center">Cost</div><div class="col-span-3 text-right">Usage Die</div>
        </div>

        <div v-for="(consumable, index) in store.currentCharacterData.consumables" :key="consumable.id" class="grid grid-cols-12 gap-4 p-4 border-b border-surface-variant items-center hover:bg-surface-container-high">
          <div class="col-span-6 flex items-center gap-3">
            <span v-if="!store.isEditing" class="material-symbols-outlined text-on-surface-variant hidden sm:block">category</span>
            <div class="w-full">
              <template v-if="store.isEditing">
                 <input v-model="consumable.name" placeholder="Name" class="w-full bg-background border border-[#1A3C40] rounded p-1 mb-1" />
                 <input v-model="consumable.type" placeholder="Type" class="w-full bg-background border border-[#1A3C40] rounded p-1 text-xs" />
              </template>
              <template v-else>
                <div class="font-body-lg">{{ consumable.name || 'Unnamed' }}</div><div class="font-label-md text-on-surface-variant">{{ consumable.type || 'Consumable' }}</div>
              </template>
            </div>
          </div>
          <div class="col-span-3 text-center">
            <input v-if="store.isEditing" v-model.number="consumable.slotCost" type="number" class="w-16 bg-background border border-[#1A3C40] rounded p-1 text-center" />
            <span v-else>{{ consumable.slotCost }} Slot(s)</span>
          </div>
          <div class="col-span-3 text-right flex items-center justify-end gap-2">
            <select v-model="consumable.usageDie" class="bg-surface-variant border border-outline-variant rounded p-2" :class="{'text-error': consumable.usageDie === 'depleted' || consumable.usageDie === 'd4'}">
              <option value="d20">Ud20</option><option value="d12">Ud12</option><option value="d10">Ud10</option><option value="d8">Ud8</option><option value="d6">Ud6</option><option value="d4">Ud4</option><option value="depleted">Depleted</option>
            </select>
            <button v-if="store.isEditing" @click="removeConsumable(index)" class="text-error p-1 rounded hover:bg-error/10"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Legacy -->
    <section>
      <h3 class="font-headline-md text-headline-md text-on-surface mb-4 border-b border-[#1A3C40] pb-2 flex items-center gap-2"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">backpack</span> Legacy Notes</h3>
      <div class="bg-surface-container p-5 rounded-2xl border border-[#1A3C40] shadow-md relative">
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.equipment" class="w-full bg-background border border-[#1A3C40] rounded-xl p-3 text-on-surface font-body-md min-h-[150px]"></textarea>
        <div v-else class="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap leading-relaxed">{{ store.currentCharacterData.equipment || 'No equipment listed.' }}</div>
      </div>
    </section>
  </div>
</template>
