/**
 * useCharacterActions — character library picker and print action shared by the
 * desktop sidebar (ControlPanel) and the mobile "More" sheet (MoreActionsMenu).
 */
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'

interface LibraryCharacter {
  name: string
  [key: string]: unknown
}

export function useCharacterActions() {
  const store = useCharacterStore()

  /** Library grouped by session, as <optgroup>/<option> data. */
  const characterSelectOptions = computed(() =>
    Object.entries(store.characterLibrary).map(([session, chars]) => ({
      label: session,
      options: (chars as unknown as LibraryCharacter[]).map((char) => ({
        text: char.name,
        value: `${session}|${char.name}`,
      })),
    })),
  )

  /** `session|name` of the open character, or '' when none is loaded. */
  const currentCharacterValue = computed(() =>
    store.currentCharacterData ? `${store.sessionName}|${store.currentCharacterData.name}` : '',
  )

  /** Open a library entry, or start a new character for the value `'new'`. Returns whether anything happened. */
  function selectCharacter(value: string): boolean {
    if (value === 'new') {
      store.handleNewCharacter()
      return true
    }
    if (value) {
      store.loadCharacterFromLibrary(value)
      return true
    }
    return false
  }

  /** Print the sheet in view mode, restoring edit mode afterwards. */
  function printSheet(): void {
    const wasEditing = store.isEditing
    if (wasEditing) store.toggleEdit()

    setTimeout(() => {
      window.onafterprint = () => {
        if (wasEditing) store.toggleEdit()
        window.onafterprint = null
      }
      window.print()
    }, 100)
  }

  return { characterSelectOptions, currentCharacterValue, selectCharacter, printSheet }
}
