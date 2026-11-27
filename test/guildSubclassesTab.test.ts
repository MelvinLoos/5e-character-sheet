import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GuildSubclassesTab from '../src/components/modals/GuildSubclassesTab.vue'
import { useRulesStore } from '../src/stores/rulesStore'

const hoisted = vi.hoisted(() => ({
  createGuildSubclass: vi.fn(),
  updateGuildSubclass: vi.fn(),
  deleteGuildSubclass: vi.fn(),
  bulkCreateGuildSubclasses: vi.fn(),
  syncGuildContent: vi.fn(),
}))

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn() }))
vi.mock('../src/utils/guildContentManagement', () => ({
  createGuildSubclass: hoisted.createGuildSubclass,
  updateGuildSubclass: hoisted.updateGuildSubclass,
  deleteGuildSubclass: hoisted.deleteGuildSubclass,
  bulkCreateGuildSubclasses: hoisted.bulkCreateGuildSubclasses,
}))
vi.mock('../src/stores/guildContentSyncStore', () => ({
  useGuildContentSyncStore: () => ({ syncGuildContent: hoisted.syncGuildContent }),
}))

const sub = (name: string, guild: string, id: string) => ({
  name,
  parentClass: 'Fighter',
  features: [{ name: `${name} Feature`, level: 3, description: 'x' }],
  _id: id,
  _guild_id: guild,
})

const valid = {
  name: 'Blade Dancer',
  parentClass: 'Fighter',
  features: [{ name: 'Whirl', level: 3, description: 'Spin.' }],
}

describe('GuildSubclassesTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useRulesStore().guildSubclasses = [sub('Mine', 'g1', 'a'), sub('Other', 'g2', 'b')] as never
  })

  const mountTab = () => mount(GuildSubclassesTab, { props: { guildId: 'g1' } })

  it('lists only the active guild subclasses', () => {
    const text = mountTab().text()
    expect(text).toContain('Mine')
    expect(text).not.toContain('Other')
  })

  it('deletes by row id and re-syncs', async () => {
    const wrapper = mountTab()
    await wrapper.get('[aria-label="Delete subclass"]').trigger('click')
    await flushPromises()

    expect(hoisted.deleteGuildSubclass).toHaveBeenCalledWith('a')
    expect(hoisted.syncGuildContent).toHaveBeenCalledWith('g1')
  })

  it('creates from the JSON form and re-syncs', async () => {
    const wrapper = mountTab()
    await wrapper.findAll('button').find((b) => b.text().includes('Add Custom Subclass'))!.trigger('click')
    await wrapper.get('textarea').setValue(JSON.stringify(valid))
    await wrapper.findAll('button').find((b) => b.text().includes('Save Subclass'))!.trigger('click')
    await flushPromises()

    expect(hoisted.createGuildSubclass).toHaveBeenCalledWith({ guild_id: 'g1', data: valid })
    expect(hoisted.syncGuildContent).toHaveBeenCalledWith('g1')
  })

  it('shows save errors without leaving the form', async () => {
    hoisted.createGuildSubclass.mockRejectedValue(new Error('Subclass "Champion" already exists for Fighter'))
    const wrapper = mountTab()
    await wrapper.findAll('button').find((b) => b.text().includes('Add Custom Subclass'))!.trigger('click')
    await wrapper.get('textarea').setValue(JSON.stringify(valid))
    await wrapper.findAll('button').find((b) => b.text().includes('Save Subclass'))!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('already exists for Fighter')
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('reports invalid JSON', async () => {
    const wrapper = mountTab()
    await wrapper.findAll('button').find((b) => b.text().includes('Add Custom Subclass'))!.trigger('click')
    await wrapper.get('textarea').setValue('{nope')
    await wrapper.findAll('button').find((b) => b.text().includes('Save Subclass'))!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid JSON')
    expect(hoisted.createGuildSubclass).not.toHaveBeenCalled()
  })

  it('bulk import validates with the parser before enabling Import', async () => {
    const wrapper = mountTab()
    await wrapper.findAll('button').find((b) => b.text().includes('Bulk Import Subclasses'))!.trigger('click')
    const area = wrapper.get('textarea[aria-label="Bulk subclass JSON"]')
    const button = (label: string) => wrapper.findAll('button').find((b) => b.text() === label)!

    await area.setValue(JSON.stringify({ subclasses: [{ ...valid, parentClass: 'Artificer' }] }))
    await button('Validate').trigger('click')
    expect(wrapper.get('[role="alert"]').text()).toContain('unknown parentClass')
    expect(button('Import').attributes('disabled')).toBeDefined()

    await area.setValue(JSON.stringify({ subclasses: [valid] }))
    await button('Validate').trigger('click')
    expect(wrapper.text()).toContain('Blade Dancer (Fighter)')
    await button('Import').trigger('click')
    await flushPromises()

    expect(hoisted.bulkCreateGuildSubclasses).toHaveBeenCalledWith({
      guild_id: 'g1',
      subclasses: [valid],
    })
    expect(hoisted.syncGuildContent).toHaveBeenCalledWith('g1')
  })
})
