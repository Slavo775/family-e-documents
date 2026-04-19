const base = require('./base')

/** @type {import('eslint').Linter.Config} */
const nextjsConfig = {
  ...base,
  extends: [
    ...base.extends,
    'next/core-web-vitals',
  ],
}

module.exports = nextjsConfig
