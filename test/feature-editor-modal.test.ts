import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FeatureEditorModal from '../src/components/modals/FeatureEditorModal.vue'

describe('FeatureEditorModal (component)', () => {
  it('emits normalized feature on save when resource and grantsSpells are set', async () => {
    const wrapper = mount(FeatureEditorModal, {
      props: {
        isOpen: true,
        feature: {},
        isNew: true,
      },
    })

    // Title and description
    const title = wrapper.find('#feature-title')
    await title.setValue('Test Feature')
    const desc = wrapper.find('#feature-desc')
    await desc.setValue('Does something cool')

    // Toggle hasResource
    const hasResourceCheckbox = wrapper.find('#has-resource')
    await hasResourceCheckbox.setValue(true)

    // Set Max Uses to Proficiency Bonus
    const maxUsesSelect = wrapper.find('#max-uses-type')
    await maxUsesSelect.setValue('pb')

    // Now switch to fixed and set amount
    await maxUsesSelect.setValue('fixed')
    const fixedInput = wrapper.find('#fixed-amount')
    await fixedInput.setValue('3')

    // Set reset to Short Rest
    const resetSelect = wrapper.find('#reset-condition')
    await resetSelect.setValue('Short Rest')

    // Toggle grantsSpells and pick level 1 and cantrip (0)
    const grantsCheckbox = wrapper.find('#grants-spells')
    await grantsCheckbox.setValue(true)
    // Check level 1 and cantrip boxes by finding inputs with value
    const levelOneCheckbox = wrapper.find('input[type="checkbox"][value="1"]')
    await levelOneCheckbox.setValue(true)
    const cantripCheckbox = wrapper.find('input[type="checkbox"][value="0"]')
    await cantripCheckbox.setValue(true)

    // Click Save (Add Feature)
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Feature'))
    expect(saveBtn).toBeTruthy()
    await saveBtn!.trigger('click')

    // Assert emitted save payload
    const saves = wrapper.emitted('save')
    expect(saves).toBeTruthy()
    const payload = saves![0][0]
    expect(payload.title).toBe('Test Feature')
    expect(payload.desc).toBe('Does something cool')
    expect(payload.resource).toBeDefined()
    expect(payload.resource.value).toBe(3)
    expect(payload.resource.reset).toBe('Short Rest')
    expect(payload.grantsSpells).toBe(true)
    expect(Array.isArray(payload.grantedSpellLevels)).toBe(true)
    expect(payload.grantedSpellLevels).toContain(1)
    expect(payload.grantedSpellLevels).toContain(0)
  })
})
