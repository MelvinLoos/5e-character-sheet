import { describe, it, expect } from 'vitest'
// @ts-expect-error - plain ESM CI helper (not part of the app tsconfig project)
import { collectSpecs, summarize } from '../scripts/ci/playwright-report.mjs'

/**
 * Regression coverage for the CI E2E gate (issue #253).
 *
 * Playwright nests tests declared inside `test.describe(...)` under
 * `suites[].suites[]`; the top-level file suite's `specs` array stays empty.
 * The previous gate only read top-level `specs`, so every nested failure was
 * invisible and the E2E job reported success.
 */

interface SpecShape {
  title: string
  ok: boolean
  tests: { projectName: string; results: { error?: { message: string } }[] }[]
}

function spec(title: string, ok: boolean, projectName = 'chromium', message?: string): SpecShape {
  return {
    title,
    ok,
    tests: [{ projectName, results: message ? [{ error: { message } }] : [] }],
  }
}

function describeSuite(title: string, specs: SpecShape[], suites: unknown[] = []) {
  return { title, specs, suites }
}

function fileSuite(title: string, specs: SpecShape[], suites: unknown[] = []) {
  return { title, specs, suites }
}

const report = {
  suites: [
    fileSuite('vue.spec.ts', [spec('visits the app root url', true)]),
    fileSuite('warlock-invocations.spec.ts', [], [
      describeSuite(
        'Warlock Eldritch Invocations',
        [spec('selects invocations', false, 'chromium', 'boom'), spec('persists selections', true)],
        [
          describeSuite('nested deeper', [
            spec('deep failure', false, 'firefox', 'kaboom'),
          ]),
        ],
      ),
    ]),
  ],
}

describe('collectSpecs', () => {
  it('recurses into nested describe suites', () => {
    const titles = collectSpecs(report).map((entry: { spec: SpecShape }) => entry.spec.title)

    expect(titles).toEqual([
      'visits the app root url',
      'selects invocations',
      'persists selections',
      'deep failure',
    ])
  })

  it('records the full suite path for each spec', () => {
    const deep = collectSpecs(report).find(
      (entry: { spec: SpecShape }) => entry.spec.title === 'deep failure',
    )

    expect(deep.path).toContain('Warlock Eldritch Invocations')
    expect(deep.path).toContain('nested deeper')
  })

  it('is defensive about a missing report', () => {
    expect(collectSpecs(undefined)).toEqual([])
    expect(collectSpecs({})).toEqual([])
  })
})

describe('summarize', () => {
  it('counts specs nested inside describe suites', () => {
    const { total, failed, passed } = summarize(report)

    expect(total).toBe(4)
    expect(failed).toBe(2)
    expect(passed).toBe(2)
  })

  it('reports nested failures the old top-level-only gate would have missed', () => {
    // The buggy gate: `suites.flatMap(s => s.specs)` — only the top-level spec.
    const topLevelOnly = report.suites.flatMap((suite) => suite.specs)
    expect(topLevelOnly).toHaveLength(1)
    expect(summarize(report).failed).toBe(2)
  })
})
