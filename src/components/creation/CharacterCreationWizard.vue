<script setup lang="ts">
/**
 * CharacterCreationWizard — guided path for a brand-new character.
 *
 * Steps: species -> class -> background -> abilities -> skills -> ready.
 * Species, class and background show a preview of every option before one is
 * chosen. All legality checks go through `@/domain/creationRules`; the wizard
 * only drives the same store actions the edit-mode sheet uses.
 * Features, starting equipment and spells stay on the sheet (see the "still to
 * do" list on the final step, fed by the completion badges).
 */
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as DND_RULES from '@/data/rules'
import { formatMod } from '@/domain'
import {
  POINT_BUY_BUDGET,
  backgroundBonusFor,
  pointBuyNextCost,
  validateBackgroundBonuses,
  validatePointBuy,
  validateSubChoice,
  validateClassSkillChoices,
} from '@/domain/creationRules'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { useSkills } from '@/composables/useSkills'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { useCelebration } from '@/composables/useCelebration'

type StepId = 'species' | 'class' | 'background' | 'abilities' | 'skills' | 'ready'

const store = useCharacterStore()
const progression = useProgressionStore()
const router = useRouter()
const { trigger } = useCelebration()
const { badges } = useCharacterCompletion()
const { remainingChoices, classSkillOptions, lockedSkills, isSkillDisabled, toggleProficiency, isProficient } =
  useSkills()

const char = computed(() => store.currentCharacterData)

// The store starts with default picks; the wizard only counts a pick once made.
const picked = ref({ species: false, class: false, background: false })

const hasSkillStep = computed(() => !!classSkillOptions.value)
const steps = computed<{ id: StepId; label: string }[]>(() =>
  [
    { id: 'species' as const, label: 'Species' },
    { id: 'class' as const, label: 'Class' },
    { id: 'background' as const, label: 'Background' },
    { id: 'abilities' as const, label: 'Abilities' },
    ...(hasSkillStep.value ? [{ id: 'skills' as const, label: 'Skills' }] : []),
    { id: 'ready' as const, label: 'Ready' },
  ],
)
const index = ref(0)
const step = computed(() => steps.value[index.value]!)
const heading = ref<HTMLElement | null>(null)

// ---- Previews ------------------------------------------------------------
const abilityName = (k: string) => DND_RULES.ABILITIES[k] ?? k

interface Option {
  name: string
  summary: string
  detail: string
}
const options = computed<Option[]>(() => {
  if (step.value.id === 'species') {
    return Object.entries(DND_RULES.SPECIES).map(([name, d]) => ({
      name,
      summary: `Speed ${d.speed} · ${d.traits
        .filter((t) => t.key)
        .map((t) => t.title)
        .join(', ')}`,
      detail: d.description ?? '',
    }))
  }
  if (step.value.id === 'class') {
    return Object.entries(DND_RULES.CLASSES).map(([name, d]) => ({
      name,
      summary: `d${d.hitDice} hit die · Saves ${d.savingThrows.map((s) => s.toUpperCase()).join(', ')}`,
      detail: d.description ?? '',
    }))
  }
  return Object.entries(DND_RULES.BACKGROUNDS).map(([name, d]) => ({
    name,
    summary: `${d.skills.join(', ')} · ${d.feature.title}`,
    detail: d.description ?? '',
  }))
})

const selectedName = computed(() => {
  const id = step.value.id
  if (id !== 'species' && id !== 'class' && id !== 'background') return null
  const key = id === 'species' ? 'species' : id === 'class' ? 'class' : 'background'
  return picked.value[key] ? (char.value[key] ?? null) : null
})

interface Fact {
  title: string
  desc: string
}
/** Full rules text for the option picked on the current step. */
const selectedFacts = computed<Fact[]>(() => {
  const name = selectedName.value
  if (!name) return []
  if (step.value.id === 'species') return DND_RULES.SPECIES[name]?.traits ?? []
  if (step.value.id === 'class') {
    const d = DND_RULES.CLASSES[name]
    const choices = (d?.featureChoices ?? []).map((c) => ({
      title: `Choice: ${c.label}`,
      desc: c.description ?? '',
    }))
    return [...(d?.features ?? []), ...choices]
  }
  const f = DND_RULES.BACKGROUNDS[name]?.feature
  return f ? [f] : []
})

const subChoices = computed(() => {
  const s = char.value.species
  return step.value.id === 'species' && picked.value.species && s
    ? (DND_RULES.SPECIES[s]?.subChoices ?? [])
    : []
})

function choose(name: string): void {
  const id = step.value.id
  if (id === 'species') {
    store.applySpeciesChange(name)
    picked.value.species = true
  } else if (id === 'class') {
    store.applyClassChange(name)
    picked.value.class = true
  } else if (id === 'background') {
    store.applyBackgroundChange(name)
    // Default to the first two offered abilities so a legal pair always exists.
    const offered = DND_RULES.BACKGROUNDS[name]?.abilityScoreIncrease ?? []
    char.value.backgroundBonusSelections = {
      plusTwo: offered[0] ?? null,
      plusOne: offered[1] ?? null,
    }
    progression.recalculateAbilityScores()
    picked.value.background = true
  }
}

// ---- Abilities -----------------------------------------------------------
const offeredAbilities = computed(
  () => DND_RULES.BACKGROUNDS[char.value.background ?? '']?.abilityScoreIncrease ?? [],
)
const selections = computed(() => char.value.backgroundBonusSelections)

function setBonus(kind: 'plusTwo' | 'plusOne', ability: string): void {
  const sel = char.value.backgroundBonusSelections
  if (!sel) return
  const other = kind === 'plusTwo' ? 'plusOne' : 'plusTwo'
  // Picking an ability already used by the other bonus swaps them.
  if (sel[other] === ability) sel[other] = sel[kind]
  sel[kind] = ability
  progression.recalculateAbilityScores()
}

const abilityKeys = computed(() => Object.keys(char.value.pointBuyBaseScores ?? {}))
const pointsLeft = computed(() => progression.pointBuyPointsRemaining)

// ---- Validation ----------------------------------------------------------
const stepErrors = computed<string[]>(() => {
  switch (step.value.id) {
    case 'species':
      return picked.value.species ? validateSubChoice(char.value.species, char.value.subChoice) : ['Choose a species.']
    case 'class':
      return picked.value.class ? [] : ['Choose a class.']
    case 'background':
      return picked.value.background ? [] : ['Choose a background.']
    case 'abilities':
      return [
        ...validatePointBuy(char.value.pointBuyBaseScores),
        ...validateBackgroundBonuses(char.value.background, char.value.backgroundBonusSelections),
      ]
    case 'skills':
      return validateClassSkillChoices(char.value)
    default:
      return []
  }
})
const canAdvance = computed(() => stepErrors.value.length === 0)
const blockedHint = computed(() => {
  if (step.value.id === 'species' && picked.value.species && subChoices.value.length) {
    return `Choose one option for ${char.value.species} to continue.`
  }
  return stepErrors.value[0] ?? ''
})

async function go(delta: number): Promise<void> {
  if (delta > 0 && !canAdvance.value) return
  index.value = Math.min(steps.value.length - 1, Math.max(0, index.value + delta))
  await nextTick()
  heading.value?.focus()
}

// ---- Ready ---------------------------------------------------------------
const todo = computed(() => {
  const routes: Record<string, string> = {
    identity: '/identity',
    skills: '/skills',
    feats: '/feats',
    inventory: '/inventory',
    spells: '/spells',
  }
  return Object.entries(badges.value)
    .filter(([key]) => key !== 'identity' && routes[key])
    .map(([key, b]) => ({ key, label: b.label, to: routes[key]! }))
})

async function finish(to = '/identity'): Promise<void> {
  store.finishCreation()
  trigger('success')
  await router.push(to)
}

/** Drop the guide and keep editing on the full sheet. */
function skipToSheet(): void {
  store.isCreating = false
}

const radioCard =
  'relative flex flex-col gap-1 rounded-xl border p-4 text-left cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tertiary'
const cardState = (on: boolean) =>
  on
    ? 'border-tertiary bg-tertiary/10'
    : 'border-outline-variant bg-surface-container hover:border-tertiary/60'
</script>

<template>
  <section
    class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6 pb-52 md:pb-10"
    data-testid="creation-wizard"
    aria-label="Create your character"
  >
    <header class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-label-md text-label-md text-on-surface-variant" aria-live="polite">
            Step {{ index + 1 }} of {{ steps.length }}
          </p>
          <h2
            ref="heading"
            tabindex="-1"
            class="font-headline-lg text-headline-lg text-tertiary focus:outline-none"
          >
            <template v-if="step.id === 'species'">Choose your species</template>
            <template v-else-if="step.id === 'class'">Choose your class</template>
            <template v-else-if="step.id === 'background'">Choose your background</template>
            <template v-else-if="step.id === 'abilities'">Set your ability scores</template>
            <template v-else-if="step.id === 'skills'">Choose your skills</template>
            <template v-else>Your character is ready</template>
          </h2>
        </div>
        <button
          type="button"
          class="shrink-0 min-h-11 px-3 font-label-md text-label-md text-primary hover:underline"
          @click="skipToSheet"
        >
          Skip the guide
        </button>
      </div>
      <ol class="flex gap-1.5" aria-label="Progress">
        <li
          v-for="(s, i) in steps"
          :key="s.id"
          class="flex-1"
          :aria-current="i === index ? 'step' : undefined"
        >
          <div
            class="h-1.5 rounded-full"
            :class="i <= index ? 'bg-tertiary' : 'bg-surface-variant'"
          ></div>
          <span
            class="mt-1 hidden sm:block font-label-sm text-label-sm"
            :class="i === index ? 'text-on-surface' : 'text-on-surface-variant'"
            >{{ s.label }}</span
          >
          <span class="sr-only">{{ s.label }}{{ i < index ? ' (done)' : '' }}</span>
        </li>
      </ol>
    </header>

    <!-- Species / class / background: preview every option, then choose -->
    <div v-if="step.id === 'species' || step.id === 'class' || step.id === 'background'" class="flex flex-col gap-6">
      <p class="font-body-md text-body-md text-on-surface-variant">
        <template v-if="step.id === 'species'">Your species sets your speed and innate traits.</template>
        <template v-else-if="step.id === 'class'">Your class sets your hit points, saving throws and core features.</template>
        <template v-else>Your background grants skills, a feat and your ability score bonuses.</template>
      </p>
      <div role="radiogroup" :aria-label="step.label" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          v-for="o in options"
          :key="o.name"
          :class="[radioCard, cardState(selectedName === o.name)]"
        >
          <input
            type="radio"
            class="sr-only"
            :name="`wizard-${step.id}`"
            :value="o.name"
            :checked="selectedName === o.name"
            @change="choose(o.name)"
          />
          <span class="flex items-center justify-between gap-2 font-headline-sm text-headline-sm text-on-surface">
            {{ o.name }}
            <span
              v-if="selectedName === o.name"
              class="material-symbols-outlined text-tertiary"
              aria-hidden="true"
              >check_circle</span
            >
          </span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">{{ o.summary }}</span>
          <span class="font-body-sm text-body-sm text-on-surface line-clamp-2">{{ o.detail }}</span>
        </label>
      </div>

      <div
        v-if="selectedName"
        class="rounded-xl border border-outline-variant bg-surface-container-high p-4 flex flex-col gap-3"
        aria-live="polite"
      >
        <h3 class="font-headline-sm text-headline-sm text-primary">{{ selectedName }}</h3>
        <dl class="flex flex-col gap-2">
          <div v-for="f in selectedFacts" :key="f.title">
            <dt class="font-label-md text-label-md text-on-surface">{{ f.title }}</dt>
            <dd class="font-body-sm text-body-sm text-on-surface-variant">{{ f.desc }}</dd>
          </div>
        </dl>
        <fieldset v-if="subChoices.length" class="flex flex-col gap-2">
          <legend class="font-label-md text-label-md text-on-surface mb-1">
            Choose one option for {{ char.species }}
          </legend>
          <label
            v-for="sc in subChoices"
            :key="sc.id"
            :class="[radioCard, cardState(char.subChoice === sc.id)]"
          >
            <input
              type="radio"
              class="sr-only"
              name="wizard-subchoice"
              :value="sc.id"
              :checked="char.subChoice === sc.id"
              @change="store.applySubChoice(sc.id)"
            />
            <span class="font-label-md text-label-md text-on-surface">{{ sc.label }}</span>
            <span v-if="sc.description" class="font-body-sm text-body-sm text-on-surface-variant">{{ sc.description }}</span>
          </label>
        </fieldset>
      </div>
    </div>

    <!-- Abilities: background bonus + point buy -->
    <div v-else-if="step.id === 'abilities'" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-1 font-label-md text-label-md text-on-surface">
          +2 from {{ char.background }}
          <select
            class="min-h-11 rounded border border-outline-variant bg-surface-container-high p-2 font-body-md text-on-surface"
            :value="selections?.plusTwo ?? ''"
            @change="setBonus('plusTwo', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="a in offeredAbilities" :key="a" :value="a">{{ abilityName(a) }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 font-label-md text-label-md text-on-surface">
          +1 from {{ char.background }}
          <select
            class="min-h-11 rounded border border-outline-variant bg-surface-container-high p-2 font-body-md text-on-surface"
            :value="selections?.plusOne ?? ''"
            @change="setBonus('plusOne', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="a in offeredAbilities" :key="a" :value="a">{{ abilityName(a) }}</option>
          </select>
        </label>
      </div>

      <div class="flex items-baseline justify-between border-b border-primary-container pb-2">
        <h3 class="font-headline-sm text-headline-sm text-primary">Point buy</h3>
        <p
          class="font-label-md text-label-md"
          :class="pointsLeft === 0 ? 'text-primary' : 'text-on-surface'"
          role="status"
        >
          {{ pointsLeft }} of {{ POINT_BUY_BUDGET }} points left
        </p>
      </div>

      <ul class="flex flex-col gap-2">
        <li
          v-for="k in abilityKeys"
          :key="k"
          class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-outline-variant bg-surface-container p-3 sm:grid-cols-[10rem_auto_1fr_auto]"
        >
          <span class="font-label-md text-label-md text-on-surface">{{ abilityName(k) }}</span>
          <div class="flex items-center gap-1 sm:order-none">
            <IconButton
              icon="remove"
              size="sm"
              :label="`Decrease ${abilityName(k)}`"
              :disabled="(char.pointBuyBaseScores[k] ?? 8) <= 8"
              @click="progression.adjustPointBuyScore(k, -1)"
            />
            <span class="min-w-[2ch] text-center font-body-lg text-body-lg font-bold text-on-surface" :aria-label="`Base ${char.pointBuyBaseScores[k]}`">{{
              char.pointBuyBaseScores[k]
            }}</span>
            <IconButton
              icon="add"
              size="sm"
              :label="`Increase ${abilityName(k)}`"
              :disabled="!progression.pointBuyCanIncrementBase(k) || (char.pointBuyBaseScores[k] ?? 8) >= 15"
              @click="progression.adjustPointBuyScore(k, 1)"
            />
          </div>
          <span class="col-span-2 font-body-sm text-body-sm text-on-surface-variant sm:col-span-1">
            <template v-if="pointBuyNextCost(char.pointBuyBaseScores[k] ?? 8) === null">At maximum (15)</template>
            <template v-else>Next point costs {{ pointBuyNextCost(char.pointBuyBaseScores[k] ?? 8) }}</template>
          </span>
          <span class="col-start-2 row-start-1 justify-self-end font-body-md text-body-md text-on-surface sm:col-start-auto sm:row-start-auto">
            <span class="text-on-surface-variant">{{ char.pointBuyBaseScores[k] }} + {{ backgroundBonusFor(k, selections) }} =</span>
            <strong class="ml-1">{{ char.abilityScores[k] }}</strong>
            <span class="ml-1 text-on-surface-variant">({{ formatMod(progression.abilityMods[k] ?? 0) }})</span>
          </span>
        </li>
      </ul>
      <p v-if="pointsLeft > 0" class="font-body-sm text-body-sm text-on-surface-variant">
        You can continue with unspent points; the sheet keeps a reminder until you spend them.
      </p>
    </div>

    <!-- Skills -->
    <div v-else-if="step.id === 'skills'" class="flex flex-col gap-4">
      <p class="font-body-md text-body-md text-on-surface-variant" role="status">
        {{ char.class }} chooses {{ classSkillOptions?.count }} skills.
        <strong class="text-on-surface">{{ remainingChoices }} left to choose.</strong>
        Skills from your background are already included.
      </p>
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <li v-for="(stat, name) in DND_RULES.SKILLS" :key="name">
          <label
            class="flex min-h-11 items-center gap-3 rounded-xl border p-3"
            :class="[
              cardState(isProficient(name)),
              isSkillDisabled(name) && !isProficient(name) ? 'opacity-50' : 'cursor-pointer',
            ]"
          >
            <input
              type="checkbox"
              class="size-5 accent-[var(--color-tertiary)]"
              :checked="isProficient(name)"
              :disabled="isSkillDisabled(name)"
              @change="toggleProficiency(name)"
            />
            <span class="font-body-md text-body-md text-on-surface">{{ name }}</span>
            <span class="ml-auto font-label-sm text-label-sm text-on-surface-variant">
              {{ lockedSkills.includes(name.toLowerCase().replace(/ /g, '')) ? 'Granted' : String(stat).toUpperCase() }}
            </span>
          </label>
        </li>
      </ul>
    </div>

    <!-- Ready -->
    <div v-else class="flex flex-col gap-6" data-testid="creation-ready">
      <label class="flex flex-col gap-1 font-label-md text-label-md text-on-surface">
        Character name
        <input
          v-model="char.name"
          type="text"
          autocomplete="off"
          placeholder="Enter a name"
          class="min-h-11 rounded border border-outline-variant bg-surface-container-high p-2 font-body-md text-on-surface"
        />
      </label>
      <dl class="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant bg-surface-container p-4 sm:grid-cols-3">
        <div>
          <dt class="font-label-sm text-label-sm text-on-surface-variant">Species</dt>
          <dd class="font-body-md text-body-md text-on-surface">{{ store.displaySpeciesName }}</dd>
        </div>
        <div>
          <dt class="font-label-sm text-label-sm text-on-surface-variant">Class</dt>
          <dd class="font-body-md text-body-md text-on-surface">{{ char.class }}</dd>
        </div>
        <div>
          <dt class="font-label-sm text-label-sm text-on-surface-variant">Background</dt>
          <dd class="font-body-md text-body-md text-on-surface">{{ char.background }}</dd>
        </div>
        <div>
          <dt class="font-label-sm text-label-sm text-on-surface-variant">Hit points</dt>
          <dd class="font-body-md text-body-md text-on-surface">{{ progression.maxHp }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="font-label-sm text-label-sm text-on-surface-variant">Ability scores</dt>
          <dd class="font-body-md text-body-md text-on-surface">
            <span v-for="k in abilityKeys" :key="k" class="mr-3 whitespace-nowrap">{{ k.toUpperCase() }} {{ char.abilityScores[k] }}</span>
          </dd>
        </div>
      </dl>
      <div v-if="todo.length">
        <h3 class="font-headline-sm text-headline-sm text-primary mb-2">Still to do on the sheet</h3>
        <ul class="flex flex-col gap-1">
          <li v-for="t in todo" :key="t.key" class="font-body-md text-body-md text-on-surface-variant">
            {{ t.label }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <footer
      class="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-gutter pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:static md:border-0 md:bg-transparent md:p-0"
    >
      <p v-if="!canAdvance && blockedHint" class="font-body-sm text-body-sm text-on-surface-variant" role="status">
        {{ blockedHint }}
      </p>
      <div class="flex items-center justify-between gap-3">
        <PressableButton variant="secondary" class="min-h-11 px-5" :disabled="index === 0" @click="go(-1)">
          Back
        </PressableButton>
        <template v-if="step.id === 'ready'">
          <div class="flex flex-1 flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
            <PressableButton variant="secondary" class="min-h-11 px-5" @click="finish('/inventory')">
              Choose starting equipment
            </PressableButton>
            <PressableButton variant="primary" class="min-h-11 px-5" @click="finish()">
              Open character sheet
            </PressableButton>
          </div>
        </template>
        <PressableButton v-else variant="primary" class="min-h-11 px-6" :disabled="!canAdvance" @click="go(1)">
          Next
        </PressableButton>
      </div>
    </footer>
  </section>
</template>
