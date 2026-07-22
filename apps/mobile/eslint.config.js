// @ts-check
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const globals = require('globals')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.expo/**'],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['jest.setup.js', '**/__tests__/**', '**/__mocks__/**', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
])
