module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    'plugin:vitest/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // Project defaults; keep strict but allow targeted relaxations in overrides below
    '@typescript-eslint/no-explicit-any': 'error',
  },
  overrides: [
    {
      files: ['test/**', 'test/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
      rules: {
        // Tests often use `any` for emitted payloads and shorthand; relax here.
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow assertion style expressions in tests
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['.netlify/**', '.netlify/functions-serve/**'],
      rules: {
        // Ignore rules for generated netlify function bundles
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
