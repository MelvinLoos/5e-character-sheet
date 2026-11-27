import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { CATEGORIES, getOptionDetails, listOptions, type Category } from './catalog'
import { buildCharacter, toolInputSchema, type StartingEquipmentInput } from './buildCharacter'
import type { AccountApi } from './account'
import type { CharacterData } from '@/types/character'

export interface McpDeps {
  /** Persist a finished character; resolves to the new row id. */
  insertCharacter: (data: CharacterData) => Promise<string>
  /** Public origin of the app, used to build the share link. */
  siteUrl: string
}

const INSTRUCTIONS = `Create D&D 5.5e (2024 rules) characters for the Heroes Guild West Marches.
Workflow: list_options -> get_option_details for the chosen class/species/background -> validate_character -> fix errors -> create_character, then give the player the returned link.
House rules: by default Renown Tier 1/2/3 replaces levels (effective level 3/6/10). For one-shots or regular games set progressionMode "level" and level 1-20 instead; subclass unlocks at level 3. Ability scores use 27-point buy (base 8-15); the background's +2/+1 go on top and must be different abilities offered by that background. Only author inputs; HP, AC, proficiency bonus and final scores are computed. Choose skills the class allows; class/background skills are added automatically. Species with sub-choices need subChoice. Class feature choices (subclass, fighting style, invocations) go in featureChoices; get_option_details lists the choice ids, options and counts, and the validate/create summary reports pendingFeatureChoices that are still unfilled - and pendingSkillChoices reports class skill picks still to make in proficiencies.skills. Fill all pending choices before create_character. Spells are free-form and are NOT checked against a catalog; keep them to real 2024 spells for the class. If the player signed in, search_guild_spells / search_guild_feats / list_guilds expose their guild homebrew content; guild spells may be put on the character by name, level and desc.`

const equipmentSchema = {
  type: 'object',
  description:
    'Optional starting equipment selection (class option A/B/C and background option A/B).',
  properties: {
    classOption: { enum: ['A', 'B', 'C'] },
    backgroundOption: { enum: ['A', 'B'] },
    classChoices: {
      type: 'array',
      description: "Picks for the class bundle's choices[] (options A/B), by index.",
      items: {
        type: 'object',
        properties: { choiceIndex: { type: 'integer' }, itemId: { type: 'string' } },
        required: ['choiceIndex', 'itemId'],
      },
    },
    trinket: { type: 'string', description: 'Trinket id (background option A with a trinket).' },
  },
  required: ['classOption', 'backgroundOption'],
}

const characterArgs = {
  type: 'object',
  properties: { character: toolInputSchema, startingEquipment: equipmentSchema },
  required: ['character'],
}

const TOOLS = [
  {
    name: 'list_options',
    description: 'List available options in a rules category with one-line summaries.',
    inputSchema: {
      type: 'object',
      properties: { category: { enum: [...CATEGORIES] } },
      required: ['category'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_option_details',
    description:
      'Full details for one class, species, background, feat or invocation: features, skill choices, sub-choices, ability options and starting equipment.',
    inputSchema: {
      type: 'object',
      properties: { category: { enum: [...CATEGORIES] }, id: { type: 'string' } },
      required: ['category', 'id'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'validate_character',
    description:
      'Check a draft against the authoring schema and creation rules without saving. Returns errors to fix, or a computed summary.',
    inputSchema: characterArgs,
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_character',
    description:
      'Validate and save a character, returning a share link the player opens in the app. Only call once validate_character passes.',
    inputSchema: characterArgs,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  {
    name: 'list_guilds',
    description:
      'Requires sign-in. List the registered guilds (Discord servers) whose homebrew spells and feats are available, with their guild ids.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'search_guild_spells',
    description:
      "Requires sign-in as the player's account. Search guild homebrew spells. Spells you put on a character should come from here or the official 2024 list.",
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Limit to one guild (see list_guilds).' },
        query: { type: 'string', description: 'Text to find in the name or description.' },
        level: { type: 'integer', minimum: 0, maximum: 9 },
        className: {
          type: 'string',
          description: 'Only spells usable by this class, e.g. Wizard.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Default 15.' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'search_guild_feats',
    description: "Requires sign-in as the player's account. Search guild homebrew feats.",
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Default 15.' },
      },
    },
    annotations: { readOnlyHint: true },
  },
]

const text = (value: unknown, isError = false) => ({
  content: [
    {
      type: 'text' as const,
      text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    },
  ],
  isError,
})

export function createMcpServer(deps: McpDeps, account?: AccountApi): Server {
  const server = new Server(
    { name: 'heroes-guild-character-sheet', version: '1.0.0' },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const args = (req.params.arguments ?? {}) as Record<string, unknown>
    switch (req.params.name) {
      case 'list_options': {
        if (!CATEGORIES.includes(args.category as Category)) return text('Unknown category.', true)
        return text(listOptions(args.category as Category))
      }
      case 'get_option_details': {
        if (!CATEGORIES.includes(args.category as Category)) return text('Unknown category.', true)
        const d = getOptionDetails(args.category as Category, String(args.id))
        return d
          ? text(d)
          : text(`No ${args.category} option "${args.id}". Use list_options.`, true)
      }
      case 'validate_character':
      case 'create_character': {
        const result = buildCharacter(
          args.character,
          args.startingEquipment as StartingEquipmentInput | undefined,
        )
        if (!result.character) return text({ valid: false, errors: result.errors }, true)
        if (req.params.name === 'validate_character')
          return text({ valid: true, summary: result.summary })
        const id = await deps.insertCharacter(result.character)
        return text({
          shareUrl: `${deps.siteUrl.replace(/\/$/, '')}/?id=${id}`,
          summary: result.summary,
          notes: [
            'Tell the player to open shareUrl, then use More actions -> Save to library to keep the character.',
            'Spells were not checked against a catalog; the player should review them in the app.',
          ],
        })
      }
      case 'list_guilds':
      case 'search_guild_spells':
      case 'search_guild_feats': {
        if (!account) return text('Sign-in required.', true)
        try {
          if (req.params.name === 'list_guilds') return text(await account.listGuilds())
          const opts = args as Record<string, never>
          return text(
            req.params.name === 'search_guild_spells'
              ? await account.searchSpells(opts)
              : await account.searchFeats(opts),
          )
        } catch (e) {
          return text((e as Error).message, true)
        }
      }
      default:
        return text(`Unknown tool: ${req.params.name}`, true)
    }
  })

  return server
}
