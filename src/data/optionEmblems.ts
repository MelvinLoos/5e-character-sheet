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
export const SPECIES_EMBLEMS: Record<string, EmblemDefinition> = {
  aasimar: {
    accent: '#fde047',
    accentSoft: '#713f12',
    svgBody: `
      <circle cx="100" cy="74" r="42" fill="url(#accentGrad)" opacity="0.14"/>
      <ellipse cx="100" cy="30" rx="28" ry="6.5" fill="none" stroke="url(#accentGrad)" stroke-width="3"/>
      <ellipse cx="100" cy="30" rx="22" ry="3.5" fill="none" stroke="#fef9c3" stroke-width="1" opacity="0.7"/>
      <path d="M92 66 C70 44 44 42 32 58 C46 60 56 64 68 70 C48 70 38 78 40 88 C54 84 66 84 78 86 C62 90 54 98 58 106 C72 100 84 94 94 86 Z" fill="url(#accentGrad)" stroke="#fef9c3" stroke-opacity="0.55" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M108 66 C130 44 156 42 168 58 C154 60 144 64 132 70 C152 70 162 78 160 88 C146 84 134 84 122 86 C138 90 146 98 142 106 C128 100 116 94 106 86 Z" fill="url(#accentGrad)" stroke="#fef9c3" stroke-opacity="0.55" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M100 42 L107 66 L130 74 L107 82 L100 118 L93 82 L70 74 L93 66 Z" fill="#fef9c3" stroke="url(#accentGrad)" stroke-width="1.5"/>
      <circle cx="100" cy="74" r="8" fill="#0f172a" stroke="#fde047" stroke-width="2"/>
      <circle cx="100" cy="74" r="3.5" fill="#fef08a"/>
      <circle cx="60" cy="36" r="2" fill="#fef08a"/>
      <circle cx="140" cy="36" r="2" fill="#fef08a"/>
    `,
  },
  dragonborn: {
    accent: '#ef4444',
    accentSoft: '#7f1d1d',
    svgBody: `
      <circle cx="104" cy="74" r="42" fill="url(#accentGrad)" opacity="0.16"/>
      <path d="M134 74 C146 66 156 68 164 62 C158 72 162 78 168 82 C156 84 146 88 134 82 Z" fill="#f97316" opacity="0.85"/>
      <path d="M136 75 C144 71 152 72 158 70 C152 76 154 80 144 80 Z" fill="#fef08a"/>
      <circle cx="164" cy="56" r="2.2" fill="#fde047"/>
      <circle cx="170" cy="72" r="2" fill="#fb923c"/>
      <path d="M74 62 L58 58 L70 72 L54 74 L68 86 L54 92 L68 102 L58 110 L74 114 Z" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M90 48 C74 34 54 24 38 26 C50 36 62 46 78 56 Z" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M84 56 C70 46 56 42 46 46 C58 52 68 58 78 64 Z" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M68 126 C64 98 68 72 82 54 L106 60 C98 78 100 102 112 126 Z" fill="#b91c1c" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M98 78 C95 92 98 110 108 124 L114 124 C104 108 102 92 106 78 Z" fill="#fbbf24" opacity="0.85"/>
      <path d="M96 90 L106 90 M97 101 L108 100 M101 112 L111 110" stroke="#78350f" stroke-width="1.8"/>
      <path d="M98 76 L138 86 L134 94 L106 94 L94 86 Z" fill="#991b1b" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="108,94 102,102 114,95" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.2"/>
      <path d="M80 56 C86 44 104 42 118 48 L146 58 L148 68 L138 72 L106 72 L86 76 Z" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="138,55 148,44 146,59" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="1.4"/>
      <polygon points="136,70 139,79 143,69" fill="#fef9c3" stroke="#0f172a" stroke-width="1"/>
      <polygon points="124,71 127,78 131,71" fill="#fef9c3" stroke="#0f172a" stroke-width="1"/>
      <polygon points="129,85 133,78 136,86" fill="#fef9c3" stroke="#0f172a" stroke-width="1"/>
      <path d="M94 53 L112 55 L108 61 L96 59 Z" fill="#0f172a"/>
      <polygon points="97,55 109,57 104,60" fill="#fde047"/>
      <circle cx="140" cy="63" r="1.8" fill="#0f172a"/>
    `,
  },
  dwarf: {
    accent: '#d97706',
    accentSoft: '#78350f',
    svgBody: `
      <circle cx="100" cy="78" r="44" fill="url(#accentGrad)" opacity="0.16"/>
      <path d="M40 124 C44 102 64 94 100 94 C136 94 156 102 160 124 Z" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="2.5"/>
      <path d="M52 72 C46 96 54 118 72 126 L84 118 L100 132 L116 118 L128 126 C146 118 154 96 148 72 Z" fill="#b45309" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M68 78 L66 122 M84 82 L84 118 M116 82 L116 118 M132 78 L134 122" stroke="#78350f" stroke-width="2.2"/>
      <path d="M74 84 L74 118 M100 84 L100 128 M126 84 L126 118" stroke="#f59e0b" stroke-width="2" opacity="0.75"/>
      <rect x="64" y="106" width="15" height="6" rx="2" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.3"/>
      <rect x="121" y="106" width="15" height="6" rx="2" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.3"/>
      <rect x="91" y="112" width="18" height="7" rx="2" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.3"/>
      <path d="M66 56 L134 56 L132 76 L68 76 Z" fill="#d6a37a" stroke="#0f172a" stroke-width="1.5"/>
      <path d="M72 58 L92 62 M128 58 L108 62" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <circle cx="83" cy="64" r="2.5" fill="#0f172a"/>
      <circle cx="117" cy="64" r="2.5" fill="#0f172a"/>
      <path d="M94 60 L106 60 L109 73 C106 77 94 77 91 73 Z" fill="#c08457" stroke="#78350f" stroke-width="1.5"/>
      <path d="M100 74 C84 70 62 72 46 84 C58 92 78 90 100 84 C122 90 142 92 154 84 C138 72 116 70 100 74 Z" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M58 56 C60 32 78 24 100 24 C122 24 140 32 142 56 Z" fill="url(#metalGrad)" stroke="#0f172a" stroke-width="2"/>
      <path d="M52 50 L148 50 L146 60 L54 60 Z" fill="#1e293b" stroke="url(#accentGrad)" stroke-width="2"/>
      <polygon points="100,32 108,43 100,54 92,43" fill="url(#accentGrad)" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="68" cy="55" r="2" fill="#fef3c7"/>
      <circle cx="132" cy="55" r="2" fill="#fef3c7"/>
    `,
  },
  elf: {
    accent: '#34d399',
    accentSoft: '#064e3b',
    svgBody: `
      <path d="M100 124 A46 46 0 1 1 142 52 A36 36 0 1 0 58 52 A46 46 0 0 1 100 124 Z" fill="url(#accentGrad)" opacity="0.22"/>
      <path d="M100 30 C76 30 64 50 62 84 C60 102 56 112 52 120 L148 120 C144 112 140 102 138 84 C136 50 124 30 100 30 Z" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="2"/>
      <path d="M74 68 C58 64 46 56 36 46 C44 62 56 76 74 82 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M126 68 C142 64 154 56 164 46 C156 62 144 76 126 82 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M68 72 C58 68 50 62 44 54" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M132 72 C142 68 150 62 156 54" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M76 52 C76 38 124 38 124 52 C125 72 116 94 100 102 C84 94 75 72 76 52 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8"/>
      <path d="M76 54 C84 42 94 38 100 42 C106 38 116 42 124 54 C122 36 112 30 100 30 C88 30 78 36 76 54 Z" fill="#0f172a"/>
      <path d="M74 52 Q100 60 126 52" fill="none" stroke="url(#accentGrad)" stroke-width="2.5"/>
      <path d="M100 36 L105 50 L114 54 L105 58 L100 66 L95 58 L86 54 L95 50 Z" fill="url(#accentGrad)" stroke="#ecfdf5" stroke-width="1.2"/>
      <circle cx="100" cy="54" r="3" fill="#ecfdf5"/>
      <path d="M82 70 Q88 66 94 71 Q88 74 82 70 Z" fill="#059669"/>
      <path d="M118 70 Q112 66 106 71 Q112 74 118 70 Z" fill="#059669"/>
      <circle cx="88" cy="70" r="1.4" fill="#ecfdf5"/>
      <circle cx="112" cy="70" r="1.4" fill="#ecfdf5"/>
      <path d="M100 120 C82 114 68 106 60 98 C74 100 88 106 100 114 C112 106 126 100 140 98 C132 106 118 114 100 120 Z" fill="url(#accentGrad)" stroke="#d1fae5" stroke-width="1.2"/>
      <circle cx="56" cy="34" r="2.2" fill="#d1fae5"/>
      <circle cx="144" cy="34" r="2.2" fill="#d1fae5"/>
    `,
  },
  gnome: {
    accent: '#06b6d4',
    accentSoft: '#164e63',
    svgBody: `
      <g transform="translate(62 52)">
        <circle cx="0" cy="0" r="15" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="6 4"/>
        <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#fcd34d" stroke-width="2"/>
        <circle cx="0" cy="0" r="3.5" fill="#fcd34d"/>
      </g>
      <g transform="translate(138 98)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="6 4"/>
        <circle cx="0" cy="0" r="9" fill="#1e293b" stroke="#fcd34d" stroke-width="2"/>
        <circle cx="0" cy="0" r="3" fill="#fcd34d"/>
      </g>
      <circle cx="100" cy="75" r="34" fill="none" stroke="url(#metalGrad)" stroke-width="7" stroke-dasharray="9 6"/>
      <circle cx="100" cy="75" r="28" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
      <polygon points="100,45 122,64 114,96 86,96 78,64" fill="url(#accentGrad)" stroke="#cffafe" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="100,53 113,67 108,88 92,88 87,67" fill="#ecfeff" opacity="0.35"/>
      <line x1="100" y1="45" x2="100" y2="96" stroke="#cffafe" stroke-width="1.2" opacity="0.6"/>
      <line x1="78" y1="64" x2="122" y2="64" stroke="#cffafe" stroke-width="1.2" opacity="0.6"/>
      <path d="M138 40 L140 45 L145 47 L140 49 L138 54 L136 49 L131 47 L136 45 Z" fill="#fef08a"/>
      <circle cx="62" cy="102" r="2.5" fill="#67e8f9"/>
    `,
  },
  goliath: {
    accent: '#60a5fa',
    accentSoft: '#1e3a8a',
    svgBody: `
      <circle cx="100" cy="70" r="42" fill="url(#accentGrad)" opacity="0.14"/>
      <polygon points="36,118 68,58 98,118" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="102,118 132,58 164,118" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="56,120 100,26 144,120" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="100,26 116,60 104,54 100,66 92,54 84,60" fill="#e0f2fe" opacity="0.9"/>
      <path d="M100 62 L114 82 L100 106 L86 82 Z" fill="url(#accentGrad)" opacity="0.25" stroke="url(#accentGrad)" stroke-width="2.5"/>
      <line x1="100" y1="68" x2="100" y2="100" stroke="#e0f2fe" stroke-width="2.5" stroke-linecap="round"/>
      <polyline points="92,78 100,86 108,78" fill="none" stroke="#e0f2fe" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="42" y1="120" x2="158" y2="120" stroke="url(#accentGrad)" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  halfling: {
    accent: '#84cc16',
    accentSoft: '#365314',
    svgBody: `
      <circle cx="100" cy="76" r="42" fill="#f59e0b" opacity="0.14"/>
      <circle cx="100" cy="76" r="38" fill="#78350f" stroke="#d97706" stroke-width="4"/>
      <line x1="82" y1="42" x2="82" y2="110" stroke="#451a03" stroke-width="2"/>
      <line x1="100" y1="38" x2="100" y2="114" stroke="#451a03" stroke-width="2"/>
      <line x1="118" y1="42" x2="118" y2="110" stroke="#451a03" stroke-width="2"/>
      <circle cx="100" cy="76" r="19" fill="#1e293b" stroke="#fbbf24" stroke-width="2.5"/>
      <path d="M100 76 C92 64 96 58 100 62 C104 58 108 64 100 76 Z" fill="url(#accentGrad)"/>
      <path d="M100 76 C92 88 96 94 100 90 C104 94 108 88 100 76 Z" fill="url(#accentGrad)"/>
      <path d="M100 76 C88 68 82 72 86 76 C82 80 88 84 100 76 Z" fill="url(#accentGrad)"/>
      <path d="M100 76 C112 68 118 72 114 76 C118 80 112 84 100 76 Z" fill="url(#accentGrad)"/>
      <circle cx="100" cy="76" r="3" fill="#fef08a"/>
      <path d="M56 96 C50 64 68 34 100 32 C132 34 150 64 144 96" fill="none" stroke="url(#accentGrad)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="56" cy="96" r="3.5" fill="#bef264"/>
      <circle cx="144" cy="96" r="3.5" fill="#bef264"/>
    `,
  },
  human: {
    accent: '#3b82f6',
    accentSoft: '#1e3a8a',
    svgBody: `
      <circle cx="100" cy="75" r="42" fill="#1e293b" fill-opacity="0.7" stroke="url(#accentGrad)" stroke-width="2.5"/>
      <circle cx="100" cy="75" r="34" fill="none" stroke="#93c5fd" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 4"/>
      <polygon points="100,75 124,51 106,75 124,99 100,75 76,99 94,75 76,51" fill="url(#metalGrad)" opacity="0.85"/>
      <polygon points="100,22 109,66 153,75 109,84 100,128 91,84 47,75 91,66" fill="url(#accentGrad)" stroke="#eff6ff" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="100" cy="75" r="11" fill="#0f172a" stroke="#fbbf24" stroke-width="2.5"/>
      <circle cx="100" cy="75" r="5" fill="#fbbf24"/>
      <path d="M52 108 C64 122 80 128 92 128" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M148 108 C136 122 120 128 108 128" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  orc: {
    accent: '#65a30d',
    accentSoft: '#1a2e05',
    svgBody: `
      <circle cx="100" cy="74" r="42" fill="url(#accentGrad)" opacity="0.16"/>
      <path d="M46 124 C52 104 72 98 100 98 C128 98 148 104 154 124 Z" fill="#1e293b" stroke="url(#metalGrad)" stroke-width="2.5"/>
      <circle cx="62" cy="114" r="3" fill="#94a3b8"/>
      <circle cx="138" cy="114" r="3" fill="#94a3b8"/>
      <path d="M68 62 L46 56 L58 76 L68 78 Z" fill="#4d7c0f" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M132 62 L154 56 L142 76 L132 78 Z" fill="#4d7c0f" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M72 40 C78 28 122 28 128 40 L134 74 L126 106 L100 116 L74 106 L66 74 Z" fill="#4d7c0f" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M78 44 C84 36 116 36 122 44 L126 68 L74 68 Z" fill="#65a30d" opacity="0.75"/>
      <path d="M84 32 C90 20 110 20 116 32 L110 38 L90 38 Z" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <path d="M76 46 L86 50 M124 46 L114 50" stroke="#f97316" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M72 78 L84 82 M128 78 L116 82" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M70 58 L96 65 L104 65 L130 58 L126 52 L100 58 L74 52 Z" fill="#365314" stroke="#0f172a" stroke-width="1.5"/>
      <polygon points="77,63 92,66 83,69" fill="#fbbf24" stroke="#0f172a" stroke-width="1"/>
      <polygon points="123,63 108,66 117,69" fill="#fbbf24" stroke="#0f172a" stroke-width="1"/>
      <path d="M94 68 L106 68 L110 80 L100 83 L90 80 Z" fill="#3f6212" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="96" cy="78" r="1.8" fill="#0f172a"/>
      <circle cx="104" cy="78" r="1.8" fill="#0f172a"/>
      <path d="M78 92 Q100 88 122 92 L118 103 Q100 106 82 103 Z" fill="#0f172a"/>
      <path d="M90 92 L93 97 L96 92 M104 92 L107 97 L110 92" fill="#fef3c7"/>
      <path d="M84 103 C72 98 68 86 72 72 C76 84 80 90 90 96 Z" fill="#fef3c7" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M116 103 C128 98 132 86 128 72 C124 84 120 90 110 96 Z" fill="#fef3c7" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
    `,
  },
  tiefling: {
    accent: '#d946ef',
    accentSoft: '#701a75',
    svgBody: `
      <circle cx="100" cy="76" r="40" fill="url(#accentGrad)" opacity="0.16"/>
      <path d="M84 82 C54 78 40 54 48 26 C52 44 64 56 88 64 Z" fill="#1e1b4b" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M116 82 C146 78 160 54 152 26 C148 44 136 56 112 64 Z" fill="#1e1b4b" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M56 54 L66 60 M64 66 L74 70" stroke="#f0abfc" stroke-width="1.5" opacity="0.7"/>
      <path d="M144 54 L134 60 M136 66 L126 70" stroke="#f0abfc" stroke-width="1.5" opacity="0.7"/>
      <polygon points="100,40 124,76 100,114 76,76" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M100 54 C110 68 112 80 100 96 C88 80 90 68 100 54 Z" fill="url(#accentGrad)"/>
      <circle cx="100" cy="78" r="4.5" fill="#fdf4ff"/>
      <polygon points="100,132 108,118 100,122 92,118" fill="url(#accentGrad)"/>
    `,
  },
}
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" class="h-full w-full" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="bg-${uid}" gradientUnits="userSpaceOnUse" cx="100" cy="72" r="130" gradientTransform="translate(100 72) scale(1 0.75) translate(-100 -72)">
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
  <!-- Oversized so the background fills any viewport; the 200x150 emblem stays centered and unstretched. -->
  <rect x="-1000" y="-1000" width="2200" height="2150" fill="url(#bg-${uid})" />
  <circle cx="100" cy="75" r="58" fill="none" stroke="${def.accent}" stroke-opacity="0.16" stroke-width="1" />
  <circle cx="100" cy="75" r="52" fill="none" stroke="${def.accent}" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="3 5" />
  <g>${body}</g>
</svg>`
}
