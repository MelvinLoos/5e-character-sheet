export type OptionCategory = 'class' | 'species' | 'background'

export interface EmblemDefinition {
  accent: string
  accentSoft: string
  svgBody: string
}

export const CLASS_EMBLEMS: Record<string, EmblemDefinition> = {
  barbarian: {
    accent: '#f97316',
    accentSoft: '#7c2d12',
    svgBody: `
      <circle cx="100" cy="66" r="40" fill="url(#accentGrad)" opacity="0.14"/>
      <rect x="96" y="24" width="8" height="104" rx="3" fill="#92400e" stroke="#0f172a" stroke-width="2"/>
      <path d="M96 92 L104 97 M96 101 L104 106 M96 110 L104 115" stroke="#451a03" stroke-width="2.2"/>
      <polygon points="100,12 106,27 94,27" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.5"/>
      <polygon points="100,136 106,127 94,127" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.5"/>
      <path d="M96 50 Q76 48 54 32 C40 52 40 78 54 98 Q76 82 96 80 Z" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M104 50 Q124 48 146 32 C160 52 160 78 146 98 Q124 82 104 80 Z" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M62 41 C53 55 53 75 62 89" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
      <path d="M138 41 C147 55 147 75 138 89" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 34 C43 52 43 78 54 96" fill="none" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M146 34 C157 52 157 78 146 96" fill="none" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M91 46 L109 46 L107 84 L93 84 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <polygon points="100,53 107,65 100,77 93,65" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="100" cy="65" r="2.8" fill="#fef3c7"/>
    `,
  },
  bard: {
    accent: '#ec4899',
    accentSoft: '#831843',
    svgBody: `
      <path d="M140 36 L142 42 L148 44 L142 46 L140 52 L138 46 L132 44 L138 42 Z" fill="url(#accentGrad)"/>
      <path d="M58 52 L59.5 56 L63.5 57.5 L59.5 59 L58 63 L56.5 59 L52.5 57.5 L56.5 56 Z" fill="#fde68a"/>
      <path d="M44 92 C64 76 136 76 156 58" fill="none" stroke="url(#accentGrad)" stroke-width="2" stroke-dasharray="4 4" opacity="0.65"/>
      <g transform="rotate(28 100 78)">
        <rect x="95" y="18" width="10" height="58" rx="3" fill="#92400e" stroke="#fef3c7" stroke-opacity="0.35" stroke-width="1.5"/>
        <path d="M93 18 L107 18 L105 8 L95 8 Z" fill="#78350f"/>
        <line x1="89" y1="12" x2="111" y2="12" stroke="#fcd34d" stroke-width="2" stroke-linecap="round"/>
        <line x1="90" y1="16" x2="110" y2="16" stroke="#fcd34d" stroke-width="2" stroke-linecap="round"/>
        <path d="M100 62 C122 62 132 82 128 104 C124 122 112 132 100 132 C88 132 76 122 72 104 C68 82 78 62 100 62 Z" fill="url(#accentGrad)" stroke="#fef3c7" stroke-opacity="0.5" stroke-width="2"/>
        <circle cx="100" cy="94" r="13" fill="#1e1b4b" stroke="#fde68a" stroke-width="2"/>
        <circle cx="100" cy="94" r="7" fill="none" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="3 2"/>
        <rect x="88" y="114" width="24" height="5" rx="2" fill="#451a03"/>
        <line x1="97" y1="22" x2="97" y2="114" stroke="#fef3c7" stroke-width="1" opacity="0.8"/>
        <line x1="100" y1="22" x2="100" y2="114" stroke="#fef3c7" stroke-width="1" opacity="0.8"/>
        <line x1="103" y1="22" x2="103" y2="114" stroke="#fef3c7" stroke-width="1" opacity="0.8"/>
      </g>
    `,
  },
  cleric: {
    accent: '#facc15',
    accentSoft: '#713f12',
    svgBody: `
      <g stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
        <line x1="100" y1="16" x2="100" y2="28"/>
        <line x1="100" y1="122" x2="100" y2="134"/>
        <line x1="42" y1="75" x2="54" y2="75"/>
        <line x1="146" y1="75" x2="158" y2="75"/>
        <line x1="59" y1="34" x2="67" y2="42"/>
        <line x1="141" y1="34" x2="133" y2="42"/>
        <line x1="59" y1="116" x2="67" y2="108"/>
        <line x1="141" y1="116" x2="133" y2="108"/>
      </g>
      <circle cx="100" cy="75" r="38" fill="url(#accentGrad)" opacity="0.14" stroke="url(#accentGrad)" stroke-width="2"/>
      <path d="M100 32 L110 65 L143 75 L110 85 L100 118 L90 85 L57 75 L90 65 Z" fill="url(#accentGrad)" stroke="#fef9c3" stroke-width="1.5"/>
      <circle cx="100" cy="75" r="13" fill="#0f172a" stroke="#fef08a" stroke-width="2.5"/>
      <circle cx="100" cy="75" r="6" fill="#fef08a"/>
    `,
  },
  druid: {
    accent: '#22c55e',
    accentSoft: '#14532d',
    svgBody: `
      <path d="M116 32 A38 38 0 1 0 116 118 A28 28 0 1 1 116 32 Z" fill="url(#accentGrad)" opacity="0.35"/>
      <path d="M100 124 L100 56" stroke="#a16207" stroke-width="6" stroke-linecap="round"/>
      <path d="M100 72 C84 68 72 56 66 40 M76 58 C66 58 60 54 56 48" fill="none" stroke="#ca8a04" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 72 C116 68 128 56 134 40 M124 58 C134 58 140 54 144 48" fill="none" stroke="#ca8a04" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 44 C86 30 88 18 100 14 C112 18 114 30 100 44 Z" fill="url(#accentGrad)" stroke="#dcfce7" stroke-width="1.5"/>
      <path d="M96 92 C76 92 66 80 68 68 C82 70 92 80 96 92 Z" fill="url(#accentGrad)" stroke="#dcfce7" stroke-width="1.2"/>
      <path d="M104 92 C124 92 134 80 132 68 C118 70 108 80 104 92 Z" fill="url(#accentGrad)" stroke="#dcfce7" stroke-width="1.2"/>
      <circle cx="100" cy="56" r="7" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>
    `,
  },
  fighter: {
    accent: '#94a3b8',
    accentSoft: '#334155',
    svgBody: `
      <g stroke="#0f172a" stroke-width="1.5">
        <g transform="rotate(42 100 75)">
          <polygon points="100,16 105,28 104,106 96,106 95,28" fill="url(#metalGrad)"/>
          <rect x="86" y="104" width="28" height="6" rx="2" fill="#d97706"/>
          <rect x="97" y="110" width="6" height="18" rx="2" fill="#78350f"/>
          <circle cx="100" cy="130" r="5" fill="#d97706"/>
        </g>
        <g transform="rotate(-42 100 75)">
          <polygon points="100,16 105,28 104,106 96,106 95,28" fill="url(#metalGrad)"/>
          <rect x="86" y="104" width="28" height="6" rx="2" fill="#d97706"/>
          <rect x="97" y="110" width="6" height="18" rx="2" fill="#78350f"/>
          <circle cx="100" cy="130" r="5" fill="#d97706"/>
        </g>
      </g>
      <path d="M72 42 L128 42 L128 76 C128 100 100 116 100 116 C100 116 72 100 72 76 Z" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="4"/>
      <path d="M100 46 L100 110 M76 72 L124 72" stroke="#f59e0b" stroke-width="2.5" opacity="0.85"/>
      <polygon points="100,60 110,72 100,84 90,72" fill="#f59e0b"/>
    `,
  },
  monk: {
    accent: '#38bdf8',
    accentSoft: '#0c4a6e',
    svgBody: `
      <circle cx="100" cy="75" r="46" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.7"/>
      <circle cx="100" cy="75" r="34" fill="url(#accentGrad)" opacity="0.14" stroke="url(#accentGrad)" stroke-width="2"/>
      <path d="M100 41 A34 34 0 0 1 100 109 A17 17 0 0 1 100 75 A17 17 0 0 0 100 41 Z" fill="url(#accentGrad)"/>
      <circle cx="100" cy="58" r="5" fill="#0f172a"/>
      <circle cx="100" cy="92" r="5" fill="url(#accentGrad)"/>
      <path d="M100 22 C106 30 106 36 100 40 C94 36 94 30 100 22 Z" fill="#e0f2fe"/>
      <path d="M100 128 C106 120 106 114 100 110 C94 114 94 120 100 128 Z" fill="#e0f2fe"/>
      <path d="M46 75 C54 69 60 69 64 75 C60 81 54 81 46 75 Z" fill="#e0f2fe"/>
      <path d="M154 75 C146 69 140 69 136 75 C140 81 146 81 154 75 Z" fill="#e0f2fe"/>
    `,
  },
  paladin: {
    accent: '#f59e0b',
    accentSoft: '#78350f',
    svgBody: `
      <path d="M76 58 C54 44 38 48 34 62 C46 62 54 66 64 72 C46 72 40 80 42 88 C54 84 64 84 74 86 Z" fill="url(#accentGrad)" opacity="0.85"/>
      <path d="M124 58 C146 44 162 48 166 62 C154 62 146 66 136 72 C154 72 160 80 158 88 C146 84 136 84 126 86 Z" fill="url(#accentGrad)" opacity="0.85"/>
      <path d="M74 36 L126 36 L126 78 C126 104 100 122 100 122 C100 122 74 104 74 78 Z" fill="#1e293b" stroke="url(#accentGrad)" stroke-width="3.5"/>
      <polygon points="100,20 105,34 104,96 96,96 95,34" fill="url(#metalGrad)" stroke="#fef3c7" stroke-width="1"/>
      <path d="M84 82 L116 82 L112 88 L88 88 Z" fill="url(#accentGrad)"/>
      <rect x="97" y="88" width="6" height="16" rx="2" fill="#92400e"/>
      <circle cx="100" cy="107" r="4.5" fill="#fef08a"/>
      <path d="M100 46 L104 56 L114 60 L104 64 L100 74 L96 64 L86 60 L96 56 Z" fill="#fef08a"/>
    `,
  },
  ranger: {
    accent: '#10b981',
    accentSoft: '#064e3b',
    svgBody: `
      <path d="M100 22 L104 34 L116 38 L104 42 L100 54 L96 42 L84 38 L96 34 Z" fill="url(#accentGrad)" opacity="0.45"/>
      <path d="M82 28 C126 42 126 108 82 122" fill="none" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>
      <path d="M82 28 C122 44 122 106 82 122" fill="none" stroke="#fde68a" stroke-width="1.2" opacity="0.6"/>
      <polyline points="82,28 58,75 82,122" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="56" y1="75" x2="142" y2="75" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
      <polygon points="152,75 134,67 138,75 134,83" fill="url(#accentGrad)"/>
      <path d="M54 75 L42 66 L52 66 L62 75 L52 84 L42 84 Z" fill="url(#accentGrad)"/>
    `,
  },
  rogue: {
    accent: '#ef4444',
    accentSoft: '#7f1d1d',
    svgBody: `
      <g transform="rotate(44 100 80)">
        <polygon points="100,14 104,32 103,104 97,104 96,32" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="89" y="102" width="22" height="4.5" rx="2" fill="url(#accentGrad)"/>
        <rect x="97.5" y="106.5" width="5" height="16" rx="2" fill="#334155"/>
        <circle cx="100" cy="124" r="3.5" fill="url(#accentGrad)"/>
      </g>
      <g transform="rotate(-44 100 80)">
        <polygon points="100,14 104,32 103,104 97,104 96,32" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="89" y="102" width="22" height="4.5" rx="2" fill="url(#accentGrad)"/>
        <rect x="97.5" y="106.5" width="5" height="16" rx="2" fill="#334155"/>
        <circle cx="100" cy="124" r="3.5" fill="url(#accentGrad)"/>
      </g>
      <path d="M100 20 C78 24 66 46 64 76 L56 112 C72 120 86 124 100 124 C114 124 128 120 144 112 L136 76 C134 46 122 24 100 20 Z" fill="#1e293b" stroke="#475569" stroke-width="2" stroke-linejoin="round"/>
      <path d="M100 28 C83 34 73 53 75 82 L100 108 L125 82 C127 53 117 34 100 28 Z" fill="#0f172a" stroke="url(#accentGrad)" stroke-opacity="0.75" stroke-width="1.8"/>
      <path d="M100 34 C87 40 80 56 82 78 L100 96 L118 78 C120 56 113 40 100 34 Z" fill="#020617"/>
      <path d="M81 69 Q100 76 119 69 L117 81 L100 96 L83 81 Z" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
      <path d="M83 71 Q100 78 117 71" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" opacity="0.85"/>
      <polygon points="86,58 95,61 88,63" fill="url(#accentGrad)"/>
      <polygon points="114,58 105,61 112,63" fill="url(#accentGrad)"/>
    `,
  },
  sorcerer: {
    accent: '#fb7185',
    accentSoft: '#881337',
    svgBody: `
      <ellipse cx="100" cy="82" rx="48" ry="17" transform="rotate(-24 100 82)" fill="none" stroke="url(#accentGrad)" stroke-width="1.8" opacity="0.55"/>
      <ellipse cx="100" cy="82" rx="48" ry="17" transform="rotate(24 100 82)" fill="none" stroke="#fbbf24" stroke-width="1.8" opacity="0.55"/>
      <path d="M100 18 C110 38 122 48 118 66 C126 58 132 50 133 42 C143 62 141 88 127 106 C119 116 110 122 100 124 C90 122 81 116 73 106 C59 88 57 62 67 42 C68 50 74 58 82 66 C78 48 90 38 100 18 Z" fill="url(#accentGrad)" stroke="#fecdd3" stroke-opacity="0.45" stroke-width="1.5"/>
      <path d="M100 44 C108 60 117 73 113 92 C110 104 105 111 100 114 C95 111 90 104 87 92 C83 73 92 60 100 44 Z" fill="#fbbf24" opacity="0.9"/>
      <path d="M100 66 L105 80 L119 85 L105 90 L100 104 L95 90 L81 85 L95 80 Z" fill="#fff1f2"/>
      <circle cx="100" cy="85" r="4" fill="#fb7185"/>
      <circle cx="62" cy="36" r="2.8" fill="#fde047"/>
      <circle cx="138" cy="36" r="2.8" fill="#fde047"/>
      <circle cx="80" cy="24" r="2" fill="#fff1f2"/>
      <circle cx="120" cy="24" r="2" fill="#fff1f2"/>
    `,
  },
  warlock: {
    accent: '#a855f7',
    accentSoft: '#4c1d95',
    svgBody: `
      <polygon points="100,20 144,98 56,98" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.75"/>
      <polygon points="100,130 144,52 56,52" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.75"/>
      <circle cx="100" cy="75" r="44" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.6"/>
      <path d="M54 75 C70 52 130 52 146 75 C130 98 70 98 54 75 Z" fill="#1e1b4b" stroke="url(#accentGrad)" stroke-width="3"/>
      <circle cx="100" cy="75" r="15" fill="url(#accentGrad)"/>
      <ellipse cx="100" cy="75" rx="4" ry="12" fill="#0f172a"/>
      <circle cx="104" cy="70" r="2.5" fill="#f3e8ff"/>
    `,
  },
  wizard: {
    accent: '#6366f1',
    accentSoft: '#312e81',
    svgBody: `
      <polygon points="100,18 112,38 100,56 88,38" fill="url(#accentGrad)" stroke="#e0e7ff" stroke-width="1.5"/>
      <line x1="100" y1="18" x2="100" y2="56" stroke="#e0e7ff" stroke-width="1" opacity="0.6"/>
      <circle cx="68" cy="36" r="2.5" fill="#c7d2fe"/>
      <circle cx="132" cy="36" r="2.5" fill="#c7d2fe"/>
      <path d="M100 62 L100 72" stroke="#a5b4fc" stroke-width="2" stroke-dasharray="2 2"/>
      <path d="M44 74 C64 66 84 70 100 82 C116 70 136 66 156 74 L152 118 C134 110 116 112 100 124 C84 112 66 110 48 118 Z" fill="#1e293b" stroke="url(#accentGrad)" stroke-width="3"/>
      <path d="M52 78 C68 72 84 76 98 86 L98 118 C84 108 68 106 54 112 Z" fill="#e2e8f0" opacity="0.9"/>
      <path d="M148 78 C132 72 116 76 102 86 L102 118 C116 108 132 106 146 112 Z" fill="#cbd5e1" opacity="0.9"/>
      <line x1="62" y1="88" x2="88" y2="92" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
      <line x1="62" y1="98" x2="86" y2="101" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
      <line x1="138" y1="88" x2="112" y2="92" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
      <line x1="138" y1="98" x2="114" y2="101" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
    `,
  },
}

// Ready for future expansion (Species and Background emblems plug in here).
export const SPECIES_EMBLEMS: Record<string, EmblemDefinition> = {}
export const BACKGROUND_EMBLEMS: Record<string, EmblemDefinition> = {}

const EMBLEM_REGISTRIES: Record<OptionCategory, Record<string, EmblemDefinition>> = {
  class: CLASS_EMBLEMS,
  species: SPECIES_EMBLEMS,
  background: BACKGROUND_EMBLEMS,
}

/**
 * Builds a standalone full-colour inline <svg> for an option, or null when no
 * emblem exists for that category/slug yet. Decorative: the option's visible
 * name is the accessible name, so the SVG is aria-hidden. `instance` keeps
 * gradient ids unique when the same emblem renders more than once on a page.
 */
export function buildOptionEmblemSvg(
  slug: string,
  category: OptionCategory,
  instance = '',
): string | null {
  const def = EMBLEM_REGISTRIES[category]?.[slug]
  if (!def) return null

  const uid = `${category}-${slug}${instance ? `-${instance}` : ''}`
  const body = def.svgBody
    .replaceAll('url(#accentGrad)', `url(#accentGrad-${uid})`)
    .replaceAll('url(#metalGrad)', `url(#metalGrad-${uid})`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="bg-${uid}" cx="50%" cy="48%" r="65%">
      <stop offset="0%" stop-color="${def.accentSoft}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="accentGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${def.accent}" />
      <stop offset="100%" stop-color="#fef3c7" />
    </linearGradient>
    <linearGradient id="metalGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
  </defs>
  <rect width="200" height="150" fill="url(#bg-${uid})" />
  <circle cx="100" cy="75" r="58" fill="none" stroke="${def.accent}" stroke-opacity="0.16" stroke-width="1" />
  <circle cx="100" cy="75" r="52" fill="none" stroke="${def.accent}" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="3 5" />
  <g>${body}</g>
</svg>`
}
