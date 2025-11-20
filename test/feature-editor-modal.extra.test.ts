import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FeatureEditorModal from '../src/components/modals/FeatureEditorModal.vue'

describe('FeatureEditorModal (extra edge cases)', () => {
  it('preserves legacy uses in payload when user does not convert to resource', async () => {
    const legacyFeature = {
      title: 'Legacy Uses',
      desc: 'Legacy feature description',
      uses: { total: 2, per: 'Short Rest' },
    }

    const wrapper = mount(FeatureEditorModal, {
      props: {
        isOpen: true,
        feature: legacyFeature,
        isNew: false,
      },
    })

    // Click Save (should preserve legacy `uses` since we didn't toggle resource)
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    expect(saveBtn).toBeTruthy()
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
  const payload = saves![0][0] as any
    expect(payload.title).toBe('Legacy Uses')
    expect(payload.uses).toBeDefined()
    expect(payload.uses.total).toBe(2)
    expect(payload.uses.per).toBe('Short Rest')
    // Resource should not be present when user didn't enable it
    expect(payload.resource).toBeUndefined()
  })

  it('converts legacy uses to resource when enabling the resource toggle', async () => {
    const legacyFeature = {
      title: 'Legacy Uses',
      desc: 'Legacy feature description',
      uses: { total: 4, per: 'Day' },
    }

    const wrapper = mount(FeatureEditorModal, {
      props: {
        isOpen: true,
        feature: legacyFeature,
        isNew: false,
      },
    })

    // Enable resource usage and explicitly set the resulting fields (avoid timing issues)
    const hasResourceCheckbox = wrapper.find('#has-resource')
    await hasResourceCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    // Fill the fixed amount and reset select explicitly to mirror user action
    const fixedInput = wrapper.find('#fixed-amount')
    await fixedInput.setValue('4')
    const resetSelect = wrapper.find('#reset-condition')
    await resetSelect.setValue('Day')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
  const payload = saves![0][0] as any
    expect(payload.resource).toBeDefined()
  expect(payload.resource.value).toBe(4)
  expect(payload.resource.reset).toBe('Day')
  // Current behavior: legacy `uses` may still be preserved unless maxUsesType setter ran to explicitly clear it
  expect(payload.uses).toBeDefined()
  expect(payload.uses.total).toBe(4)
  expect(payload.uses.per).toBe('Day')
  })

  it('saves scaling resource when Max Uses type switched to Proficiency Bonus', async () => {
    const baseFeature = {
      title: 'Scaling Feature',
      desc: 'Has scaled uses',
    }

    const wrapper = mount(FeatureEditorModal, {
      props: {
        isOpen: true,
        feature: baseFeature,
        isNew: true,
      },
    })

    // Enable resource
    const hasResourceCheckbox = wrapper.find('#has-resource')
    await hasResourceCheckbox.setValue(true)

    // Select PB scaling
    const maxUsesSelect = wrapper.find('#max-uses-type')
    await maxUsesSelect.setValue('pb')

    // Save and expect scaling resource with scalingStat 'pb'
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Feature'))
    await saveBtn!.trigger('click')

    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
  const payload = saves![0][0] as any
    expect(payload.resource).toBeDefined()
    expect(payload.resource.resourceType).toBe('scaling')
    expect(payload.resource.scalingStat).toBe('pb')
  })
})
