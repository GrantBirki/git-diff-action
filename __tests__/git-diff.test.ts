import assert from 'node:assert/strict'
import {afterEach, beforeEach, mock, test} from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import type {execFileAsync as Exec} from '../src/functions/exec-async.ts'

const fixture = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
const execute = mock.fn<typeof Exec>(async () => ({
  stdout: fixture,
  stderr: ''
}))
const info = mock.fn<(message: string) => void>()
const debug = mock.fn<(message: string) => void>()
const warning = mock.fn<(message: string) => void>()
const failed = mock.fn<(message: string) => void>()
const output = mock.fn<(name: string, value: string) => void>()
mock.module('../src/functions/exec-async.ts', {
  namedExports: {execFileAsync: execute}
})
mock.module('../src/actions-core.ts', {
  namedExports: {
    getInput: (name: string) =>
      (process.env[`INPUT_${name.toUpperCase()}`] ?? '').trim(),
    info,
    debug,
    warning,
    setFailed: failed,
    setOutput: output
  }
})
const {gitDiff} = await import('../src/functions/git-diff.ts')
let temp: string
let env: NodeJS.ProcessEnv
beforeEach(() => {
  env = {...process.env}
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'))
  for (const fn of [execute, info, debug, warning, failed, output])
    fn.mock.resetCalls()
  execute.mock.mockImplementation(async () => ({stdout: fixture, stderr: ''}))
  Object.assign(process.env, {
    INPUT_BASE_BRANCH: 'HEAD^1',
    INPUT_SEARCH_PATH: '.',
    INPUT_MAX_BUFFER_SIZE: '1000000',
    INPUT_FILE_OUTPUT_ONLY: 'false',
    INPUT_GIT_OPTIONS: '--no-color --full-index',
    INPUT_GIT_DIFF_FILE: '__tests__/fixtures/main.diff',
    INPUT_RAW_DIFF_FILE_OUTPUT: '',
    INPUT_JSON_DIFF_FILE_OUTPUT: '',
    GITHUB_WORKSPACE: process.cwd()
  })
})
afterEach(() => {
  process.env = env
  fs.rmSync(temp, {recursive: true, force: true})
})

for (const [file, count, rawCount] of [
  ['main', 5, 5],
  ['empty', 0, 0],
  ['special-chars', 1, 1],
  ['rename-and-mode', 2, 2],
  ['with-binary-files', 7, 7],
  ['with-binary-files-and-binary-flag', 4, 7],
  ['large', 12, 12]
] as const) {
  test(`preserves ${file} parser output and counts`, async () => {
    process.env.INPUT_GIT_DIFF_FILE = `__tests__/fixtures/${file}.diff`
    const result = await gitDiff()
    assert.ok(result)
    assert.equal(result.files.length, count)
    assert.ok(
      info.mock.calls.some(
        c =>
          c.arguments[0] ===
          `🧮 total detected files changed (raw diff): ${rawCount}`
      )
    )
    assert.ok(
      info.mock.calls.some(
        c =>
          c.arguments[0] ===
          `🧮 total detected files changed (json diff): ${count}`
      )
    )
    assert.equal(failed.mock.callCount(), 0)
    assert.deepEqual(
      output.mock.calls.map(c => c.arguments),
      [
        ['raw-diff', fs.readFileSync(process.env.INPUT_GIT_DIFF_FILE, 'utf8')],
        ['json-diff', JSON.stringify(result)]
      ]
    )
    if (file === 'main') {
      const hash = createHash('sha256')
        .update(JSON.stringify(result))
        .digest('hex')
      assert.equal(
        hash,
        fs
          .readFileSync('__tests__/fixtures/diff.json.sha256', 'utf8')
          .split(' ')[0]
      )
    }
  })
}

for (const [value, expected] of [
  ['', []],
  ['   ', []],
  ['--no-color   --name-only', ['--no-color', '--name-only']],
  [
    '--no-color --full-index --find-renames',
    ['--no-color', '--full-index', '--find-renames']
  ],
  [
    '--no-color && touch /tmp/pwned',
    ['--no-color', '&&', 'touch', '/tmp/pwned']
  ],
  [
    '--word-diff-regex="foo bar" --no-color',
    ['--word-diff-regex=foo bar', '--no-color']
  ],
  [
    "--word-diff-regex='foo bar' --no-color",
    ['--word-diff-regex=foo bar', '--no-color']
  ],
  ['"" --no-color', ['--no-color']],
  ['""', []],
  ['""   ', []],
  [
    '--word-diff-regex="foo\\ bar" --no-color',
    ['--word-diff-regex=foo bar', '--no-color']
  ],
  ['foo\\ bar', ['foo bar']],
  ['a\tb\nc', ['a', 'b', 'c']],
  ['--binary', ['--binary']]
] as const) {
  test(`tokenizes git_options ${JSON.stringify(value)} without a shell`, async () => {
    process.env.INPUT_GIT_DIFF_FILE = 'false'
    process.env.INPUT_GIT_OPTIONS = value
    const result = await gitDiff()
    assert.equal(result?.files.length, 5)
    assert.deepEqual(execute.mock.calls[0]?.arguments, [
      'git',
      ['--no-pager', 'diff', ...expected, 'HEAD^1', '--', '.'],
      {maxBuffer: 1000000}
    ])
    assert.equal(warning.mock.callCount(), value === '--binary' ? 1 : 0)
  })
}
for (const value of [
  'main',
  'a1b2c3d',
  'origin/main',
  'branch; echo injected'
]) {
  test(`passes base branch ${value} as one argument`, async () => {
    process.env.INPUT_GIT_DIFF_FILE = 'false'
    process.env.INPUT_BASE_BRANCH = value
    process.env.INPUT_SEARCH_PATH = 'path with spaces/;echo nope'
    await gitDiff()
    assert.deepEqual(execute.mock.calls[0]?.arguments[1], [
      '--no-pager',
      'diff',
      '--no-color',
      '--full-index',
      value,
      '--',
      'path with spaces/;echo nope'
    ])
  })
}
for (const [value, expected] of [
  ['invalid', 1000000],
  ['', 1000000],
  ['0', 0],
  ['5000000', 5000000],
  ['999999999', 999999999],
  ['12tail', 12]
] as const) {
  test(`preserves max_buffer_size ${JSON.stringify(value)}`, async () => {
    process.env.INPUT_GIT_DIFF_FILE = 'false'
    process.env.INPUT_MAX_BUFFER_SIZE = value
    await gitDiff()
    assert.deepEqual(execute.mock.calls[0]?.arguments[2], {maxBuffer: expected})
  })
}
for (const [value, message] of [
  ['"unterminated', 'contains an unterminated quoted value'],
  ['x\\', 'ends with an incomplete escape sequence']
] as const) {
  test(`rejects malformed options ${value}`, async () => {
    process.env.INPUT_GIT_DIFF_FILE = 'false'
    process.env.INPUT_GIT_OPTIONS = value
    assert.equal(await gitDiff(), undefined)
    assert.deepEqual(failed.mock.calls[0]?.arguments, [
      `error getting git diff: Error: git_options ${message}`
    ])
    assert.equal(execute.mock.callCount(), 0)
  })
}
for (const fileOnly of ['true', 'false', 'TRUE']) {
  test(`writes real output files with file_output_only=${fileOnly}`, async () => {
    process.env.INPUT_FILE_OUTPUT_ONLY = fileOnly
    const raw = path.join(temp, 'raw.txt'),
      json = path.join(temp, 'diff.json')
    process.env.INPUT_RAW_DIFF_FILE_OUTPUT = raw
    process.env.INPUT_JSON_DIFF_FILE_OUTPUT = json
    const result = await gitDiff()
    assert.equal(fs.readFileSync(raw, 'utf8'), fixture)
    assert.equal(fs.readFileSync(json, 'utf8'), JSON.stringify(result))
    assert.deepEqual(
      output.mock.calls.map(c => c.arguments[0]),
      fileOnly === 'true'
        ? ['raw-diff-path', 'json-diff-path']
        : ['raw-diff', 'raw-diff-path', 'json-diff', 'json-diff-path']
    )
  })
}
test('uses cwd when workspace is unset', async () => {
  delete process.env.GITHUB_WORKSPACE
  assert.equal((await gitDiff())?.files.length, 5)
})
test('rejects an absolute path outside the workspace', async () => {
  process.env.INPUT_GIT_DIFF_FILE = process.execPath
  assert.equal(await gitDiff(), undefined)
  assert.equal(
    failed.mock.calls[0]?.arguments[0],
    'error getting git diff: Error: git_diff_file must resolve to a file inside the GitHub workspace'
  )
})
test('rejects symlinks escaping the workspace', async () => {
  process.env.GITHUB_WORKSPACE = temp
  fs.symlinkSync(process.execPath, path.join(temp, 'escape'))
  process.env.INPUT_GIT_DIFF_FILE = 'escape'
  assert.equal(await gitDiff(), undefined)
  assert.match(
    failed.mock.calls[0]!.arguments[0],
    /inside the GitHub workspace/
  )
})
test('reports missing diff file', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/nonexistent.diff'
  assert.equal(await gitDiff(), undefined)
  assert.match(
    failed.mock.calls[0]!.arguments[0],
    /error getting git diff: Error: ENOENT/
  )
})
test('reports directory read failure for the workspace root', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '.'
  assert.equal(await gitDiff(), undefined)
  assert.match(failed.mock.calls[0]!.arguments[0], /EISDIR/)
})
for (const name of ['RAW', 'JSON']) {
  test(`reports ${name} output write errors`, async () => {
    process.env[`INPUT_${name}_DIFF_FILE_OUTPUT`] = path.join(
      temp,
      'missing',
      'file'
    )
    assert.equal(await gitDiff(), undefined)
    assert.match(failed.mock.calls[0]!.arguments[0], /ENOENT/)
  })
}
test('reports git stderr and emits no diff outputs', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  execute.mock.mockImplementation(async () => ({stdout: '', stderr: 'failure'}))
  assert.equal(await gitDiff(), undefined)
  assert.deepEqual(failed.mock.calls[0]?.arguments, ['git diff error: failure'])
  assert.equal(output.mock.callCount(), 0)
})
test('reports rejected git execution', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  execute.mock.mockImplementation(async () => {
    throw new Error('maxBuffer exceeded')
  })
  assert.equal(await gitDiff(), undefined)
  assert.deepEqual(failed.mock.calls[0]?.arguments, [
    'error getting git diff: Error: maxBuffer exceeded'
  ])
})
