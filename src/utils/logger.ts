// Lightweight logger that is silent in production builds.
//
// All output is gated on `import.meta.env.DEV` so production bundles stay
// quiet while development (and the test runner) still surface useful
// diagnostics. Prefer this over calling `console.*` directly so debug
// noise never reaches end users in a production build.

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args)
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args)
  },
}

export default logger
