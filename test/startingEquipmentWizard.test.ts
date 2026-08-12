/**
 * Tests for StartingEquipmentWizard.vue — dynamic step computation & navigation.
 *
 * Issue #151: The wizard always rendered 5 step dots but skipped step 2 (choices)
 * and step 4 (trinket) when not applicable, making the numbering non-sequential.
 *
 * This test suite verifies the new dynamic `availableSteps` computation and
 * `goToNextStep()` / `goToPrevStep()` navigation.
 *
 * Background trinket status:
 *   - Acolyte: trinket: false
 *   - Soldier: trinket: true
 *
 * Class choices status:
 *   - Barbarian: no choices in any option (A, B, or C)
 *   - Fighter: option A has choices, option B has no choices
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import StartingEquipmentWizard from '@/components/creation/StartingEquipmentWizard.vue'

/** Helper: set up the character store so the wizard becomes visible. */
function setupWizardVisible(className: string, backgroundName: string) {
  const store = useCharacterStore()

  store.currentCharacterData.class = className
  store.currentCharacterData.background = backgroundName
  store.currentCharacterData.equippedGear = []
  store.currentCharacterData.consumables = []
  store.currentCharacterData.gold = 0
}

describe('StartingEquipmentWizard — dynamic step computation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Step Count Tests
  // ─────────────────────────────────────────────────────────────────────────

  it('renders 3 step dots when class has no choices and background has no trinket', () => {
    setupWizardVisible('Barbarian', 'Acolyte')

    const wrapper = mount(StartingEquipmentWizard)
    const stepDots = wrapper.findAll('.w-8.h-8.rounded-full')
    expect(stepDots).toHaveLength(3)
    expect(stepDots[0].text()).toContain('1')
    expect(stepDots[1].text()).toContain('2')
    expect(stepDots[2].text()).toContain('3')
  })

  it('renders 4 step dots when class HAS choices but background has no trinket', () => {
    setupWizardVisible('Fighter', 'Acolyte')

    const wrapper = mount(StartingEquipmentWizard)
    const stepDots = wrapper.findAll('.w-8.h-8.rounded-full')
    expect(stepDots).toHaveLength(4)
  })

  it('renders 4 step dots when class has no choices but background HAS trinket', () => {
    setupWizardVisible('Barbarian', 'Soldier')

    const wrapper = mount(StartingEquipmentWizard)
    const stepDots = wrapper.findAll('.w-8.h-8.rounded-full')
    expect(stepDots).toHaveLength(4)
  })

  it('renders 5 step dots when class HAS choices AND background HAS trinket', () => {
    setupWizardVisible('Fighter', 'Soldier')

    const wrapper = mount(StartingEquipmentWizard)
    const stepDots = wrapper.findAll('.w-8.h-8.rounded-full')
    expect(stepDots).toHaveLength(5)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation Tests
  // ─────────────────────────────────────────────────────────────────────────

  it('advances through all available steps when both choices and trinket are present', async () => {
    setupWizardVisible('Fighter', 'Soldier')

    const wrapper = mount(StartingEquipmentWizard)
    const vm = wrapper.vm as InstanceType<typeof StartingEquipmentWizard>

    // Step 1: Class select
    expect(wrapper.text()).toContain('Choose Your Class Equipment')

    // Select class option A
    vm.selectClassOption('A')
    await wrapper.vm.$nextTick()

    // Click Continue → choices step
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Make Your Equipment Choices')

    // Resolve the first choice
    const bundle = (vm as any).selectedBundle
    if (bundle?.choices?.[0]?.options?.[0]) {
      const firstOption = bundle.choices[0].options[0]
      vm.resolveChoice(0, firstOption.itemId, firstOption.quantity)
      await wrapper.vm.$nextTick()
    }

    // Continue → background step
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Choose Your Background Equipment')

    // Select background option A
    vm.selectBackgroundOption('A')
    await wrapper.vm.$nextTick()

    // Continue → trinket step
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Choose One Tiny Trinket')

    // Select a trinket
    const trinketList = (vm as any).trinketList as Array<{ id: string }>
    if (trinketList.length > 0) {
      vm.selectTrinket(trinketList[0].id)
      await wrapper.vm.$nextTick()
    }

    // Continue → summary
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Equipment Summary')
  })

  it('navigates backward through available steps', async () => {
    setupWizardVisible('Barbarian', 'Acolyte')

    const wrapper = mount(StartingEquipmentWizard)
    const vm = wrapper.vm as InstanceType<typeof StartingEquipmentWizard>

    // Select class option A and advance
    vm.selectClassOption('A')
    await wrapper.vm.$nextTick()

    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Choose Your Background Equipment')

    // Go back
    vm.goToPrevStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Choose Your Class Equipment')
  })

  it('skips trinket step when background has no trinket', async () => {
    setupWizardVisible('Fighter', 'Acolyte')

    const wrapper = mount(StartingEquipmentWizard)
    const vm = wrapper.vm as InstanceType<typeof StartingEquipmentWizard>

    // Step 1: Class select
    vm.selectClassOption('A')
    await wrapper.vm.$nextTick()

    // Advance to choices
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Make Your Equipment Choices')

    // Resolve choice
    const bundle = (vm as any).selectedBundle
    if (bundle?.choices?.[0]?.options?.[0]) {
      const firstOption = bundle.choices[0].options[0]
      vm.resolveChoice(0, firstOption.itemId, firstOption.quantity)
      await wrapper.vm.$nextTick()
    }

    // Advance to background
    vm.goToNextStep()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Choose Your Background Equipment')

    // Select background option B and advance — should skip trinket
    vm.selectBackgroundOption('B')
    await wrapper.vm.$nextTick()

    vm.goToNextStep()
    await wrapper.vm.$nextTick()

    // Should be on summary — no trinket step
    expect(wrapper.text()).toContain('Equipment Summary')
    expect(wrapper.text()).not.toContain('Choose One Tiny Trinket')
  })
})