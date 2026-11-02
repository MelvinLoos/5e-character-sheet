#!/usr/bin/env node
/**
 * Playwright JSON-report helpers for CI (issue #253).
 *
 * Playwright's JSON reporter nests tests declared inside `test.describe(...)`
 * under `suites[].suites[]`; the top-level *file* suite's `specs` array is
 * empty. Any pass/fail gate that only reads top-level `specs` therefore misses
 * nested failures — which is exactly how the E2E CI job stayed green while the
 * suite was failing. Everything here walks the suite tree recursively.
 *
 * Usage:
 *   node scripts/ci/playwright-report.mjs pw-results.json             # gate: prints failures, exits 1 on any
 *   node scripts/ci/playwright-report.mjs pw-results.json --markdown  # summary: prints Markdown, always exits 0
 */
import { readFileSync, existsSync, statSync } from 'node:fs'

/**
 * Recursively collect every spec in a Playwright JSON report.
 *
 * @param {unknown} report Parsed Playwright JSON report.
 * @returns {{ spec: Record<string, unknown>, path: string }[]} Specs with their suite path.
 */
export function collectSpecs(report) {
  const out = []

  const walk = (suites, path) => {
    for (const suite of suites || []) {
      const here = suite.title ? (path ? `${path} › ${suite.title}` : suite.title) : path
      for (const spec of suite.specs || []) out.push({ spec, path: here })
      walk(suite.suites, here)
    }
  }

  walk(report && report.suites, '')
  return out
}

/**
 * Summarize a Playwright JSON report, including failures nested in describe suites.
 *
 * @param {unknown} report Parsed Playwright JSON report.
 * @returns {{ total: number, passed: number, failed: number, failures: { spec: Record<string, unknown>, path: string }[] }}
 */
export function summarize(report) {
  const all = collectSpecs(report)
  const failures = all.filter((entry) => !entry.spec.ok)
  return {
    total: all.length,
    passed: all.length - failures.length,
    failed: failures.length,
    failures,
  }
}

/** First few lines of a spec's error message, or an empty string. */
function failureMessage(spec) {
  const test = (spec.tests && spec.tests[0]) || {}
  const error = test.results && test.results[0] && test.results[0].error
  if (!error || !error.message) return ''
  return error.message.split('\n').slice(0, 3).join('\n')
}

/** Human-readable failure lines, printed to the job log so failures are always visible. */
function failureLines(failures) {
  return failures.map(({ spec, path }) => {
    const test = (spec.tests && spec.tests[0]) || {}
    const project = test.projectName || '?'
    const message = failureMessage(spec)
    const header = `  ❌ [${project}] ${path} › ${spec.title}`
    return message ? `${header}\n     ${message.replace(/\n/g, '\n     ')}` : header
  })
}

function readReport(file) {
  if (!existsSync(file) || !statSync(file).size) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--')) || 'pw-results.json'
  const markdown = args.includes('--markdown')

  const report = readReport(file)

  if (!report) {
    const msg = `E2E report missing, empty, or unparseable: ${file}`
    if (markdown) {
      process.stdout.write(`## ❌ E2E Tests\n\n${msg}\n`)
      process.exit(0)
    }
    console.error(msg)
    process.exit(1)
  }

  const { total, passed, failed, failures } = summarize(report)

  if (markdown) {
    const icon = failed === 0 ? '✅' : '❌'
    const lines = [`## ${icon} E2E Tests (${passed}/${total} passed)`, '']
    for (const { spec, path } of failures) {
      const test = (spec.tests && spec.tests[0]) || {}
      const project = test.projectName || '?'
      lines.push(`- ❌ [${project}] ${path} › ${spec.title}`)
      const message = failureMessage(spec)
      if (message) lines.push('  ```', `  ${message.replace(/\n/g, '\n  ')}`, '  ```')
    }
    process.stdout.write(lines.join('\n') + '\n')
    process.exit(0)
  }

  console.log(`E2E: ${passed}/${total} specs passed`)
  if (failed > 0) {
    console.error(`E2E: ${failed} failing spec(s):`)
    for (const line of failureLines(failures)) console.error(line)
  }
  process.exit(failed > 0 ? 1 : 0)
}

// Only run the CLI when executed directly (not when imported by tests).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main()
}
