# Adding a New Feature Choice Catalog

This guide explains how to add a "choose N from catalog" feature choice to a class in the Heroes Guild Character Sheet. This is the pattern used for Fighting Styles (Fighter/Paladin), Eldritch Invocations (Warlock), and any future class that lets players pick from a defined list of options.

## Overview

Feature choices are defined in `src/data/rules.ts` on the `featureChoices` array of a `ClassData` entry. They provide a structured way for players to select traits from a curated catalog, with support for:

- **Tier scaling** — the number of choices increases at higher renown tiers
- **Prerequisites** — simple string-based gating (e.g. `"Warlock:level:1"`)
- **Inline options** — options defined directly on the class entry
- **Automatic cleanup** — stale choice traits are removed on class switch

## Step-by-Step Guide

### 1. Define the FeatureChoice on the class

Add a `featureChoices` array to the class entry in `CLASSES`:

```ts
MyClass: {
  // ...existing class properties...
  featureChoices: [
    {
      id: 'my-choice-id',           // Unique ID (kebab-case)
      label: 'My Choice Label',      // Display name
      description: 'Optional description shown to the player.',
      count: 2,                      // Base number of selections
      scalesPerTier: true,           // T2 = +1, T3 = +2 (optional)
      minTier: 1,                    // Minimum tier to unlock (optional)
      options: [ /* see below */ ],
    },
  ],
},
```

### 2. Define Options

Each option is a `FeatureChoiceOption`:

```ts
{
  id: 'option-one',
  label: 'Option One',
  description: 'What this option does.',
  prerequisite: 'MyClass:level:2',  // Optional string prerequisite
  traits: [
    {
      title: 'Trait Name',
      desc: 'Mechanical effect description.',
      key: true,                     // true = shows in Key Features
      featureType: 'Class Feature',
      uses: { total: 1, per: 'Long Rest' },  // Optional uses tracking
    },
  ],
}
```

### 3. Traits

Each option must define at least one `trait` (a `RulesFeature`):

| Property      | Type     | Required | Description                                               |
| ------------- | -------- | -------- | --------------------------------------------------------- |
| `title`       | string   | Yes      | Display name                                              |
| `desc`        | string   | Yes      | Mechanical description                                    |
| `key`         | boolean  | No       | Whether it appears in "Key Features" (default: false)     |
| `featureType` | string   | No       | e.g. `"Class Feature"`                                    |
| `uses`        | object   | No       | `{ total: N, per: "Long Rest" \| "Short Rest" \| ... }`  |
| `minTier`     | number   | No       | Tier gate for the individual trait (1-3)                  |

### 4. Tier Scaling

Set `scalesPerTier: true` to automatically increase the number of selections at higher tiers:

| Tier | Effective Level | Selections (`count: 2`) |
| ---- | --------------- | ------------------------ |
| 1    | 3               | 2                        |
| 2    | 6               | 3 (+1)                   |
| 3    | 10              | 4 (+2)                   |

Set `minTier` on the choice itself to lock the entire catalog behind a tier gate.

### 5. Prerequisites

Options support a simple string prerequisite format: `"ClassName:level:N"`.

```ts
prerequisite: 'Warlock:level:1'  // Requires Warlock level ≥ 1
```

The prerequisite is checked against the character's class and effective level (derived from `TIER_TO_LEVEL`). Options that don't meet prerequisites are silently excluded.

### 6. How It's Consumed

The pipeline works as follows:

1. **`applyFeatureChoice(choiceId, optionIds)`** in `src/stores/character.ts` — called by the UI when the player selects options. Validates against the class's `featureChoices` rules, enforces count limits and prerequisites.
2. **`applyFeatureChoices(char)`** in `src/utils/characterMutations.ts` — replaces all choice-granted traits on the character: removes old traits by title, then re-appends traits for currently selected options.
3. **`applyAllChanges(char)`** — the full pipeline includes `applyFeatureChoices` after class features and species traits.

No UI changes are needed if the choice catalog uses the standard `featureChoices` pattern — the system handles trait rendering through the existing `FeaturesList` component.

### 7. Testing

Add unit tests in `test/feature-choices-mutation.test.ts`:

```ts
describe('applyAllChanges — MyClass choices', () => {
  it('applies choice traits at Tier 1', () => {
    const char = makeChar({
      class: 'MyClass',
      renownTier: 1,
      featureChoices: { 'my-choice-id': ['option-one'] },
    })
    const result = applyAllChanges(char)
    expect(result.features.some((f) => f.title === 'Trait Name')).toBe(true)
  })
})
```

Add class data tests in `test/rules-classes.test.ts`:

```ts
it('has MyChoice featureChoice with N options', () => {
  const choices = CLASSES.MyClass?.featureChoices
  const myChoice = choices?.find((c) => c.id === 'my-choice-id')
  expect(myChoice?.options).toHaveLength(N)
})
```

## Reference Implementation

- **Fighting Style** (Fighter): `src/data/rules.ts` lines 485-533 — simplest example with 3 options
- **Eldritch Invocations** (Warlock): `src/data/rules.ts` lines 931-1021 — full example with 10 options, tier scaling, and prerequisites

## Type Definitions

Key types are in `src/types/rules.ts`:

- `FeatureChoice` — the choice catalog definition
- `FeatureChoiceOption` — a single selectable option
- `RulesFeature` — a trait granted by an option
- `FeatureChoicePrerequisites` — structured prerequisites for external catalogs