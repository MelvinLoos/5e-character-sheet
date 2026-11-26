import { buildOptionEmblemSvg, type OptionCategory } from '@/data/optionEmblems'

export type { OptionCategory }

/** 'Folk Hero!' -> 'folk-hero'. */
export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Build-time map of bundled portraits; no runtime probing, so no 404s.
const portraits = import.meta.glob('@/assets/creation/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const portraitByKey: Record<string, string> = {}
for (const [path, url] of Object.entries(portraits)) {
  const m = path.match(/creation\/([^/]+)\/([^/]+)\.webp$/)
  if (m) portraitByKey[`${m[1]}/${m[2]}`] = url
}

export function getLocalPortraitUrl(name: string, category: OptionCategory): string | null {
  return portraitByKey[`${category}/${toSlug(name)}`] ?? null
}

export function getFallbackEmblemSvg(
  name: string,
  category: OptionCategory,
  instance?: string,
): string | null {
  return buildOptionEmblemSvg(toSlug(name), category, instance)
}
