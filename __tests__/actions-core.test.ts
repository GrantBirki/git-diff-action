import assert from 'node:assert/strict'
import {afterEach, beforeEach, mock, test} from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const uuid = '00000000-0000-4000-8000-000000000000'
mock.module('node:crypto', {namedExports: {randomUUID: () => uuid}})
const core = await import('../src/actions-core.ts')
let env: NodeJS.ProcessEnv
let exitCode: typeof process.exitCode
let temp: string
let writes: string[]
beforeEach(() => {
  env = {...process.env}
  exitCode = process.exitCode
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'actions-core-test-'))
  writes = []
  mock.method(process.stdout, 'write', (chunk: string) => {
    writes.push(chunk)
    return true
  })
  delete process.env.GITHUB_OUTPUT
})
afterEach(() => {
  mock.restoreAll()
  process.env = env
  process.exitCode = exitCode
  fs.rmSync(temp, {recursive: true, force: true})
})
test('normalizes input names, trims values and supplies empty missing inputs', () => {
  delete process.env.INPUT_MISSING
  assert.equal(core.getInput('missing'), '')
  process.env.INPUT_WITH_SPACE = ' \n hello \t '
  assert.equal(core.getInput('with space'), 'hello')
})
test('preserves plain logging and escapes command data', () => {
  core.info('plain\ntext')
  core.debug('%\r\n::error::fake')
  core.warning('warning\nnext')
  core.setFailed('failed\r\nnext')
  assert.deepEqual(writes, [
    `plain\ntext${os.EOL}`,
    `::debug::%25%0D%0A::error::fake${os.EOL}`,
    `::warning::warning%0Anext${os.EOL}`,
    `::error::failed%0D%0Anext${os.EOL}`
  ])
  assert.equal(process.exitCode, 1)
})
test('preserves deprecated stdout output protocol and escaping', () => {
  core.setOutput('x%\r\n:,', 'value%\r\n')
  core.setOutput('', '')
  assert.deepEqual(writes, [
    `${os.EOL}::set-output name=x%25%0D%0A%3A%2C::value%25%0D%0A${os.EOL}`,
    `${os.EOL}::set-output::${os.EOL}`
  ])
})
test('appends multiline UTF-8 outputs to the existing command file', () => {
  const file = path.join(temp, 'output')
  fs.writeFileSync(file, 'existing\n')
  process.env.GITHUB_OUTPUT = file
  core.setOutput('result', '雪\nline\r\n::warning::value')
  core.setOutput('empty', '')
  const d = `ghadelimiter_${uuid}`,
    n = os.EOL
  assert.equal(
    fs.readFileSync(file, 'utf8'),
    `existing\nresult<<${d}${n}雪\nline\r\n::warning::value${n}${d}${n}empty<<${d}${n}${n}${d}${n}`
  )
  assert.deepEqual(writes, [])
})
test('refuses missing command files', () => {
  process.env.GITHUB_OUTPUT = path.join(temp, 'missing')
  assert.throws(() => core.setOutput('x', 'y'), {
    message: `Missing file at path: ${process.env.GITHUB_OUTPUT}`
  })
  assert.equal(fs.existsSync(process.env.GITHUB_OUTPUT), false)
})
for (const target of ['name', 'value'] as const) {
  test(`rejects delimiter collisions in ${target}`, () => {
    process.env.GITHUB_OUTPUT = path.join(temp, 'output')
    fs.writeFileSync(process.env.GITHUB_OUTPUT, '')
    const d = `ghadelimiter_${uuid}`
    assert.throws(
      () =>
        core.setOutput(
          target === 'name' ? d : 'x',
          target === 'value' ? d : 'y'
        ),
      {
        message: `Unexpected input: ${target} should not contain the delimiter "${d}"`
      }
    )
    assert.equal(fs.readFileSync(process.env.GITHUB_OUTPUT, 'utf8'), '')
  })
}
test('propagates command file write failures', () => {
  process.env.GITHUB_OUTPUT = temp
  assert.throws(() => core.setOutput('x', 'y'), {code: 'EISDIR'})
})
