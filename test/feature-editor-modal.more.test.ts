import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FeatureEditorModal from '../src/components/modals/FeatureEditorModal.vue'

describe('FeatureEditorModal (more edge cases)', () => {
  it('clears legacy uses when user explicitly switches Max Uses type to fixed then back to scaling', async () => {
    const legacyFeature = {
      title: 'Toggle Feature',
      desc: 'Feature with legacy uses',
      uses: { total: 3, per: 'Long Rest' },
    }

    const wrapper = mount(FeatureEditorModal, {
      props: { isOpen: true, feature: legacyFeature, isNew: false },
    })

  // Trigger the computed setter directly so it creates resource from legacy uses and clears `uses`.
  // We assign to the computed property on the VM to simulate a user selecting the Max Uses type
  // even if the UI element isn't rendered yet.
  ;(wrapper.vm as any).maxUsesType = 'fixed'
  await wrapper.vm.$nextTick()
  // Provide the fixed amount
  const fixedInput = wrapper.find('#fixed-amount')
  await fixedInput.setValue('3')
  // Now change to proficiency bonus scaling via the computed setter
  ;(wrapper.vm as any).maxUsesType = 'pb'
  await wrapper.vm.$nextTick()

    // Save
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
    const payload = saves![0][0] as any

    // After explicitly switching types, legacy uses should be cleared in favor of resource/scaling
    expect(payload.resource).toBeDefined()
    expect(payload.resource.resourceType).toBe('scaling')
    expect(payload.resource.scalingStat).toBe('pb')
    // legacy uses should be removed
    expect(payload.uses).toBeUndefined()
  })

  it('normalizes scalingStat to lowercase on save when user chooses an ability modifier', async () => {
    const wrapper = mount(FeatureEditorModal, {
      props: { isOpen: true, feature: {}, isNew: true },
    })

    // Enable resource
    const hasResource = wrapper.find('#has-resource')
    await hasResource.setValue(true)
    await wrapper.vm.$nextTick()

    // Choose STR scaling
    const maxUsesType = wrapper.find('#max-uses-type')
    await maxUsesType.setValue('str')
    await wrapper.vm.$nextTick()

    // Save
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Feature'))
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
    const payload = saves![0][0] as any
    expect(payload.resource).toBeDefined()
    // Normalizer should lowercase scalingStat (already lower-case 'str' expected)
    expect(payload.resource.scalingStat).toBe('str')
  })

  it('saves grantsSpells=false and empty grantedSpellLevels when unchecked', async () => {
    const wrapper = mount(FeatureEditorModal, {
      props: { isOpen: true, feature: {}, isNew: true },
    })

    // Ensure grantsSpells is false by default
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Feature'))
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
    const payload = saves![0][0] as any
    expect(payload.grantsSpells).toBe(false)
    expect(Array.isArray(payload.grantedSpellLevels)).toBe(true)
    expect(payload.grantedSpellLevels.length).toBe(0)
  })
})
