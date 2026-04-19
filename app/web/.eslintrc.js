const base = require('@family-docs/config-eslint/base')

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...base,
  extends: [...base.extends, 'next/core-web-vitals'],
}
