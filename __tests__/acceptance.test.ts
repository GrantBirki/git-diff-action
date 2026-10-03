import assert from 'node:assert/strict'
import {test} from 'node:test'
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync
} from 'node:fs'
import {tmpdir, EOL} from 'node:os'
import {resolve, join} from 'node:path'
import {spawnSync, execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'

const root = resolve('.')
function setup() {
  const temp = mkdtempSync(join(tmpdir(), 'git-diff-acceptance-'))
  const workspace = join(temp, 'workspace')
  mkdirSync(workspace)
  cpSync(join(root, 'dist'), join(temp, 'action'), {recursive: true})
  const output = join(workspace, 'outputs')
  function run(inputs: Record<string, string> = {}) {
    writeFileSync(output, '')
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('INPUT_'))
    )
    const defaults = {
      BASE_BRANCH: 'HEAD^1',
      SEARCH_PATH: '.',
      MAX_BUFFER_SIZE: '10000000',
      FILE_OUTPUT_ONLY: 'false',
      GIT_OPTIONS: '--no-color --full-index',
      GIT_DIFF_FILE: 'false',
      RAW_DIFF_FILE_OUTPUT: '',
      JSON_DIFF_FILE_OUTPUT: ''
    }
    for (const [key, value] of Object.entries({...defaults, ...inputs}))
      env[`INPUT_${key}`] = value
    const result = spawnSync(
      process.execPath,
      [join(temp, 'action', 'index.js')],
      {
        cwd: workspace,
        env: {...env, GITHUB_WORKSPACE: workspace, GITHUB_OUTPUT: output},
        encoding: 'utf8'
      }
    )
    assert.ifError(result.error)
    const values: Record<string, string> = {}
    const lines = readFileSync(output, 'utf8').split(EOL)
    for (let i = 0; i < lines.length - 1; i++) {
      const header = lines[i]!.split('<<')
      assert.equal(header.length, 2)
      const value: string[] = []
      while (lines[++i] !== header[1]) {
        assert.ok(i < lines.length)
        value.push(lines[i]!)
      }
      values[header[0]!] = value.join(EOL)
    }
    return {...result, values}
  }
  return {
    temp,
    workspace,
    run,
    close: () => rmSync(temp, {recursive: true, force: true})
  }
}

test('standalone bundle preserves fixture JSON bytes and raw output files', () => {
  const action = setup()
  try {
    cpSync(
      join(root, '__tests__/fixtures/main.diff'),
      join(action.workspace, 'input.diff')
    )
    const result = action.run({
      GIT_DIFF_FILE: 'input.diff',
      RAW_DIFF_FILE_OUTPUT: 'raw.txt',
      JSON_DIFF_FILE_OUTPUT: 'diff.json'
    })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(Object.keys(result.values), [
      'raw-diff',
      'raw-diff-path',
      'json-diff',
      'json-diff-path'
    ])
    assert.equal(
      result.values['raw-diff'],
      readFileSync(join(action.workspace, 'input.diff'), 'utf8')
    )
    assert.equal(result.values['raw-diff-path'], 'raw.txt')
    assert.equal(result.values['json-diff-path'], 'diff.json')
    const json = readFileSync(join(action.workspace, 'diff.json'), 'utf8')
    assert.equal(result.values['json-diff'], json)
    assert.equal(
      createHash('sha256').update(json).digest('hex'),
      readFileSync('__tests__/fixtures/diff.json.sha256', 'utf8').split(' ')[0]
    )
    assert.equal(
      readFileSync(join(action.workspace, 'raw.txt'), 'utf8'),
      result.values['raw-diff']
    )
  } finally {
    action.close()
  }
})

test('standalone bundle runs real Git with spaces in path and file-only outputs', () => {
  const action = setup()
  try {
    const git = (...args: string[]) =>
      execFileSync('git', args, {cwd: action.workspace, encoding: 'utf8'})
    git('init', '--quiet')
    writeFileSync(join(action.workspace, 'space name.txt'), 'before\n')
    git('add', 'space name.txt')
    git(
      '-c',
      'user.name=Acceptance',
      '-c',
      'user.email=acceptance@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'fixture'
    )
    writeFileSync(join(action.workspace, 'space name.txt'), 'after 雪\n')
    const result = action.run({
      BASE_BRANCH: 'HEAD',
      SEARCH_PATH: 'space name.txt',
      FILE_OUTPUT_ONLY: 'true',
      RAW_DIFF_FILE_OUTPUT: 'raw.txt',
      JSON_DIFF_FILE_OUTPUT: 'diff.json'
    })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.values, {
      'raw-diff-path': 'raw.txt',
      'json-diff-path': 'diff.json'
    })
    const parsed: {files: Array<{path: string}>} = JSON.parse(
      readFileSync(join(action.workspace, 'diff.json'), 'utf8')
    )
    // Preserve parse-git-diff's existing trailing-tab behavior for spaced paths.
    assert.equal(parsed.files[0]?.path, 'space name.txt\t')
    assert.match(
      readFileSync(join(action.workspace, 'raw.txt'), 'utf8'),
      /after 雪/
    )
  } finally {
    action.close()
  }
})

for (const [name, inputs, error] of [
  [
    'outside workspace',
    {GIT_DIFF_FILE: process.execPath},
    /inside the GitHub workspace/
  ],
  [
    'unterminated quote',
    {GIT_OPTIONS: '--no-color "unfinished'},
    /unterminated quoted value/
  ],
  [
    'incomplete escape',
    {GIT_OPTIONS: '--no-color \\'},
    /incomplete escape sequence/
  ],
  ['missing file', {GIT_DIFF_FILE: 'missing.diff'}, /ENOENT/],
  ['git failure', {}, /error getting git diff/]
] as const) {
  test(`standalone bundle fails for ${name}`, () => {
    const action = setup()
    try {
      const result = action.run(inputs)
      assert.equal(result.status, 1, result.stderr)
      assert.match(result.stdout, error)
      assert.deepEqual(result.values, {})
    } finally {
      action.close()
    }
  })
}
test('standalone bundle refuses a symlink escape', () => {
  const action = setup()
  try {
    symlinkSync(process.execPath, join(action.workspace, 'escape'))
    const result = action.run({GIT_DIFF_FILE: 'escape'})
    assert.equal(result.status, 1)
    assert.match(result.stdout, /inside the GitHub workspace/)
  } finally {
    action.close()
  }
})
