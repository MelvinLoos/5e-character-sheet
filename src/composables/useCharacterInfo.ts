import { computed } from 'vue';
import { useCharacterStore } from '@/stores/character';
import * as DND_RULES from '@/data/rules';

/**
 * Composable that provides formatted information strings for the currently
 * selected Species, Class, and Background.  Used by InfoButton components
 * in the sheet header to show contextual help for each identity choice.
 */
export function useCharacterInfo() {
  const store = useCharacterStore();

  const speciesName = computed(() => store.currentCharacterData?.species ?? '');
  const className = computed(() => store.currentCharacterData?.class ?? '');
  const backgroundName = computed(() => store.currentCharacterData?.background ?? '');

  // ---------------------------------------------------------------------------
  // Species
  // ---------------------------------------------------------------------------
  const speciesInfo = computed(() => {
    const data = DND_RULES.SPECIES[speciesName.value];
    if (!data) return { title: speciesName.value, content: 'No information available' };

    const lines: string[] = [];
    if (data.speed) lines.push(`Speed: ${data.speed}`);
    lines.push('Size: Medium (default for most species)');

    if (data.traits?.length) {
      lines.push('');
      lines.push('Species Traits:');
      for (const trait of data.traits.slice(0, 3)) {
        const desc = trait.desc.length > 80 ? `${trait.desc.substring(0, 80)}...` : trait.desc;
        lines.push(`• ${trait.title}: ${desc}`);
      }
    }

    if (data.description) {
      lines.push('');
      lines.push(data.description);
    }

    return { title: speciesName.value, content: lines.join('\n') };
  });

  // ---------------------------------------------------------------------------
  // Class
  // ---------------------------------------------------------------------------
  const classInfo = computed(() => {
    const data = DND_RULES.CLASSES[className.value];
    if (!data) return { title: className.value, content: 'No information available' };

    const lines: string[] = [];
    lines.push(`Hit Die: d${data.hitDice} (avg ${data.hitDiceAverage})`);

    if (data.savingThrows?.length) {
      const saves = data.savingThrows.map((s: string) => DND_RULES.ABILITIES[s] ?? s);
      lines.push(`Saving Throw Proficiencies: ${saves.join(', ')}`);
    }

    if (data.features?.length) {
      const keyFeatures = data.features.filter((f) => f.key);
      if (keyFeatures.length) {
        lines.push('');
        lines.push('Key Features:');
        for (const f of keyFeatures.slice(0, 2)) {
          const desc = (f.desc ?? '').length > 100 ? `${f.desc!.substring(0, 100)}...` : (f.desc ?? '');
          lines.push(`• ${f.title}: ${desc}`);
        }
      }
    }

    if (data.description) {
      lines.push('');
      lines.push(data.description);
    }

    return { title: className.value, content: lines.join('\n') };
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------
  const backgroundInfo = computed(() => {
    const data = DND_RULES.BACKGROUNDS[backgroundName.value];
    if (!data) return { title: backgroundName.value, content: 'No information available' };

    const lines: string[] = [];

    if (data.skills?.length) {
      lines.push(`Skill Proficiencies: ${data.skills.join(', ')}`);
    }

    if (data.abilityScoreIncrease?.length) {
      const abilities = data.abilityScoreIncrease.map((s: string) => DND_RULES.ABILITIES[s] ?? s);
      lines.push(`Ability Score Increase Options: ${abilities.join(', ')}`);
      lines.push('(Choose +2 to one, +1 to another)');
    }

    if (data.feature) {
      lines.push('');
      lines.push('Background Feature:');
      const desc = data.feature.desc.length > 100
        ? `${data.feature.desc.substring(0, 100)}...`
        : data.feature.desc;
      lines.push(`• ${data.feature.title}: ${desc}`);
    }

    if (data.description) {
      lines.push('');
      lines.push(data.description);
    }

    return { title: backgroundName.value, content: lines.join('\n') };
  });

  return { speciesInfo, classInfo, backgroundInfo };
}