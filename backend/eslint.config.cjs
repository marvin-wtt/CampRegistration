const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const pluginSecurity = require('eslint-plugin-security');

const compat = new FlatCompat({ resolvePluginsRelativeTo: __dirname });

module.exports = [
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  ...compat.config({
    env: { node: true },
    extends: ['plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-interface': 'error',
    },
  }),
];
