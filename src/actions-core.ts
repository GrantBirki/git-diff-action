// Narrow runner-command adapter for this action's string-only inputs and outputs.
// Adapted from actions/toolkit (MIT), see LICENSES/actions-toolkit.txt.
import {randomUUID} from 'node:crypto'
import {appendFileSync, existsSync} from 'node:fs'
import {EOL} from 'node:os'

function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

export function getInput(name: string): string {
  return (
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] ?? ''
  ).trim()
}

export function info(message: string): void {
  process.stdout.write(message + EOL)
}

export function debug(message: string): void {
  info(`::debug::${escapeData(message)}`)
}

export function warning(message: string): void {
  info(`::warning::${escapeData(message)}`)
}

export function setFailed(message: string): void {
  process.exitCode = 1
  info(`::error::${escapeData(message)}`)
}

export function setOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath) {
    const delimiter = `ghadelimiter_${randomUUID()}`
    if (name.includes(delimiter)) {
      throw new Error(
        `Unexpected input: name should not contain the delimiter "${delimiter}"`
      )
    }
    if (value.includes(delimiter)) {
      throw new Error(
        `Unexpected input: value should not contain the delimiter "${delimiter}"`
      )
    }
    if (!existsSync(outputPath)) {
      throw new Error(`Missing file at path: ${outputPath}`)
    }
    appendFileSync(
      outputPath,
      `${name}<<${delimiter}${EOL}${value}${EOL}${delimiter}${EOL}`,
      'utf8'
    )
    return
  }
  const property = name
    ? ` name=${escapeData(name).replace(/:/g, '%3A').replace(/,/g, '%2C')}`
    : ''
  info(`${EOL}::set-output${property}::${escapeData(value)}`)
}
