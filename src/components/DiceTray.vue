<script setup lang="ts">
/**
 * DiceTray — bottom-sheet dice roller backed by real 3D physics.
 *
 * The 3D engine is lazy-loaded by `useDiceRoller` and created once per session,
 * so this component must stay mounted after the first open (App.vue mounts it on
 * the first FAB tap and never unmounts it). Visibility is toggled with `v-show`
 * rather than `v-if` so the WebGL canvas and the library's internal resize
 * listener survive — reopening reuses the same context.
 *
 * When WebGL is missing or the user prefers reduced motion, the tray degrades to
 * an instant numeric result computed by the same `diceService` helpers.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { DICE_TYPES, MAX_DICE, MAX_MODIFIER } from '@/domain/diceService'
import { canUse3d, useDiceRoller } from '@/composables/useDiceRoller'
import { useDialogBehavior } from '@/composables/useDialogBehavior'
import PressableButton from '@/components/ui/PressableButton.vue'
import IconButton from '@/components/ui/IconButton.vue'

const open = defineModel<boolean>('open', { default: false })

/** Selector (not a ref) so the engine can look the host up on its own. */
const CANVAS_HOST_ID = 'dice-canvas-host'

const faces = ref(20)
const count = ref(1)
const modifier = ref(0)

const { isRolling, lastRoll, isDegraded, ensureReady, roll } = useDiceRoller()

const sheetEl = ref<HTMLElement | null>(null)
/** Static per session: WebGL support and reduced-motion never change mid-session. */
const threeDAvailable = ref(canUse3d())

useDialogBehavior({
  open,
  panel: sheetEl,
  onClose: () => (open.value = false),
})

/** True when the tray is showing instant numeric results instead of 3D dice. */
const showFallbackHint = computed(() => !threeDAvailable.value || isDegraded.value)

function close(): void {
  open.value = false
}

async function handleRoll(): Promise<void> {
  if (isRolling.value) return
  await roll(`#${CANVAS_HOST_ID}`, faces.value, count.value, modifier.value)
}

// Warm the engine on first open so the very first roll tumbles immediately.
// `immediate` covers the case where the tray mounts already open (App.vue sets
// both `diceTrayMounted` and `showDiceTray` in the same tick).
watch(
  open,
  async (isOpen) => {
    if (!isOpen || !threeDAvailable.value) return
    await nextTick()
    await ensureReady(`#${CANVAS_HOST_ID}`)
  },
  { immediate: true },
)

// Swipe-down to dismiss.
let touchStartY = 0
function onTouchStart(event: TouchEvent): void {
  touchStartY = event.changedTouches[0]?.clientY ?? 0
}
function onTouchEnd(event: TouchEvent): void {
  const endY = event.changedTouches[0]?.clientY ?? 0
  if (endY - touchStartY > 60) close()
}

/** Clamp the modifier field into range once the user leaves it. */
function onModifierBlur(): void {
  const value = Number(modifier.value)
  modifier.value = Number.isFinite(value)
    ? Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(value)))
    : 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-show="open"
        class="fixed inset-0 z-modal flex items-end justify-center print:hidden"
        :data-engine="threeDAvailable ? '3d' : 'numeric'"
        data-testid="dice-tray"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          data-testid="dice-backdrop"
          @click="close"
        />

        <section
          ref="sheetEl"
          role="dialog"
          aria-modal="true"
          aria-label="Dice roller"
          tabindex="-1"
          class="relative flex w-full max-w-lg flex-col gap-4 rounded-t-2xl border border-outline-variant bg-surface-container p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-elevation-4 focus:outline-none"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <div class="mx-auto h-1 w-10 rounded-full bg-outline-variant" aria-hidden="true" />

          <header class="flex items-center justify-between gap-4">
            <h2 class="font-headline-md text-headline-md text-tertiary">Dice Roller</h2>
            <IconButton
              icon="close"
              label="Close dice roller"
              size="sm"
              data-modal-close
              data-testid="dice-close"
              @click="close"
            />
          </header>

          <!-- Canvas host: the engine appends its own <canvas> here. -->
          <div
            v-if="threeDAvailable"
            :id="CANVAS_HOST_ID"
            class="h-56 w-full overflow-hidden rounded-xl bg-surface-variant"
          />

          <p
            v-if="showFallbackHint"
            class="font-body-sm text-body-sm text-on-surface-variant"
            data-testid="dice-fallback-hint"
          >
            3D dice aren’t available here — results appear instantly.
          </p>

          <div v-if="lastRoll" class="flex flex-col items-center gap-2" data-testid="dice-result">
            <div
              class="font-display-lg text-6xl text-tertiary drop-shadow-[0_0_16px_rgba(234,194,73,0.6)]"
              data-testid="dice-total"
            >
              {{ lastRoll.total }}
            </div>
            <p class="font-label-md text-label-md text-on-surface-variant" data-testid="dice-notation">
              {{ lastRoll.notation }}
            </p>
            <ul class="flex flex-wrap justify-center gap-1.5" aria-label="Individual dice">
              <li
                v-for="(value, index) in lastRoll.values"
                :key="index"
                class="min-w-7 rounded-md border border-outline-variant bg-surface-container-high px-2 py-0.5 text-center font-label-md text-label-md"
                data-testid="dice-value"
              >
                {{ value }}
              </li>
            </ul>
            <p
              v-if="lastRoll.isNat20"
              class="font-label-lg text-label-lg text-tertiary"
              data-testid="dice-crit"
            >
              Natural 20!
            </p>
            <p
              v-else-if="lastRoll.isNat1"
              class="font-label-lg text-label-lg text-error"
              data-testid="dice-fumble"
            >
              Natural 1
            </p>
          </div>

          <div class="grid grid-cols-7 gap-2" role="group" aria-label="Die type">
            <button
              v-for="die in DICE_TYPES"
              :key="die"
              type="button"
              class="aspect-square rounded-xl border font-label-md text-lg transition-all duration-150 active:scale-95"
              :class="
                faces === die
                  ? 'border-tertiary bg-tertiary/15 text-tertiary'
                  : 'border-outline-variant bg-surface-container-high text-on-surface hover:border-tertiary hover:bg-surface-variant'
              "
              :aria-pressed="faces === die"
              :aria-label="`d${die}`"
              :data-testid="`dice-d${die}`"
              @click="faces = die"
            >
              d{{ die }}
            </button>
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="font-label-md text-label-md text-on-surface-variant">Dice</span>
              <PressableButton
                variant="secondary"
                size="sm"
                aria-label="One fewer die"
                :disabled="count <= 1"
                data-testid="dice-count-down"
                @click="count--"
              >
                −
              </PressableButton>
              <span class="min-w-[2ch] text-center font-label-md text-label-md" data-testid="dice-count">
                {{ count }}
              </span>
              <PressableButton
                variant="secondary"
                size="sm"
                aria-label="One more die"
                :disabled="count >= MAX_DICE"
                data-testid="dice-count-up"
                @click="count++"
              >
                +
              </PressableButton>
            </div>
            <label class="flex items-center gap-2">
              <span class="font-label-md text-label-md text-on-surface-variant">Mod</span>
              <input
                v-model.number="modifier"
                type="number"
                inputmode="numeric"
                :min="-MAX_MODIFIER"
                :max="MAX_MODIFIER"
                class="w-20 rounded-lg border border-outline-variant bg-surface-container-high px-2 py-1 text-center font-label-md text-label-md text-on-surface"
                aria-label="Roll modifier"
                data-testid="dice-modifier"
                @blur="onModifierBlur"
              />
            </label>
          </div>

          <PressableButton
            variant="primary"
            class="w-full"
            :loading="isRolling"
            :disabled="isRolling"
            data-testid="dice-roll"
            @click="handleRoll"
          >
            {{ isRolling ? 'Rolling…' : `Roll ${count}d${faces}` }}
          </PressableButton>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop fades; only the sheet itself slides. */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 220ms ease-out;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active > section,
.sheet-leave-active > section {
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-enter-from > section,
.sheet-leave-to > section {
  transform: translateY(100%);
}
</style>
