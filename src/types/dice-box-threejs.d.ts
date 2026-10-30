/**
 * Type declarations for `@3d-dice/dice-box-threejs`.
 *
 * The published package (v0.0.12) ships an untyped single-file dist, so this
 * covers only the surface `src/composables/useDiceRoller.ts` relies on.
 * @see https://github.com/3d-dice/dice-box-threejs
 */
declare module '@3d-dice/dice-box-threejs' {
  export interface DiceBoxOptions {
    /** Base path for textures and sounds. Default `./`. */
    assetPath?: string
    sounds?: boolean
    shadows?: boolean
    theme_surface?: string
    /** `'none' | 'metal' | 'wood' | 'glass' | 'plastic'` */
    theme_material?: string
    theme_colorset?: string
    theme_texture?: string
    gravity_multiplier?: number
    light_intensity?: number
    baseScale?: number
    /** Toss strength. */
    strength?: number
    onRollComplete?: (result: unknown) => void
  }

  export default class DiceBox {
    /** `container` is a CSS selector; the element must already be laid out. */
    constructor(container: string, options?: DiceBoxOptions)
    /** Creates the WebGL renderer and appends its `<canvas>` to the container. */
    initialize(): Promise<void>
    /** Rolls dice notation (e.g. `4d6`, `1d20@20`) and resolves with the aggregate result. */
    roll(notation: string): Promise<unknown>
    updateConfig(options: DiceBoxOptions): void
  }
}
