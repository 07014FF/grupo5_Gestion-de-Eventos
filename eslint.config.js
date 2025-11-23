// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      globals: {
        Deno: 'readonly',
      },
    },
    rules: {
      'import/no-unresolved': 'off',
    },
  },
]);
