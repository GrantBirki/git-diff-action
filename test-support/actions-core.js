const getInput = jest.fn(name => {
  const normalizedName = name.replace(/ /g, '_').toUpperCase()
  const value = process.env[`INPUT_${normalizedName}`]

  return value ? value.trim() : ''
})

const info = jest.fn()
const debug = jest.fn()
const warning = jest.fn()
const setOutput = jest.fn()
const setFailed = jest.fn()
const saveState = jest.fn()

module.exports = {
  debug,
  getInput,
  info,
  saveState,
  setFailed,
  setOutput,
  warning
}
