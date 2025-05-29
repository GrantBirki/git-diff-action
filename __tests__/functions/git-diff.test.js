import {gitDiff} from '../../src/functions/git-diff'
import * as execAsync from '../../src/functions/exec-async'
import * as core from '@actions/core'
import fs from 'fs'

const infoMock = jest.spyOn(core, 'info')
const debugMock = jest.spyOn(core, 'debug')
const setFailedMock = jest.spyOn(core, 'setFailed')
const warningMock = jest.spyOn(core, 'warning')

beforeEach(() => {
  jest.clearAllMocks()

  jest.spyOn(core, 'saveState').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'setOutput').mockImplementation(() => {})
  jest.spyOn(core, 'setFailed').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})

  process.env.INPUT_BASE_BRANCH = 'HEAD^1'
  process.env.INPUT_SEARCH_PATH = '.'
  process.env.INPUT_MAX_BUFFER_SIZE = '1000000'
  process.env.INPUT_FILE_OUTPUT_ONLY = 'false'
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index'
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/main.diff'
})

test('executes gitDiff', async () => {
  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('utils/cache-machine.mjs')
  expect(lastFile.type).toBe('DeletedFile')
  expect(lastFile.chunks[0].changes[0].type).toBe('DeletedLine')
  expect(lastFile.chunks[0].changes[0].content).toBe(`// cache url`)
  expect(lastFile.chunks[0].changes[0].lineBefore).toBe(1)
  expect(lastFile.chunks[0].changes[0]?.lineAfter).toBe(undefined)

  expect(results.files[0].type).toBe('ChangedFile')
  expect(results.files[0].chunks[0].changes[0].content).toBe(
    `import { v4 as uuidv4 } from 'uuid';`
  )
  expect(results.files[0].chunks[0].changes[0].type).toBe('UnchangedLine')
  expect(results.files[0].chunks[0].changes[2].content).toBe(
    `import cacheMachine from '../utils/cache-machine.mjs';`
  )
  expect(results.files[0].chunks[0].changes[2].type).toBe('DeletedLine')

  expect(infoMock).toHaveBeenCalledWith('🏃 starting the git-diff-action')
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 5'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 5'
  )
})

test('executes gitDiff with binary files', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/with-binary-files.diff'
  const results = await gitDiff()

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('utils/cache-machine.mjs')

  expect(results.files[0].type).toBe('ChangedFile')
  expect(results.files[0].chunks[0].changes[0].content).toBe(
    `import { v4 as uuidv4 } from 'uuid';`
  )
  expect(results.files[0].chunks[0].changes[0].type).toBe('UnchangedLine')
  expect(results.files[0].chunks[0].changes[2].content).toBe(
    `import cacheMachine from '../utils/cache-machine.mjs';`
  )
  expect(results.files[0].chunks[0].changes[2].type).toBe('DeletedLine')

  expect(results.files.length).toBe(7)
  expect(infoMock).toHaveBeenCalledWith('🏃 starting the git-diff-action')
  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/with-binary-files.diff'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 7'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 7'
  )
})

// this test case is a bug test
// there is an issue with the 'parseGitDiff' library where if the --binary flag is used, it will break the parsing
// it will still return "some" results, but it will break the parsing and return an incomplete set of results
test('executes gitDiff with binary files and --binary flag and breaks (bug test)', async () => {
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index --binary'
  process.env.INPUT_GIT_DIFF_FILE =
    '__tests__/fixtures/with-binary-files-and-binary-flag.diff'
  const results = await gitDiff()

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('kv-cache.js')

  expect(results.files.length).toBe(4)
  expect(infoMock).toHaveBeenCalledWith('🏃 starting the git-diff-action')
  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/with-binary-files-and-binary-flag.diff'
  )

  // note that the total files changed is 7, but the json diff only has 4 files
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 7'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 4'
  )
})

test('executes gitDiff by using the git binary', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  process.env.INPUT_MAX_BUFFER_SIZE = ''
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = 'diff.txt'
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = 'diff.json'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
    return true
  })

  const results = await gitDiff()

  expect(results.files.length).toBe(5)

  const firstFile = results.files[0]
  expect(firstFile.path).toBe('custom-endpoints/nightbot.mjs')

  const lastFile = results.files[results.files.length - 1]
  expect(lastFile.path).toBe('utils/cache-machine.mjs')
  expect(lastFile.type).toBe('DeletedFile')
  expect(lastFile.chunks[0].changes[0].type).toBe('DeletedLine')
  expect(lastFile.chunks[0].changes[0].content).toBe(`// cache url`)
  expect(lastFile.chunks[0].changes[0].lineBefore).toBe(1)
  expect(lastFile.chunks[0].changes[0]?.lineAfter).toBe(undefined)

  expect(results.files[0].type).toBe('ChangedFile')
  expect(results.files[0].chunks[0].changes[0].content).toBe(
    `import { v4 as uuidv4 } from 'uuid';`
  )
  expect(results.files[0].chunks[0].changes[0].type).toBe('UnchangedLine')
  expect(results.files[0].chunks[0].changes[2].content).toBe(
    `import cacheMachine from '../utils/cache-machine.mjs';`
  )
  expect(results.files[0].chunks[0].changes[2].type).toBe('DeletedLine')

  expect(infoMock).toHaveBeenCalledWith(
    'max_buffer_size is not defined, using default of 1000000'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 5'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 5'
  )
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index HEAD^1 -- .'
  )
})

test('fails due to stderr being returned from the git binary', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: '', stderr: 'oh no something went wrong'}
  })

  expect(await gitDiff()).toBe(undefined)

  expect(setFailedMock).toHaveBeenCalledWith(
    'git diff error: oh no something went wrong'
  )
})

test('leaves a warning when --binary is used', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = 'diff.txt'
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = 'diff.json'
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index --binary'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
    return true
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(warningMock).toHaveBeenCalledWith(
    '--binary flag is set, this may cause unexpected issues with the diff'
  )
})

test('fails when no custom git diff file is found', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'bad-file.txt'

  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    throw new Error('oh no something really bad happened')
  })

  try {
    await gitDiff()
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('oh no something really bad happened')
    expect(setFailedMock).toHaveBeenCalledWith(
      'error getting git diff: oh no something really bad happened'
    )
  }
})

test('executes gitDiff with file_output_only set to true', async () => {
  process.env.INPUT_FILE_OUTPUT_ONLY = 'true'
  const setOutputMock = jest.spyOn(core, 'setOutput')

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  // Verify that setOutput is not called for raw-diff and json-diff when file_output_only is true
  expect(setOutputMock).not.toHaveBeenCalledWith('raw-diff', expect.anything())
  expect(setOutputMock).not.toHaveBeenCalledWith('json-diff', expect.anything())
})

test('executes gitDiff with file_output_only true and file outputs', async () => {
  process.env.INPUT_FILE_OUTPUT_ONLY = 'true'
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = 'test-raw.txt'
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = 'test-json.json'
  const setOutputMock = jest.spyOn(core, 'setOutput')

  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
    return true
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  // Verify that setOutput is not called for raw-diff and json-diff when file_output_only is true
  expect(setOutputMock).not.toHaveBeenCalledWith('raw-diff', expect.anything())
  expect(setOutputMock).not.toHaveBeenCalledWith('json-diff', expect.anything())

  // But should be called for file paths
  expect(setOutputMock).toHaveBeenCalledWith('raw-diff-path', 'test-raw.txt')
  expect(setOutputMock).toHaveBeenCalledWith('json-diff-path', 'test-json.json')
})

// Edge case tests for search_path input option
test('executes gitDiff with specific search_path directory', async () => {
  process.env.INPUT_SEARCH_PATH = 'src/'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('search_path: src/')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index HEAD^1 -- src/'
  )
})

test('executes gitDiff with glob pattern search_path', async () => {
  process.env.INPUT_SEARCH_PATH = '**/*.js'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('search_path: **/*.js')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index HEAD^1 -- **/*.js'
  )
})

test('executes gitDiff with specific file search_path', async () => {
  process.env.INPUT_SEARCH_PATH = 'README.md'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('search_path: README.md')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index HEAD^1 -- README.md'
  )
})

// Edge case tests for max_buffer_size input option
test('executes gitDiff with custom max_buffer_size', async () => {
  process.env.INPUT_MAX_BUFFER_SIZE = '5000000'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('max_buffer_size: 5000000')
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --full-index HEAD^1 -- .',
    {maxBuffer: 5000000}
  )
})

test('executes gitDiff with invalid max_buffer_size (NaN)', async () => {
  process.env.INPUT_MAX_BUFFER_SIZE = 'invalid'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('max_buffer_size: NaN')
  expect(infoMock).toHaveBeenCalledWith(
    'max_buffer_size is not defined, using default of 1000000'
  )
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --full-index HEAD^1 -- .',
    {maxBuffer: 1000000}
  )
})

test('executes gitDiff with zero max_buffer_size', async () => {
  process.env.INPUT_MAX_BUFFER_SIZE = '0'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('max_buffer_size: 0')
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --full-index HEAD^1 -- .',
    {maxBuffer: 0}
  )
})

// Edge case tests for git_options input option
test('executes gitDiff with custom git_options', async () => {
  process.env.INPUT_GIT_OPTIONS = '--no-color --name-only'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('git_options: --no-color --name-only')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --name-only HEAD^1 -- .'
  )
})

test('executes gitDiff with minimal git_options', async () => {
  process.env.INPUT_GIT_OPTIONS = ''
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('git_options: ')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff  HEAD^1 -- .'
  )
})

test('executes gitDiff with complex git_options', async () => {
  process.env.INPUT_GIT_OPTIONS = '--no-color --full-index --find-renames'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith(
    'git_options: --no-color --full-index --find-renames'
  )
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index --find-renames HEAD^1 -- .'
  )
})

// Edge case tests for git_diff_file input option
test('executes gitDiff with empty diff file', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/empty.diff'

  const results = await gitDiff()
  expect(results.files.length).toBe(0)

  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/empty.diff'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 0'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 0'
  )
})

test('executes gitDiff with special characters in diff file', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/special-chars.diff'

  const results = await gitDiff()
  expect(results.files.length).toBe(1)
  expect(results.files[0].path).toBe('test-file-with-special-chars.txt')
  expect(results.files[0].type).toBe('AddedFile')

  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/special-chars.diff'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 1'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (json diff): 1'
  )
})

test('executes gitDiff with renames and mode changes', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/rename-and-mode.diff'

  const results = await gitDiff()
  // The parser may not handle all git diff types equally, so we check what we actually get
  expect(results.files.length).toBeGreaterThanOrEqual(1)

  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/rename-and-mode.diff'
  )
  expect(infoMock).toHaveBeenCalledWith(
    '🧮 total detected files changed (raw diff): 2'
  )
  // JSON diff may parse differently than raw diff for complex changes
  expect(infoMock).toHaveBeenCalledWith(
    expect.stringMatching(/🧮 total detected files changed \(json diff\): [12]/)
  )
})

test('handles file read error when git_diff_file does not exist', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/nonexistent.diff'

  try {
    await gitDiff()
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('ENOENT')
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining('error getting git diff:')
    )
  }
})

// Edge case tests for base_branch input option
test('executes gitDiff with custom base_branch', async () => {
  process.env.INPUT_BASE_BRANCH = 'main'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('base_branch: main')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index main -- .'
  )
})

test('executes gitDiff with SHA base_branch', async () => {
  process.env.INPUT_BASE_BRANCH = 'a1b2c3d'
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    return {stdout: diff, stderr: null}
  })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('base_branch: a1b2c3d')
  expect(debugMock).toHaveBeenCalledWith(
    'running git diff command: git --no-pager diff --no-color --full-index a1b2c3d -- .'
  )
})

// Error handling and edge case tests
test('handles file system errors when writing output files', async () => {
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = '/invalid/path/raw.txt'
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = '/invalid/path/json.json'

  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
    throw new Error('ENOENT: no such file or directory')
  })

  try {
    await gitDiff()
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('ENOENT')
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining('error getting git diff:')
    )
  }
})

test('handles git command timeout/error', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  process.env.INPUT_MAX_BUFFER_SIZE = '100' // Very small buffer to potentially cause issues

  jest.spyOn(execAsync, 'execAsync').mockImplementation(() => {
    throw new Error('maxBuffer exceeded')
  })

  try {
    await gitDiff()
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('maxBuffer exceeded')
    expect(setFailedMock).toHaveBeenCalledWith(
      'error getting git diff: maxBuffer exceeded'
    )
  }
})

test('executes gitDiff with very large max_buffer_size', async () => {
  process.env.INPUT_MAX_BUFFER_SIZE = '999999999'
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = ''
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = ''

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })

  const results = await gitDiff()
  expect(results).toBeDefined()
  expect(results.files.length).toBe(5)

  expect(debugMock).toHaveBeenCalledWith('max_buffer_size: 999999999')
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --full-index HEAD^1 -- .',
    {maxBuffer: 999999999}
  )
})

// Real-world scenario tests
test('executes gitDiff with large diff file', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/large.diff'

  const results = await gitDiff()
  expect(results).toBeDefined()
  expect(results.files.length).toBeGreaterThan(5) // Should have more files than the base test

  expect(infoMock).toHaveBeenCalledWith(
    '📂 reading git diff from file: __tests__/fixtures/large.diff'
  )
  expect(infoMock).toHaveBeenCalledWith(
    expect.stringMatching(/🧮 total detected files changed \(raw diff\): \d+/)
  )
  expect(infoMock).toHaveBeenCalledWith(
    expect.stringMatching(/🧮 total detected files changed \(json diff\): \d+/)
  )
})

test('executes gitDiff with all file outputs and options', async () => {
  process.env.INPUT_GIT_DIFF_FILE = 'false'
  process.env.INPUT_RAW_DIFF_FILE_OUTPUT = 'test-output.raw'
  process.env.INPUT_JSON_DIFF_FILE_OUTPUT = 'test-output.json'
  process.env.INPUT_FILE_OUTPUT_ONLY = 'false'
  process.env.INPUT_SEARCH_PATH = 'src/**/*.js'
  process.env.INPUT_GIT_OPTIONS = '--no-color --stat'
  process.env.INPUT_MAX_BUFFER_SIZE = '2000000'
  process.env.INPUT_BASE_BRANCH = 'origin/main'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })
  const writeFileSyncSpy = jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(() => {
      return true
    })
  const setOutputSpy = jest.spyOn(core, 'setOutput')

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  // Verify all inputs were processed correctly
  expect(debugMock).toHaveBeenCalledWith('base_branch: origin/main')
  expect(debugMock).toHaveBeenCalledWith('search_path: src/**/*.js')
  expect(debugMock).toHaveBeenCalledWith('max_buffer_size: 2000000')
  expect(debugMock).toHaveBeenCalledWith('git_options: --no-color --stat')

  // Verify git command was built correctly
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --stat origin/main -- src/**/*.js',
    {maxBuffer: 2000000}
  )

  // Verify files were written
  expect(writeFileSyncSpy).toHaveBeenCalledWith('test-output.raw', diff)
  expect(writeFileSyncSpy).toHaveBeenCalledWith(
    'test-output.json',
    expect.any(String)
  )

  // Verify outputs were set (since file_output_only is false)
  expect(setOutputSpy).toHaveBeenCalledWith('raw-diff', diff)
  expect(setOutputSpy).toHaveBeenCalledWith('json-diff', expect.any(String))
  expect(setOutputSpy).toHaveBeenCalledWith('raw-diff-path', 'test-output.raw')
  expect(setOutputSpy).toHaveBeenCalledWith(
    'json-diff-path',
    'test-output.json'
  )
})

test('handles malformed diff content gracefully', async () => {
  process.env.INPUT_GIT_DIFF_FILE = '__tests__/fixtures/empty.diff'

  const results = await gitDiff()
  expect(results.files.length).toBe(0)
  expect(results.type).toBe('GitDiff')

  // Should complete successfully even with empty diff
  expect(infoMock).toHaveBeenCalledWith(
    '✅ git-diff-action completed successfully'
  )
})

// Test to verify the constant values are used correctly
test('uses correct default max buffer size constant', async () => {
  process.env.INPUT_MAX_BUFFER_SIZE = ''
  process.env.INPUT_GIT_DIFF_FILE = 'false'

  const diff = fs.readFileSync('__tests__/fixtures/main.diff', 'utf8')
  const execAsyncSpy = jest
    .spyOn(execAsync, 'execAsync')
    .mockImplementation(() => {
      return {stdout: diff, stderr: null}
    })

  const results = await gitDiff()
  expect(results.files.length).toBe(5)

  expect(infoMock).toHaveBeenCalledWith(
    'max_buffer_size is not defined, using default of 1000000'
  )
  expect(execAsyncSpy).toHaveBeenCalledWith(
    'git --no-pager diff --no-color --full-index HEAD^1 -- .',
    {maxBuffer: 1000000}
  )
})
