const js = require('@eslint/js')

module.exports = [
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        process: 'readonly'
      }
    }
  }
]
