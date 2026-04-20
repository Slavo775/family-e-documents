const base = require('@family-docs/config-eslint/base')
/** @type {import('eslint').Linter.Config} */
module.exports = { ...base, env: { browser: true } }
