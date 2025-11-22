/**
 * ESLint Configuration
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'comma-dangle': ['error', 'never'],
    'arrow-parens': ['error', 'always'],
    'max-len': ['warn', { code: 120 }],
    'no-underscore-dangle': 'off',
    'consistent-return': 'off'
  }
};
