// Standard feat library.
import type { CharacterFeature } from '@/types/character'

/**
 * Standard feats available in the feat library. These are distinct from
 * class-granted features and can be selected by players in the Feats view.
 */
export const FEATS: CharacterFeature[] = [
  {
    title: 'Magic Initiate',
    desc: 'You learn two cantrips and one 1st-level spell from a class spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
    key: false,
    source: 'Feat',
    featureType: 'General Feat',
    grantsSpells: true,
    grantedSpellLevels: [0, 1],
  },
]
